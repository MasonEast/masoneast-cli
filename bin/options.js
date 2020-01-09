module.exports = {
    filters: {
        'config/webpack.many.config.js': "!entry",
        'src/route/**/*': 'dva',
        'src/models/**/*': 'dva',
        'src/views/**/*': 'dva',
    },
    prompts: {
        name: {
            when: 'isNotTest',
            type: 'string',
            required: true,
            message: 'Project name',
        },
        description: {
            when: 'isNotTest',
            type: 'string',
            required: false,
            message: 'Project description',
            default: 'A React.js project',
        },
        author: {
            when: 'isNotTest',
            type: 'string',
            message: 'Author',
        },
        entry: {
            when: 'isNotTest',
            type: 'confirm',
            message: 'is a spa(单页面) program?',
        },
        dva: {
            when: 'isNotTest',
            type: 'confirm',
            message: 'Install dva?',
        },

        autoInstall: {
            when: 'isNotTest',
            type: 'list',
            message:
                'Should we run `npm install` for you after the project has been created? (recommended)',
            choices: [
                {
                    name: 'Yes, use NPM',
                    value: 'npm',
                    short: 'npm',
                },
                {
                    name: 'Yes, use Yarn',
                    value: 'yarn',
                    short: 'yarn',
                },
                {
                    name: 'No, I will handle that myself',
                    value: false,
                    short: 'no',
                },
            ],
        },

    },
}