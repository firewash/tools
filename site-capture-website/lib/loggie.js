'use strict';

const path = require('path');
const log4js = require('log4js');
const config = require('../config');

log4js.configure({
    appenders: [
        { type: 'console', category: 'console' },
        // todo wangle 不生效~再试试
        { type: 'file', filename: config.logPath, category: 'console', reloadSecs: 300 }
    ],
    replaceConsole: true
});

const logger = log4js.getLogger('console');

module.exports = logger;

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
