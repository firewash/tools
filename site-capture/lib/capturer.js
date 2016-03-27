"use strict";
var phantom = require('phantom');

class Capturer {
    constructor(){
        this._CONFIG = {
            capture_image_save_folder:"data/result/",
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
        console.log("in capture fn   ");
        var url = option.url, interval = option.interval || 1000, name_prefix = option.name_prefix || "tool_site_capture_unknow_site";

        var now = new Date();
        var time = now.getTime();
        var folder = this._CONFIG.capture_image_save_folder, filename = name_prefix + "_" + time, format = option.format || 'png';

        option.filename = filename;
        option.format = format;
        option.description = now.toString();

        return new Promise((resolve,reject) => {
            var err = null, returnData = {},_ph = null, _page = null;
            var p = phantom.create();
            p.then( ph => {
                _ph = ph;
                return _ph.createPage();
            }).then( page =>  {
                _page = page;
                return page.open(url)
            }).then( status => {
                console.log("Page open status: " + status);
                if (status === "success") {
                    var prop = {
                        format: format,
                        quality: option.quality || this._CONFIG.capture_image_qulity
                    };
                    var promise = _page.render(folder + filename + "." + format, prop);
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
