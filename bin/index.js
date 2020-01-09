#!/usr/bin/env node
/**
 * 实现功能：
 * 
 * 1. 从git上download和clone项目模板
 * 2. 保存模板到本地，方便离线使用
 * 3. 询问问题， 按用户需求定制模板 
 * 
 */
const chalk = require('chalk');                             //字体颜色
const program = require('commander');                       //命令
const packageConfig = require('../package');
const path = require('path')
const ora = require('ora')                                 //旋转spiner
const exists = require('fs').existsSync

//download
const downloadUrl = require('download')
const home = require('user-home')                           //获取用户home路径
const gitclone = require('git-clone')
const rm = require('rimraf').sync                           //删除文件

//generator
const Metalsmith = require('metalsmith')                    //读写文件， 并通过中间件处理文件
const inquirer = require('inquirer')                        //询问问题， 与用户交互
const async = require('async')                              //异步处理
const Handlebars = require('handlebars')                    //模板引擎
const render = require('consolidate').handlebars.render     //根据模板引擎进行页面填充
const match = require('minimatch')
const options = require('./options')

// register handlebars helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
    return a === b
        ? opts.fn(this)
        : opts.inverse(this)
})

const tmpPath = path.join(home, '.masoneast-template')          //将模板下载到本地的路径， 方便后续初始化项目时直接从本地copy
const tmpUrl = 'https://github.com/MasonEast/masoneast-template.git' //项目模板的git clone地址
const projectPath = (name = 'react-project') => path.resolve(name)                //创建项目的路径
//commander:
//使用方括号声明，即传值不是必须的
//选项跟一个值（使用尖括号声明, 必须）

program.version(packageConfig.version).usage('<command> [options]');

// output help information on unknown commands
program.arguments('<command>').action((cmd) => {
    program.outputHelp();
    console.log(chalk.red(`Unknown command ${chalk.yellow(cmd)}`));
    console.log();
});

program
    .command('init [project-name]')
    .description('create a project')
    .option("-c, --clone", `it will clone from ${tmpUrl}`)
    .option('--offline', 'use cached template')
    .action(function (name, options) {
        console.log('we are try to create "%s"....', name);
        downloadAndGenerate(name, options)
    }).on('--help', function () {
        console.log('');
        console.log('Examples:');
        console.log('');
        console.log('  $ masoneast init my-project');
        console.log(`  $ path: ${home}`);
    });

program.parse(process.argv)

function downloadAndGenerate (name, {clone, offline}) {
    if(offline && exists(tmpPath)){                                           //离线使用， 前提是本地有模板
        generate(name, tmpPath, projectPath(name), err => {
            if (err) {
                console.log(err)
                return
            }
            console.log()
            logger.success('Generated "%s".', name)
        })
        return 
    }

    const spinner = ora('downloading template')
    spinner.start()
    if (exists(tmpPath)) rm(tmpPath)                        //如果之前本地有则移除
    download(name, clone, err => {
        spinner.stop()
        if (err) console.error(chalk.red('Failed to download repo ' + name + ': ' + err.message.trim()))
        generate(name, tmpPath, projectPath(name), err => {
            if (err) {
                console.log(err)
                return
            }
            console.log()
            logger.success('Generated "%s".', name)
        })
    })
}

function download (name, clone, fn) {
    if (clone) {
        gitclone(tmpUrl, tmpPath, err => {
            if (err) fn(err)
            rm(tmpPath + '/.git')
            fn()
        })
    } else {
        const url = tmpUrl.replace(/\.git*/, '') + '/archive/master.zip'
        console.log(url)
        downloadUrl(url, tmpPath, { extract: true, strip: 1, mode: '666', headers: { accept: 'application/zip' } })
            .then(function (data) {
                fn()
            })
            .catch(function (err) {
                fn(err)
            })
    }
}

function generate (name, tmpPath, projectPath, done) {
    // const metalsmith = Metalsmith(path.join(path.join(home, '.vue-templates'), 'webpack', 'template'))
    const metalsmith = Metalsmith(path.join(home, '.masoneast-template'))

    metalsmith.use(askQuestion(options.prompts))                            //这一段是generator的精华， 通过各种中间件对用户选择的模板进行处理
        .use(filterFiles(options.filters))                                  //文件筛选过滤
        .use(renderTemplateFiles())           //模板内部变量渲染
        .source('.')
        .destination(projectPath)                                   //项目创建的路径
        .build((err, files) => {
            if (err) console.log(err)

        })


}

function askQuestion (prompts) {                    //询问交互
    return (files, metalsmith, done) => {
        async.eachSeries(Object.keys(prompts), (key, next) => {
            prompt(metalsmith.metadata(), key, prompts[key], next)
        }, done)
    }
}

function prompt (data, key, prompt, done) {                    //将用户操作存储到metaData中
    inquirer.prompt([{
        type: prompt.type,
        name: key,
        message: prompt.message || prompt.label || key,
        default: prompt.default,
        choices: prompt.choices || [],
        validate: prompt.validate || (() => true)
    }]).then(answers => {
        if (Array.isArray(answers[key])) {
            data[key] = {}
            answers[key].forEach(multiChoiceAnswer => {
                data[key][multiChoiceAnswer] = true
            })
        } else if (typeof answers[key] === 'string') {
            data[key] = answers[key].replace(/"/g, '\\"')
        } else {
            data[key] = answers[key]
        }
        done()
    }).catch(done)
}

function filterFiles (filters) {                    //根据用户选择对模板文件进行过滤
    return (files, metalsmith, done) => {
        filter(files, filters, metalsmith.metadata(), done)
    }
}

function filter (files, filters, data, done) {

    Object.keys(filters).forEach(filterItem => {
        Object.keys(files).forEach(file => {
            if (match(file, filterItem, { dot: true })) {
                const condition = filters[filterItem]
                if (!evaluate(condition, data)) {                                   //加一层容错， 存在即删除
                    delete files[file]
                }
            }
        })
    })
    done()
}

function evaluate (exp, data) {
    const fn = new Function('data', 'with (data) { return ' + exp + '}')            //动态创建函数， 先返回data上的exp， 如果data没有就返回exp，解决用户不选择， 直接回车的情况
    try {
        return fn(data)
    } catch (e) {
        console.error(chalk.red('Error when evaluating filter condition: ' + exp))
    }
}

function renderTemplateFiles () {

    return (files, metalsmith, done) => {

        const keys = Object.keys(files)
        const metalsmithMetadata = metalsmith.metadata()            //之前用户操作后的数据存在这里面
        async.each(keys, (file, next) => {                          //对模板进行遍历， 找到需要渲染内容的文件
            const str = files[file].contents.toString()
            if (!/{{([^{}]+)}}/g.test(str)) {                       //正则匹配文件内容， 如果没有就不需要修改文件， 直接去往下一个
                return next()
            }
            render(str, metalsmithMetadata, (err, res) => {
                if (err) {
                    err.message = `[${file}] ${err.message}`
                    return next(err)
                }
                files[file].contents = new Buffer(res)
                next()
            })
        }, done)
    }
}