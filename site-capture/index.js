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
var webserver = require("./www/webserver");//可以单独剥离成独立的项目

function main() {
    var taskList = [
        {
            taskid:"",
            domain:"www.uc123.com",
            url: "http://www.uc123.com",
            interval : 100000,
            name_prefix: "uc123_home"
        },
        {
            taskid:"",
            domain:"cn.bing.com",
            url: "http://cn.bing.com/search?q=",
            name_prefix: "bing_test"
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
                var resultFileName = target_data.filename + "_diff";
                var opt = {
                    target: Global_CONFIG.capture_image_save_folder + target_data.filename + "." + target_data.format,
                    other: Global_CONFIG.capture_image_save_folder + last_data.filename + "." + last_data.format,
                    resultfile: Global_CONFIG.capture_image_save_folder + resultFileName + "." + target_data.format
                };
                console.log("Before diff, opt is: ", opt);
                comparer.diff(opt, function (err, data) {
                    if (err) {
                        console.log("Diff failed. As,", err.msg);
                    }else{
                        console.log("Diff success. add diff info  to target data");
                        target_data.diffimg = resultFileName;
                        target_data.diffwith = last_data._id;
                    }
                    console.log("Will save target data.")
                    dboperator.saveCaptureData(target_data, function () {
                    });
                })
            });
        }

        //test
        if(opt.url.indexOf("bing.com")>-1)opt.url+=Math.random();//Node下竟然没有includes这个方法
        //end test
        capturer.capture(opt, afterCapture);//立即执行一次任务
        if (opt.interval) {//如果配置了任务，则定时执行
            setInterval(function () {
                capturer.capture(opt, afterCapture);
            }, opt.interval);
        }
    });
};

main();

