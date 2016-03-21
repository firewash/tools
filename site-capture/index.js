/**
 * Created by wangle on 2016/1/31.
 *
 * TODO: 抓图，分析，报警，应该独立成三个不同的任务进程，其中心围绕task表
 *
 */

var Global_CONFIG = {
    capture_image_save_folder: "data/result/",
    capture_image_qulity: 60
}

var comparer = require("./lib/comparer");
var capturer = require("./lib/capturer");
var dboperator = require("./lib/dboperator");
dboperator.config = Global_CONFIG;
var webserver = require("./lib/webserver");

function main() {
    var taskList = [
        {
            url: "http://cn.bing.com/search?q=",//"http://www.uc123.com",
            interval : "100000", //毫秒
            name_prefix: "uc123_home"
        }
    ];

    taskList.forEach(function (opt) {
        var afterCompare = function (err, data) {
            console.log("Capture thenable.");
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
                    console.log("Error:", err);
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
                console.log("Before diff, opt is: ", opt);
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

        //test
        opt.url+=Math.random();
        //end test
        capturer.capture(opt, afterCapture);//立即执行一次任务
        if (opt.interval) {//如果配置了任务，则定时执行
            setInterval(function () {
                capturer.capture(opt, afterCapture);
            }, opt.interval);
        }
    });

    www.start();
};

//main();
webserver.start();
