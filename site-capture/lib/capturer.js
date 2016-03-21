var phantom = require('phantom');

var CONFIG = {
    capture_image_save_folder: "data/result/",
    capture_image_qulity: 60
};

function Capturer() {}
Capturer.prototype = {
    _CONFIG:{
        capture_image_save_folder: "data/result/",
        capture_image_qulity: 60
    },
    get config(){
        return this._CONFIG;
    },
    set config(config){
       for(var i in config){
           this._CONFIG[i] = config.i;//NodeJS JSON assign似乎有问题,先用此方法
       }
    },
    /*
     * option={url interval,name_prefix }
     *
     * */
    capture: function (option, callback) {
        console.log("in capture fn   ");
        var url = option.url, interval = option.interval || 1000, name_prefix = option.name_prefix || "tool_site_capture_unknow_site";

        var now = new Date();
        var time = now.getTime();
        var folder = CONFIG.capture_image_save_folder, filename = name_prefix + "_" + time, format = option.format || 'png';

        option.filename = filename;
        option.format = format;
        option.description = now.toString();

        var err = null, returnData = {};
        // var promise = new Promise(function(){console.log("haha")});

        var _ph, _page;
        phantom.create().then(function (ph) {
            _ph = ph;
            return _ph.createPage();
        }).then(function (page) {
            _page=page;
            return page.open(url)
        }).then(function (status) {
            console.log("Page open status: " + status);
            if (status === "success") {
                var prop = {
                    format: format,
                    quality: option.quality || CONFIG.capture_image_qulity
                };
                return _page.render(folder + filename + "." + format, prop);
            }
        },function(){

        }).then(function(result){
            console.log("Page render and save, result: ", result);
            _page.close();
            _ph.exit();
            //console.log("Capture callback type is ", typeof callback);
            callback && callback(err, option);
        });
    }
};

module.exports = new Capturer();
