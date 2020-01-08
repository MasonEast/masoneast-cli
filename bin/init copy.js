#!/usr/bin/env node
const chalk = require('chalk');
const program = require('commander');
const packageConfig = require('../package');
const child_process = require('child_process');


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
    .command('create [program]')
    .description('create a program')
    .option(
        '-p, --path <path>',
        'the program‘s path'
    )
    .on('--help', () => {
        console.log('');
        console.log('Examples:');
        console.log('  $ cool start');
        console.log('  $ cool start block');
        console.log('  $ cool start @icedesign/user-landing-block');
        console.log('  $ cool start @icedesign/user-landing-block -n CustomBlock');
    })
    .action(async (program, cmd) => {
        child_process.spawn('git', ['clone', 'https://github.com/MasonEast/masoneast-cli.git'], {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true             // 只在windows电脑上开启，mac上不影响，防止产生无效进程
        })
    });
program.parse(process.argv);

