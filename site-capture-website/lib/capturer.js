"use strict";
var phantom = require('phantom');
var Global_CONFIG = require("../config.js");
var path = require("path");
var URL = require("url");

var _CONFIG = {
    capture_image_save_folder: Global_CONFIG.capture_image_save_folder,
    capture_image_qulity:60,
    name_prefix:"tool_site_capture_unknown_site",
    format:'png'
};

class Capturer {
    constructor(){}

    /*
     * option={url interval,name_prefix }
     *
     * */
    capture (opt) {
        console.log("In capture fn, option: ",opt );
        var date = new Date(), //IOS时间
            time = date.getTime(),
            folder = _CONFIG.capture_image_save_folder,
            name_prefix = opt.name_prefix || _CONFIG.name_prefix,
            _page = null,_ph = null;

        var option = {
            url: opt.url,
            quality: opt.quality || _CONFIG.capture_image_qulity,
            format: opt.format || _CONFIG.format,
            timestamp : date,
            filename : name_prefix + "_" + time,
            description : date.toString(),
            timestamp_capture_complete :  null,
        };

        return Promise.resolve().then(()=>{
            return phantom.create();
        }).then( ph => {
            console.log("Success: phantom.create,",option.url);
            _ph=ph;
            return ph?ph.createPage():Promise.reject({message:"Error in phantom.create."});
        }).then( page =>  {
            console.log("Success: createPage, page default setting is :",option.url);
            _page = page;
            page.setting('Cache-Control', "max-age=0");//清除缓存(防止多次抓取没有用)
            page.setting('userAgent', Global_CONFIG.userAgent||"Chrome/49");// 这句话会导致程序出错中断执行

            var url = option.url;
            if(!URL.parse(url).protocol) url = "http://"+url;
            return page.open(url)
        }).then(status=>{
            return new Promise((resolve)=>{ //给一些网站一些加载的时间
                console.log("Waiting page full loaded.")
                setTimeout(()=>{
                    resolve(status);
                },10000);
            });
        }).then( status => {
            console.log("Page open status: ", status, option.url);
            if (status === "success") {
                var prop = {
                    format: option.format,
                    quality: option.quality
                };
                var filepath = path.join(folder,option.filename + "." + option.format);
                console.log("Will render page to:",filepath);
                return _page.render(filepath, prop);
            }else{
                return Promise.reject({message:"Error in page open of phantom."});
            }
        }).then( result => {
            //?? 页面304缓存时render都会失败
            console.log("Page render and save, result: ", result);
            _page.close();
            _ph.exit();
            option.timestamp_capture_complete = new Date();
            //console.log("Capture callback type is ", typeof callback);
            return option;
        });/*.catch(err=>{
            console.log("Capture inner error:",err);
            return Promise.reject(err);
        });*/

    }
}

module.exports = new Capturer();
