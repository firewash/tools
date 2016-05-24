var CLIEngine = require("eslint").CLIEngine;

var cli = new CLIEngine({
    envs: ["browser", "mocha"],
    useEslintrc: true,
    rules: {
        semi: 2
    }
});

// lint myfile.js and all files in lib/
var report = cli.executeOnFiles(["lib"]);
console.log(report);