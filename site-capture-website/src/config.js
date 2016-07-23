'use strict';

/**
 * 业务运行时的全局配置.
 *
 * 注意:capture相关几个工程的配置要同步.
 *
 * */
const loggie = require('./lib/loggie').logger;
const path = require('path');
const projectPath = path.join(__dirname, '..');
// loggie.info('工程目录: ', projectPath);
const distPath = path.join(projectPath, 'build');
const mode = (process.env.MODE || '').trim() || 'dev';
const dataPath = path.join(projectPath, '../', '/site-capture-data/');
// todo: logPath和accessLogPath并结合loggie处理，这里区分mode的三种情况还有待于优化
const logPath = (function getLogPath() {
    let p = null;
    if (mode === 'production') {
        p = path.join(dataPath, './log/console');
    } else if (mode === 'dev') {
        p = path.join(dataPath, './log-dev-mode/console');
    }
    return p;
}());
const accessLogPath = (function getLogPath() {
    let p = null;
    if (mode === 'production') {
        p = path.join(dataPath, '/log/accesslog');
    } else if (mode === 'dev') {
        p = path.join(dataPath, '/log-dev-mode/accesslog');
    }
    return p;
}());
const captureImageSaveFolder = path.join(dataPath, '/result/');
const userAgentBase = 'Mozilla/5.0 (Windows NT 10.0; WOW64) Chrome/49.0.2623.87 Safari/537.36';
const userAgent = `${userAgentBase} SiteCapture/1.0`;

const GLOBAL_CONFIG = {
    domain: '100.85.133.144',   // 网站域名
    port: (function getPort() {
        let port = 80;
        if (mode === 'production') {
            port = 80;
        } else {
            port = 3000;
        }
        return port;
    }()),
    mode,
    projectPath,          // 当前项目文件夹,虽然__dirname也好用,但是自己封装更放心
    distPath,
    captureImageSaveFolder, // 屏幕截图放置的磁盘位置
    captureImageQuality: 90,           // 屏幕截图的质量
    namePrefix: 'tool_site_capture_unknown_site',   // 图片存储的前缀
    image_compare_ratio_baseline: 0.01,  // 图像相似度的最低阈值
    userAgent,                // 捕获网站时phantom发出的UA
    logPath,    // 通用日志的存储文件
    accessLogPath   // 仅仅存储Express访问记录
};

module.exports = GLOBAL_CONFIG;
