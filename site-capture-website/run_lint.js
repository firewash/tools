const CLIEngine = require('eslint').CLIEngine;


const cli = new CLIEngine({
    envs: ['browser', 'mocha'],
    useEslintrc: true,
    rules: {
        semi: 2
    }
});

// lint myfile.js and all files in lib/
const report = cli.executeOnFiles(['lib']);
console.log(report);