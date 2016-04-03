/**
 * 业务运行时的全局配置.
 *
 * 注意:capture相关几个工程的配置要同步.
 *
 * */
var path = require('path');
var project_path = __dirname;
var data_path = path.join(project_path,"../","/site-capture-data/");
var capture_image_save_folder = path.join(data_path,"/result/");
var userAgent = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36";
userAgent += ' SiteCapture/1.0';


var GLOBAL_CONFIG = {
    project_path:project_path,          //当前项目文件夹,虽然__dirname也好用,但是自己封装更放心
    capture_image_save_folder: capture_image_save_folder,//屏幕截图放置的磁盘位置
    capture_image_qulity: 60,           //屏幕截图的质量
    image_compare_ratio_baseline:0.01,  //图像相似度的最低阈值
    userAgent:userAgent,                //捕获网站时phantom发出的UA
}

module.exports = GLOBAL_CONFIG;