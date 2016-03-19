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
        console.log("in diff function");
        var target = opt.target, other = opt.other, resultfile = opt.resultfile, ratio = opt.ratio || 0.01;

        var diff = resemble(target).compareTo(other).ignoreColors().ignoreAntialiasing().onComplete(function (data) {
            if (+data.misMatchPercentage <= ratio) {
                callback({msg: "misMatchPercentage is too low,donnot save compare result~"}, null);
            } else {
                data.getDiffImage().pack().pipe(fs.createWriteStream(resultfile));
                callback(null, opt);
            }
        });
    }
};

function Capturer() {

}

Capturer.prototype = {
    /*
     * option={url interval,name_prefix }
     *
     * */
    capture: function (option, callback) {
        console.log("capture callback : ", typeof callback)
        var url = option.url, interval = option.interval || 1000, name_prefix = option.name_prefix || "tool_site_capture_unknow_site";

        var now = new Date();
        var time = now.getTime();
        var folder = "result/", filename = name_prefix + "_" + time, format = option.format || 'png';

        option.folder = folder;
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
            console.log("page open status: " + status);
            if (status === "success") {
                var prop = {
                    format: format,
                    quality: option.quality || '100'
                };
                _page.render(folder + filename + "." + format, prop).then(function(result){

                });
                console.log("page render and save, ok",folder + filename + "." + format);
                // promise.resolve(option);
            } else {
                err = {
                    status: status,
                    msg: "page open failed"
                };
                //promise.reject(err);
            }
            _page.close();
            _ph.exit();
            console.log("capture callback type is ", typeof callback);
            callback && callback(err, option);
        });;
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
            console.log("ready to save db, saveCaptureData:", data);
            console.log(this.db);
            this.db.collection('origin_captures').insertOne(data, function (err, result) {
                console.log("Inserted Success - saveCaptureData.");
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
                    console.dir(item);
                } else {
                    console.log("over");
                }
            });
        });

    },
    getLastestCapture: function (opt, callback) {
        console.log("DB getLastestCapture:", opt.url);
        var queryCondition = {
            url: opt.url
        };

        this.connect(function (err, result) {
            if(err){
                callback(err);
                return;
            }
            var cursor = this.db.collection("origin_captures").find(queryCondition).sort({key: -1}).limit(1);
            console.log("query end.");
            cursor.each(function (err, item) {
                if (item) {
                    console.log("find one");
                    callback(null, item);
                } else {
                    callback({msg: "no result."});
                    console.log("over");
                }
                return;
            });
        });
    }
};

function start() {
    var taskList = [
        {
            url: "http://www.uc123.com",
            //interval : "1000", //毫秒
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
            console.log("in afterCpture,target is:", target_data);
            if (err) {
                console.log("error:", err);
                return;
            }
            dboperator.getLastestCapture({url: target_data.url}, function (err, last_data) {
                if (err || !last_data) {
                    console.log("error:", err.msg);
                    dboperator.saveCaptureData(target_data, function () {
                    });
                    return;
                }

                console.log("存在历史截图，则对比");
                var opt = {
                    target: target_data.folder + target_data.filename + "." + target_data.format,
                    other: last_data.folder + last_data.filename + "." + last_data.format,
                    resultFile: target_data.folder + target_data.filename + "_diff" + "." + target_data.format
                }
                comparer.diff(opt, function (err, data) {
                    if (!err) {
                        target_data.difference = resultFile;
                        target_data.diffwith = last_data._id;
                    }
                    dboperator.saveCaptureData(target_data, function () {
                    });
                })

            });
        }

        if (opt.interval) {
            setInterval(function () {
                capturer.capture(opt, afterCapture);
            }, opt.interval);
        } else {
            //afterCapture(null,opt)
            // return;
            capturer.capture(opt, afterCapture);
        }
    });

};

start();
