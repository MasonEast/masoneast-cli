#!/usr/bin/env node
const chalk = require('chalk');
const program = require('commander');
const packageConfig = require('../package');
const child_process = require('child_process');
const path = require('path')
const ora = require('ora')
const exists = require('fs').existsSync

//download
const downloadUrl = require('download')
const home = require('user-home')
const gitclone = require('git-clone')
const rm = require('rimraf').sync

//generator
const Metalsmith = require('metalsmith')

const tmpPath = path.join(home, '.masoneast-template')          //将模板下载到本地的路径， 方便后续初始化项目时直接从本地copy
const tmpUrl = 'https://github.com/MasonEast/masoneast-template.git' //项目模板的git地址
const projectPath = (name) => path.resolve(name)                //创建项目的路径
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
    .action(function (name, options) {
        console.log('we are try to create "%s"....', name);
        console.log(options.clone)
        downloadAndGenerate(name, options.clone)
    }).on('--help', function () {
        console.log('');
        console.log('Examples:');
        console.log('');
        console.log('  $ masoneast init my-project');
        console.log(`  $ path: ${home}`);
    });

program.parse(process.argv)

function downloadAndGenerate (name, clone) {
    const spinner = ora('downloading template')
    spinner.start()
    if (exists(tmpPath)) rm(tmpPath)                        //如果之前本地有则移除
    // download(name, clone, err => {
    //     spinner.stop()
    //     if (err) console.error(chalk.red('Failed to download repo ' + name + ': ' + err.message.trim()))
    //     generate(name, tmpPath, projectPath(name), err => {
    //         if (err) {
    //             console.log(err)
    //             return
    //         }
    //         console.log()
    //         logger.success('Generated "%s".', name)
    //     })
    // })
    generate(name, tmpPath, projectPath(name), err => {
        if (err) {
            console.log(err)
            return
        }
        console.log()
        logger.success('Generated "%s".', name)
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
        downloadUrl(tmpUrl, tmpPath, { extract: true, strip: 1, mode: '666', headers: { accept: 'application/zip' } })
            .then(function (data) {
                fn()
            })
            .catch(function (err) {
                fn(err)
            })
    }
}

function generate (name, tmpPath, projectPath, done) {
    const metalsmith = Metalsmith(path.join(path.join(home, '.vue-template'), 'webpack', 'template'))
    console.log(metalsmith, metalsmith.metadata())
}

