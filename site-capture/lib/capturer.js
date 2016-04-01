"use strict";
var phantom = require('phantom');
var Global_CONFIG = require("../config.js");

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
            interval = option.interval || 1000,
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
            var err = null, returnData = {},_ph = null, _page = null;
            var p = phantom.create();
            p.then( ph => {
                console.log(" phantom.create then")
                _ph = ph;
                return _ph.createPage();
            }).then( page =>  {
                console.log(" createPage then, page default setting is :",page.settings)
                _page = page;
                _page.settings.userAgent = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36";
                return page.open(url)
            }).then( status => {
                console.log("Page open status: " + status);
                if (status === "success") {
                    var prop = {
                        format: format,
                        quality: option.quality || this._CONFIG.capture_image_qulity
                    };
                    var filepath = folder + filename + "." + format;
                    console.log("Will render page to:",filepath);
                    var promise = _page.render(filepath, prop);
                    return promise;
                }
            }).then( result => {
                console.log("Page render and save, result: ", result);
                _page.close();
                _ph.exit();
                //console.log("Capture callback type is ", typeof callback);
                result?resolve(option):reject({msg:"page render error"});
            });
            Promise.resolve(p);
        });
    }
}

module.exports = new Capturer();
