'use strict';

/**
 * 业务运行时的全局配置.
 *
 * 注意:capture相关几个工程的配置要同步.
 *
 * */
const path = require('path');

// 环境配置
const projectPath = path.join(__dirname, '../..');
const distPath = path.join(projectPath, 'build');
const mode = (process.env.MODE || '').trim() || 'dev';
console.log('工程目录: ', projectPath);  // eslint-disable-line

// 日志数据的配置
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
// 截屏浏览器的配置
const userAgentBase = 'Mozilla/5.0 (Windows NT 10.0; WOW64) Chrome/49.0.2623.87 Safari/537.36';
const useragent = `${userAgentBase} SiteCapture/1.0`;

// 对外提供服务的网站域名和端口
const domain = '100.85.133.144';
const port = {
    production: 80,
    dev: 3000
}[mode] || 80;

// 数据库配置
const db = {
    url: 'mongodb://localhost:27017/tools_site_capture',
    username: '',
    password: ''
};

module.exports = {
    domain,
    port,
    mode,
    db,
    projectPath,          // 当前项目文件夹,虽然__dirname也好用,但是自己封装更放心
    distPath,
    captureImageSaveFolder, // 屏幕截图放置的磁盘位置
    format: 'png',
    captureImageQuality: 90,           // 屏幕截图的质量
    namePrefix: 'tool_site_capture_unknown_site',   // 图片存储的前缀
    image_compare_ratio_baseline: 0.01,  // 图像相似度的最低阈值
    agent: {
        width: 600,   // 渲染网页的浏览器默认宽高。哎，设置用处也不大啊。
        height: 1000,
        useragent          // 捕获网站时phantom发出的UA
    },
    logPath,    // 通用日志的存储文件
    accessLogPath   // 仅仅存储Express访问记录
};
