"use strict";

var Global_CONFIG = {
    capture_image_save_folder: "data/result/",
    capture_image_qulity: 60
}

var comparer = require("./comparer");
var capturer = require("./capturer");
var dboperator = require("./dboperator");
dboperator.config = Global_CONFIG;

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
    console.log("In afterCpture,target is:", target_data);
    if (err) {
        console.log("Error:", err);
        return;
    }
    dboperator.getLastestCaptureEntry({url: target_data.url}).then(function (last_data) {
        if (!last_data) {
            console.log("Error: no last data");
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
            dboperator.saveCaptureData(target_data, function () {});
        })
    });
};

class TaskManager{
    constructor(){}

    //去除所有任务并执行
    excuteAllTasks(){
        console.log("获取并执行所有任务");
        var p = dboperator.getTasks();
        p.then( result => {
            var taskList = result.data;
            taskList.forEach( opt => {
                if(!opt.enabled){
                    this.excute(opt);
                }
            });
        });
        Promise.resolve(p);
    }

    //执行一个任务(忽略任务中的enabled标志)
    excuteTask(taskinfo){
        console.log("执行一个任务:",taskinfo);
        if(!taskinfo)return;
        //测试代码,可以去掉
        if(taskinfo.url.indexOf("bing.com")>-1)taskinfo.url+=Math.random();//Node下竟然没有includes这个方法
        //预处理一下数据
        taskinfo.taskid=taskinfo._id;
        delete taskinfo._id;
        console.log("立即执行");
        capturer.capture(taskinfo).then(function(data){
            console.log("then capture");
            afterCapture(null,data);
        });
        if (taskinfo.interval) {
            console.log("配置了任务，则定时执行");
            setInterval(function () {
                capturer.capture(taskinfo).then(function(data){
                    afterCapture(data);
                });
            }, taskinfo.interval);
        }
    }

    excuteTaskById(taskId){
        console.log("excuteTaskById");
        dboperator.getTasks({_id:taskId}).then(arr => {
            this.excuteTask(arr[0])
        });

    }
}

module.exports = new TaskManager();