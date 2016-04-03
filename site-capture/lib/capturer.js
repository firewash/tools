"use strict";
var phantom = require('phantom');
var Global_CONFIG = require("../config.js");
var phantom_instance = null;
var path = require("path");

class Capturer {
    constructor(){
        this._CONFIG = {
            capture_image_save_folder: Global_CONFIG.capture_image_save_folder,
            capture_image_qulity:60
        };
    }

    get config(){
        return this._CONFIG;
     }
    set config(config){
        for (var i in config) {
            this._CONFIG[i] = config.i;//NodeJS JSON assign似乎有问题,先用此方法
        }
    }
    /*
     * option={url interval,name_prefix }
     *
     * */
    capture (option) {
        console.log("In capture fn, option: ",option );
        var url = option.url,
            name_prefix = option.name_prefix || "tool_site_capture_unknow_site";

        var date = new Date(); //IOS时间
        var time = date.getTime();
        var folder = this._CONFIG.capture_image_save_folder,
            filename = name_prefix + "_" + time,
            format = option.format || 'png';

        option.timestamp = date;
        option.filename = filename;
        option.format = format;
        option.description = date.toString();

        return new Promise((resolve,reject) => {
            var err = null, returnData = {},  _page = null;
            var p = null;
            if(phantom_instance){
                p = new Promise((resolve)=>{
                    resolve(phantom_instance);
                });
            }else{
                p = phantom.create();
                //一天关闭一次
                setTimeout(function(){
                    var _ph = phantom_instance;
                    phantom_instance = null;
                    _ph.exit();
                },24*60*60*1000);
            }

            p.then( ph => {
                console.log("Success: phantom.create,",url)
                phantom_instance = ph;
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
                        quality: option.quality || this._CONFIG.capture_image_qulity
                    };
                    var filepath = path.join(folder,filename + "." + format);
                    console.log("Will render page to:",filepath);
                    var promise = _page.render(filepath, prop);
                    return promise;
                }
            }).then( result => {
                //?? 页面304缓存时render都会失败
                console.log("Page render and save, result: ", result);
                _page.close();
                option.timestamp_capture_complete = new Date();
                //console.log("Capture callback type is ", typeof callback);
                result?resolve(option):reject({msg:"page render error"});
            });
            Promise.resolve(p);
        });
    }
}

module.exports = new Capturer();
