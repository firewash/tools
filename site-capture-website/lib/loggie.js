'use strict';

const log4js = require('log4js');
const config = require('../config');

log4js.configure({
    appenders: [
        // 后台运行的记录
        { type: 'console', category: 'console' },
        {
            type: 'dateFile',
            filename: config.logPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            reloadSecs: 300,
            category: 'console'
        },
        // accessLog:用户访问记录
        { type: 'console', category: 'accessLog' },
        {
            type: 'dateFile',
            filename: config.accessLogPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            category: 'accessLog'
        },
        // 单元测试
        {
            type: 'dateFile',
            filename: config.logPath,
            pattern: '_yyyy-MM-dd-unittest.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            reloadSecs: 300,
            category: 'unittest' // 啥都不做
        }
    ],
    replaceConsole: true
});

let logger = null;
let accessLog = null;
switch (config.mode) {
case 'dev':
    logger = log4js.getLogger('console');
    accessLog = log4js.getLogger('accessLog');
    break;
case 'production':
    logger = log4js.getLogger('console');
    accessLog = log4js.getLogger('accessLog');
    break;
case 'unittest':
    logger = log4js.getLogger('unittest');
    accessLog = log4js.getLogger('unittest');
    break;
default:
    Error('木有指定工程运行模式');
}

module.exports = {
    logger,
    midLogger: {
        use(app) {
            // 页面请求日志,用auto的话,默认级别是WARN
            // app.use(log4js.connectLogger(dateFileLog, {level:'auto', format:':method :url'}));
            app.use(log4js.connectLogger(accessLog, { level: log4js.levels.TRACE, format: ':remote-addr     :method     :url    :user-agent' }));
        }
    }

};

/**
 * Exmple
 *
 loggie.debug('Some debug messages');
 loggie.trace('Entering cheese testing');
 loggie.debug('Got cheese.');
 loggie.info('Cheese is Gouda.');
 loggie.warn('Cheese is quite smelly.');
 loggie.error('Cheese is too ripe!');
 loggie.fatal('Cheese was breeding ground for listeria.');

 * */
