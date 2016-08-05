'use strict';

const phantom = require('phantom');
const config = require('../config');
const agent = config.agent;
const path = require('path');
const URL = require('url');
const loggie = require('../lib/loggie').logger;

class Capturer {
    /*
     *  option={
     *  url
     *  interval
     *  name_prefix
      *  base64: bool 是否base64, 如果是，则直接转化为base64字符串，不会在磁盘上创建文件
     *  }
     * */
    capture(opt) {
        const folder = config.captureImageSaveFolder;
        let pageIns = null;
        let phantomIns = null;
        const date = new Date(); // IOS时间
        const option = {
            url: opt.url,
            quality: opt.quality || config.captureImageQuality,
            filename: opt.filename,
            base64: opt.base64,
            format: opt.format || config.format,
            timestamp_start_capture: date,
            timestamp_capture_complete: null,
            agent_width: opt.agent_width || agent.width,
            agent_height: opt.agent_height || agent.height,
            useragent: opt.useragent || agent.useragent,
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
            pageIns.setting('userAgent', option.useragent);// 这句话会导致程序出错中断执行
            // PhantomJS的Viewport对Render是无效的。因为类似于浏览器的打印。
            return pageIns.property('viewportSize', {
                width: option.agent_width,
                height: option.agent_height
            });
        }).then(() => {
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
                // todo
                const fn = `function(){
                    document.body.innerHTML += window.screen.width+','+window.screen.height+','+navigator.userAgent;
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
            let next = null;
            if (option.base64) {
                loggie.info('Will render page to base64 format');
                next = pageIns.renderBase64(option.format);

            } else {
                const prop = {
                    format: option.format,
                    quality: option.quality
                };
                const filepath = path.join(folder, `${option.filename}.${option.format}`);
                loggie.info('Will render page to:', filepath);
                next = pageIns.render(filepath, prop);
            }
            return next;
        }).then(result => {
            // todo 页面304缓存时render都会失败
            loggie.info('Page render result: OK');
            option.renderResult = result;
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
