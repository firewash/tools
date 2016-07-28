const path = require('path');

// busyness
const capturer = require('../src/bg/lib/capturer');
const notify = require('../src/bg/lib/notify');
const taskmanager = require('../src/bg/lib/taskmanager');
const comparer = require('../src/bg/lib/comparer');

const testCaseFolder = __dirname;

const opt = {
    target: path.join(testCaseFolder, 'assets/target.png'),
    other: path.join(testCaseFolder, 'assets/other.png'),
    resultfile: path.join(testCaseFolder, 'assets/result.png'),
    ignore: [[0,0,100,100]]
};
comparer.diff(opt);