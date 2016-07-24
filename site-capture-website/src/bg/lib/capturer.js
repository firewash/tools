'use strict';

const phantom = require('phantom');
const gConfig = require('../config.js');
const path = require('path');
const URL = require('url');
const loggie = require('../lib/loggie.js').logger;

const localConfig = {
    captureImageSaveFolder: gConfig.captureImageSaveFolder,
    captureImageQuality: gConfig.captureImageQuality,
    format: 'png'
};

class Capturer {
    /*
     *  option={url interval,name_prefix }
     * */
    capture(opt) {
        const folder = localConfig.captureImageSaveFolder;
        let pageIns = null;
        let phantomIns = null;
        const date = new Date(); // IOS时间
        const option = {
            url: opt.url,
            quality: opt.quality || localConfig.captureImageQuality,
            filename: opt.filename,
            format: opt.format || localConfig.format,
            timestamp_start_capture: date,
            timestamp_capture_complete: null,
            description: date.toString()
        };

        loggie.info('In capture fn, option: ', opt);

        return Promise.resolve().then(() =>
            phantom.create()
        ).then(ph => {
            loggie.info('Success: phantom.create,', option.url);
            phantomIns = ph;
            return ph ? ph.createPage() : Promise.reject({ message: 'Error in phantom.create.' });
        }).then(page => {
            loggie.info('Success: createPage, page default setting is :', option.url);
            pageIns = page;
            pageIns.setting('Cache-Control', 'max-age=0');// 清除缓存(防止多次抓取没有用)
            pageIns.setting('userAgent', gConfig.userAgent);// 这句话会导致程序出错中断执行
            pageIns.setting('viewportSize', { width: 1920, height: 1080 });
            // pageIns.setting('height', 4800);

            let url = option.url;
            if (!URL.parse(url).protocol) url = `http://${url}`;
            return pageIns.open(url);
        }).then(status => {
            let returnValue = null;
            if (status === 'success') {
                returnValue = status;
            } else {
                returnValue = Promise.reject({ message: 'Error in page open of phantom.' });
            }
            return returnValue;
        }).then(status => {
            loggie.info('Page open status: ', status, option.url);
            return new Promise(resolve => { // 给一些网站一些加载的时间
                loggie.info('Waiting page full loaded.');
                const fn = `function(){
                    // 这句话会导致导航的搜索框偏移到顶部，奇怪
                    // document.body.scrollTop = document.body.scrollHeight;
                }`;
                pageIns.evaluateJavaScript(fn);
                setTimeout(() => {
                    pageIns.evaluateJavaScript(fn);
                    setTimeout(() => {
                        resolve(status);
                    }, 1000);
                }, 1000);
            });
        }).then(() => {
            const prop = {
                format: option.format,
                quality: option.quality
            };
            const filepath = path.join(folder, `${option.filename}.${option.format}`);
            loggie.info('Will render page to:', filepath);
            return pageIns.render(filepath, prop);
        }).then(result => {
            // todo 页面304缓存时render都会失败
            loggie.info('Page render and save, result: ', result);
            pageIns.close();
            phantomIns.exit();
            pageIns = null;
            phantomIns = null;
            option.timestamp_capture_complete = new Date();
            // loggie.info(option);
            return option;
        });/* .catch(err=>{
            loggie.info('Capture inner error:',err);
            return Promise.reject(err);
        });*/
    }
}

module.exports = new Capturer();
