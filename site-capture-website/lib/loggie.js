'use strict';

const log4js = require('log4js');
const config = require('../config');

log4js.configure({
    appenders: [
        { type: 'console', category: 'console' },
        // todo wangle 不生效~再试试
        { type: 'file', filename: config.logPath, category: 'console', reloadSecs: 300 },
        { type: 'console', category: 'accessLog' },
        {
            type: 'dateFile',
            filename: config.accessLogPath,
            pattern: '_yyyy-MM-dd.log',
            alwaysIncludePattern: true,
            maxLogSize: 1024,
            category: 'accessLog'
        }
    ],
    replaceConsole: true
});

const logger = log4js.getLogger('console');
const accessLog = log4js.getLogger('accessLog');

module.exports = {
    logger,
    midLogger: {
        use(app) {
            // 页面请求日志,用auto的话,默认级别是WARN
            // app.use(log4js.connectLogger(dateFileLog, {level:'auto', format:':method :url'}));
            app.use(log4js.connectLogger(accessLog, { level: 'debug', format: ':method :url' }));
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
