/**
 * 业务运行时的全局配置.
 *
 * 注意:capture相关几个工程的配置要同步.
 *
 * */
const path = require('path');
const projectPath = __dirname;
const data_path = path.join(projectPath, '../', '/site-capture-data/');
const log_path = path.join(__dirname, './log/console.log');
const captureImageSaveFolder = path.join(data_path, '/result/');
const userAgentBase = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36  SiteCapture/1.0';
const userAgent = userAgentBase + 'SiteCapture/1.0';


const GLOBAL_CONFIG = {
    projectPath,          // 当前项目文件夹,虽然__dirname也好用,但是自己封装更放心
    captureImageSaveFolder,// 屏幕截图放置的磁盘位置
    capture_image_qulity: 90,           // 屏幕截图的质量
    name_prefix: 'unknow_website',
    image_compare_ratio_baseline: 0.1,  // 图像相似度的最低阈值
    userAgent,                // 捕获网站时phantom发出的UA
    log_path: log_path
}

module.exports = GLOBAL_CONFIG;
