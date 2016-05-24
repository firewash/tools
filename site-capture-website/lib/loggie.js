var path = require("path");
var log4js = require("log4js");

log4js.configure({
    appenders: [
        {"type": "console", "category": "console"},
        { type: 'file', filename: '../log/capture.log', category: 'cheese'  ,reloadSecs: 300  }  //todo wangle 不生效~再试试
    ],
    replaceConsole: true
});

var log4js = require('log4js');
var logger = log4js.getLogger("cheese");

module.exports = logger;

/**
 * Exmple
 *
 loggie.debug("Some debug messages");
 loggie.trace('Entering cheese testing');
 loggie.debug('Got cheese.');
 loggie.info('Cheese is Gouda.');
 loggie.warn('Cheese is quite smelly.');
 loggie.error('Cheese is too ripe!');
 loggie.fatal('Cheese was breeding ground for listeria.');

 * */
