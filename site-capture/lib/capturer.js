"use strict";
var phantom = require('phantom');
var Global_CONFIG = require("../config.js");
var path = require("path");

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
    capture (option) {
        console.log("In capture fn, option: ",option );
        var url = option.url,
            name_prefix = option.name_prefix || _CONFIG.name_prefix,
            quality = option.quality || _CONFIG.capture_image_qulity,
            format = option.format || _CONFIG.format;

        var date = new Date(); //IOS时间
        var time = date.getTime();
        var folder = _CONFIG.capture_image_save_folder,
            filename = name_prefix + "_" + time;
            ;

        option.timestamp = date;
        option.filename = filename;
        option.format = format;
        option.description = date.toString();

        var _page = null,_ph = null;

        return Promise.resolve().then(function(){
            return phantom.create();
        }).then( ph => {
            console.log("Success: phantom.create,",url);
            _ph=ph;
            return ph.createPage();
        }).then( page =>  {
            console.log("Success: createPage, page default setting is :",url)
            _page = page;
            page.setting('Cache-Control', "max-age=0");//清除缓存(防止多次抓取没有用)
            page.setting('userAgent', Global_CONFIG.userAgent||"Chrome/49");// 这句话会导致程序出错中断执行
            return page.open(url)
        }).then( status => {
            console.log("Page open status: " + status,url);
            if (status === "success") {
                var prop = {
                    format: format,
                    quality: quality
                };
                var filepath = path.join(folder,filename + "." + format);
                console.log("Will render page to:",filepath);
                var promise = _page.render(filepath, prop);
                return promise;
            }else{
                return false;
            }
        }).then( result => {
            //?? 页面304缓存时render都会失败
            console.log("Page render and save, result: ", result);
            _page.close();
            _ph.exit();
            option.timestamp_capture_complete = new Date();
            //console.log("Capture callback type is ", typeof callback);
            return option;
        });

    }
}

module.exports = new Capturer();
