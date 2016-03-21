/**
 * Created by wangle on 2016/1/31.
 *
 * TODO: 抓图，分析，报警，应该独立成三个不同的任务进程，其中心围绕task表
 *
 */
var phantom = require('phantom');
//var comparer = require("lib/image-comparer");
var fs = require("fs");
var resemble = require('node-resemble-js');

var Global_CONFIG = {
    capture_image_save_folder: "data/result/",
    capture_image_qulity: 60
}

function Comparer() {
    resemble.outputSettings({
        errorColor: {
            red: 255,
            green: 0,
            blue: 255
        },
        errorType: 'movement',
        transparency: 0.3
    });
}

Comparer.prototype = {
    //对比两个文件，并将对比结果图片写入磁盘
    //opt={file1 file2 resultfile ratio}
    diff: function (opt, callback) {
        console.log("Inner diff function. opt is:",opt);
        var target = opt.target, other = opt.other, resultfile = opt.resultfile, ratio = opt.ratio || 0.01;

        var _diff = null;
        try{
            resemble(target).compareTo(other).ignoreColors().ignoreAntialiasing().onComplete(function (data) {
                if (+data.misMatchPercentage <= ratio) {
                    callback({msg: "misMatchPercentage is too low,donnot save compare result~"}, null);
                } else {
                    console.log("Save diff image to ",resultfile);
                    data.getDiffImage().pack().pipe(fs.createWriteStream(resultfile));
                    callback(null, opt);
                }
            });
        }catch (e){//TODO: 文件比如other在磁盘上不存在时的异常，try目前捕获不到。奇怪
            callback({msg: e.msg}, null);
        }
        return _diff;
    }
};

function Capturer() {}
Capturer.prototype = {
    /*
     * option={url interval,name_prefix }
     *
     * */
    capture: function (option, callback) {
        console.log("in capture fn   ");
        var url = option.url, interval = option.interval || 1000, name_prefix = option.name_prefix || "tool_site_capture_unknow_site";

        var now = new Date();
        var time = now.getTime();
        var folder = Global_CONFIG.capture_image_save_folder, filename = name_prefix + "_" + time, format = option.format || 'png';

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
                    quality: option.quality || Global_CONFIG.capture_image_qulity
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

function DBOperator() {
    var mongodb = require("mongodb");
    var MongoClient = mongodb.MongoClient;
    //var assert = require('assert');
    var databaseUrl = "admin:admin@localhost:27017/tools_site_capture";
    var collections = ["origin_captures", "diff_captures", "tasks"];
    var url = 'mongodb://localhost:27017/tools_site_capture';

    this.db = null;
    this.MongoClient = MongoClient;
    this.url = url;
    //this.connect();
}

DBOperator.prototype = {
    connect: function (callback) {
        this.MongoClient.connect(this.url, function (err, db) {
            console.log(err ? "MongoDB connnect error!" : "MongoDB connnect success~.");
            this.db = db;
            callback && callback(err, db);
        });
    },
    close: function () {
        this.db && this.db.close();
    },
    saveCaptureData: function (data, callback) {
        var self = this;
        this.connect(function (err,result) {
            if(err){
                callback && callback(err);
                return;
            }
            console.log("Will save capture data:", data);
            this.db.collection('origin_captures').insertOne(data, function (err, result) {
                console.log("Insert success , in fn saveCaptureData.");
                callback && callback(err, result);
                self.close();
            });
        });
    },
    getCaptureData: function (callback) {
        this.connect(function () {
            var cursor = this.db.collection("origin_captures").find();

            cursor.each(function (err, item) {
                if (item) {
                    console.log(item);
                } else {
                    console.log("over");
                }
            });
        });

    },
    getLastestCapture: function (opt, callback) {
        console.log("Get lastest capture in DB:", opt.url);
        var queryCondition = {
            url: opt.url
        };

        this.connect(function (err, result) {
            if(err){
                callback(err);
                return;
            }
            var cursor = this.db.collection("origin_captures").find(queryCondition).sort({key: -1}).limit(1);
            var item = null;
            console.log("Query end.");
            if(cursor.hasNext())item = cursor.next();
            if (item) {
                item.then(function(data){
                    console.log("Find one item:",data);
                    callback(null, data);
                })
                return;
            } else {
                callback({msg: "No result."});
            }

        });
    }
};

function main() {
    var taskList = [
        {
            url: "http://www.uc123.com",
            interval : "100000", //毫秒
            name_prefix: "uc123_home"
        }
    ];

    var capturer = new Capturer();
    var comparer = new Comparer();
    var dboperator = new DBOperator();

    taskList.forEach(function (opt) {
        var afterCompare = function (err, data) {
            console.log("capture thenable.");
            if (!err) {
                dboperator.saveCaptureData(data, function (err, result) {
                    if (!err) {
                        //comparer.checkItemById(result.insertedId);
                    }
                });
            }
        };

        var afterCapture = function (err, target_data) {
            /*
             * dboperator.getCaptureData();
             * return;
             */
            console.log("In afterCpture,target is:", target_data);
            if (err) {
                console.log("Error:", err);
                return;
            }
            dboperator.getLastestCapture({url: target_data.url}, function (err, last_data) {
                if (err || !last_data) {
                    console.log("Error:", err.msg);
                    dboperator.saveCaptureData(target_data, function () {
                    });
                    return;
                }

                console.log("Has a pre capture, now diff with it.");
                var opt = {
                    target: Global_CONFIG.capture_image_save_folder + target_data.filename + "." + target_data.format,
                    other: Global_CONFIG.capture_image_save_folder + last_data.filename + "." + last_data.format,
                    resultfile: Global_CONFIG.capture_image_save_folder + target_data.filename + "_diff" + "." + target_data.format
                };
                console.log("before diff, opt is: ", opt);
                comparer.diff(opt, function (err, data) {
                    if (err) {
                        console.log("Diff failed. As,", err.msg);
                    }else{
                        console.log("Diff success. add diff info  to target data");
                        target_data.diffimg = opt.resultfile;
                        target_data.diffwith = last_data._id;
                    }
                    console.log("Will save target data.")
                    dboperator.saveCaptureData(target_data, function () {
                    });
                })
            });
        }

        capturer.capture(opt, afterCapture);//立即执行一次任务
        if (opt.interval) {//如果配置了任务，则定时执行
            setInterval(function () {
                capturer.capture(opt, afterCapture);
            }, opt.interval);
        }
    });
};
main();
