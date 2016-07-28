'use strict';

const log4js = require('log4js');
const config = require('../config');

log4js.configure({
    appenders: [
        // 生产环境
        {
            type: 'console',
            category: 'production_bgLog'
        },
        {
            type: 'dateFile',
            filename: config.logPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            reloadSecs: 300,
            category: 'production_bgLog'
        },
        {
            type: 'console',
            category: 'production_accessLog'
        },
        {
            type: 'dateFile',
            filename: config.accessLogPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            category: 'production_accessLog'
        },
        // 开发 & 单元测试
        {
            type: 'dateFile',
            filename: config.logPath,
            pattern: '_yyyy-MM-dd-unittest.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            reloadSecs: 300,
            // category: 'dev_bgLog'
        },
        {
            type: 'console',
            category: 'dev_bgLog'
        },
        {
            type: 'console',
            category: 'dev_accessLog'
        },
        {
            type: 'dateFile',
            filename: config.accessLogPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            category: 'dev_accessLog'
        }

    ],
    replaceConsole: false
});

let logger = null;
let accessLog = null;
switch (config.mode) {
case 'production':
    logger = log4js.getLogger('production_bgLog');
    accessLog = log4js.getLogger('production_accessLog');
    break;
case 'dev':
case 'unittest':
default:
    logger = log4js.getLogger('dev_bgLog');
    accessLog = log4js.getLogger('dev_accessLog');
    break;
}

module.exports = {
    logger,
    midLogger: {
        use(app) {
            // 页面请求日志,用auto的话,默认级别是WARN
            // app.use(log4js.connectLogger(dateFileLog, {level:'auto', format:':method :url'}));
            app.use(log4js.connectLogger(accessLog, {
                level: log4js.levels.TRACE,
                format: ':remote-addr     :method     :url    :user-agent'
            }));
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
