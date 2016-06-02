'use strict';
/**
 * 业务运行时的全局配置.
 *
 * 注意:capture相关几个工程的配置要同步.
 *
 * */
const path = require('path');
const projectPath = __dirname;
const dataPath = path.join(projectPath, '../', '/site-capture-data/');
const logPath = path.join(__dirname, './log/console.log');
const accessLogPath = `${__dirname}/log/accesslog`;
const captureImageSaveFolder = path.join(dataPath, '/result/');
const userAgentBase = 'Mozilla/5.0 (Windows NT 10.0; WOW64) Chrome/49.0.2623.87 Safari/537.36';
const userAgent = `${userAgentBase} SiteCapture/1.0`;

const GLOBAL_CONFIG = {
    projectPath,          // 当前项目文件夹,虽然__dirname也好用,但是自己封装更放心
    captureImageSaveFolder, // 屏幕截图放置的磁盘位置
    captureImageQuality: 90,           // 屏幕截图的质量
    namePrefix: 'tool_site_capture_unknown_site',
    image_compare_ratio_baseline: 0.1,  // 图像相似度的最低阈值
    userAgent,                // 捕获网站时phantom发出的UA
    logPath,    // 通用日志的存储文件
    accessLogPath   // 仅仅存在Express访问记录
};

module.exports = GLOBAL_CONFIG;
