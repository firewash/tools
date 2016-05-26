'use strict';
const phantom = require('phantom');
const Global_CONFIG = require('../config.js');
const path = require('path');
const URL = require('url');
const loggie = require('../lib/loggie');

const _CONFIG = {
    capture_image_save_folder: Global_CONFIG.captureImageSaveFolder,
    capture_image_qulity:60,
    name_prefix: 'tool_site_capture_unknown_site',
    format: 'png'
};

class Capturer {
    /*
     * option={url interval,name_prefix }
     *
     * */
    capture (opt) {
        const folder = _CONFIG.captureImageSaveFolder;
        let _page = null;
        let _ph = null;

        const date = new Date(); // IOS时间
        const option = {
            url: opt.url,
            quality: opt.quality || _CONFIG.capture_image_qulity,
            filename: opt.filename,
            format: opt.format || _CONFIG.format,
            timestamp_start_capture: date,
            timestamp_capture_complete: null,
            description: date.toString()
        };

        loggie.info('In capture fn, option: ',opt );

        return Promise.resolve().then(() => {
            return phantom.create();
        }).then(ph => {
            loggie.info('Success: phantom.create,', option.url);
            _ph = ph;
            return ph ? ph.createPage() : Promise.reject({ message: 'Error in phantom.create.' });
        }).then( page => {
            loggie.info('Success: createPage, page default setting is :', option.url);
            _page = page;
            page.setting('Cache-Control', 'max-age=0');// 清除缓存(防止多次抓取没有用)
            page.setting('userAgent', Global_CONFIG.userAgent);// 这句话会导致程序出错中断执行

            let url = option.url;
            if (!URL.parse(url).protocol) url = `http://${url}`;
            return page.open(url);
        }).then(status => {
            return new Promise(resolve => { // 给一些网站一些加载的时间
                loggie.info('Waiting page full loaded.');
                setTimeout(() => {
                    resolve(status);
                }, 10000);
            });
        }).then(status => {
            loggie.info('Page open status: ', status, option.url);
            if (status === 'success') {
                const prop = {
                    format: option.format,
                    quality: option.quality
                };
                const filepath = path.join(folder, `${option.filename}.${option.format}`);
                loggie.info('Will render page to:', filepath);
                return _page.render(filepath, prop);
            } else {
                return Promise.reject({ message: 'Error in page open of phantom.' });
            }
        }).then( result => {
            // todo 页面304缓存时render都会失败
            loggie.info('Page render and save, result: ', result);
            _page.close();
            _ph.exit();
            option.timestamp_capture_complete = new Date();
            // loggie.info('Capture callback type is ', typeof callback);
            return option;
        });/* .catch(err=>{
            loggie.info('Capture inner error:',err);
            return Promise.reject(err);
        });*/

    }
}

module.exports = new Capturer();
