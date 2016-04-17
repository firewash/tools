"use strict";;

var Global_CONFIG = require("../config.js");
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
                target_data.differror = err;
            }else{
                console.log("Diff success. add diff info  to target data");
                data.diffwith = last_data._id;
                if(!data.similar){
                    data.diffimg = resultFileName;
                }
                target_data.diffinfo = data;
                console.log(data)
            }
            console.log("Will save target data.")
            dboperator.saveCaptureData(target_data, function () {});
        })
    });
};

class TaskManager{
    constructor(){}

    //去除所有任务并执行
    launchAllTasks(){
        console.log("获取并执行所有任务");
        var p = dboperator.getTasks();
        p.then( result => {
            var taskList = result.data;
            taskList.forEach( opt => {
                console.log("Enable:",opt.enabled);
                if(opt.enabled){
                    this.launchTask(opt);
                }
            });
        },(err)=>{
            console("Err:", err);
        });
        Promise.resolve(p);
    }

    //执行一个任务,执行一次(忽略任务中的enabled标志)
    executeTask(taskinfo){
        console.log("Run a task:",taskinfo);
        if(!taskinfo)return;
        //todo 测试代码,可以去掉
        if(taskinfo.url.indexOf("sogou.com")>-1)taskinfo.url+=Math.random();//todo Node下竟然没有includes这个方法

        //预处理一下数据
        var opt = {
            url:taskinfo.url,
            taskid:taskinfo._id,
            taskinfo:taskinfo,
            name_prefix:taskinfo.name_prefix,

        };

        console.log("立即执行这个截图任务");
        var p = capturer.capture(opt).then(data=>{
            console.log("then capture");
            afterCapture(null,data);
        },err=>{
            console.log("Error executeTask, msg:",err);
        });
        Promise.resolve(p);

    }

    //启动一个任务(任务会根据自己的配置定时启动)
    launchTask(taskinfo){
        this.executeTask(taskinfo);
        console.log("判断是否配置了定时任务");
        if ((typeof taskinfo.interval != "undefined") &&　taskinfo.interval>0) {
            console.log("是.");
            setInterval( () => {
                this.executeTask(taskinfo);
            }, taskinfo.interval);
        }
    }

    executeTaskById(taskId){
        console.log("executeTaskById");
        dboperator.getTasks({_id:taskId}).then(result => {
            this.executeTask(result.data[0])
        });

    }
}

module.exports = new TaskManager();