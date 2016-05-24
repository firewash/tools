"use strict";

var loggie = require('../lib/loggie');
var Global_CONFIG = require("../config.js");
var comparer = require("./comparer");
var capturer = require("./capturer");
var dboperator = require("./dboperator");
var schedule = require("node-schedule");
dboperator.config = Global_CONFIG;

var taskQueue = {
    //task_id;{taskinfo:json, job:object, expired:bool}
};

var isJsonEquals = function (json_a, json_b) {
    return JSON.stringify(json_a) === JSON.stringify(json_b);
}
class TaskManager {
    constructor() {
    }

    //取出所有任务并执行
    launchAllTasks() {
        console.log("首次获取并执行所有任务");
        this.syncAndScheduleAllTasks();

        setTimeout(()=> {
            this.syncAndScheduleAllTasks();//每天更新一次任务.这里也可以用node-schedule来搞
        }, 1000 * 60 * 60 * 24);
    }

    //同步所有任务的执行状态,增删改jobs
    syncAndScheduleAllTasks() {
        for (var key in taskQueue) {
            taskQueue[key].expired = true;
        }

        dboperator.getTasks().then(result => {
            var taskList = result.data;
            console.log("all task count: ", taskList.length);
            taskList.forEach(opt => {
                console.log("Task list item ,Enable:", opt.enabled);
                this.scheduleTask(opt);
                taskQueue[key].expired = false;
            });
        }).then(()=> {
            for (var key in taskQueue) { //去掉没有了的任务
                if (taskQueue[key].expired) {
                    this.cancelScheduledJobByTaskId(key);
                }
            }
        }).catch(err => {
            console("Err:", err);
        });
    }

    //判断新来的taskinfo相对于就的task是否发生更新(以前没有\内容变了,都认为是更新了)
    isTaskUpdated(newTaskinfo) {
        var _id = newTaskinfo._id;
        return !taskQueue[_id] || isJsonEquals(newTaskinfo, taskQueue[_id].taskinfo)
    }

    /**
     *   启动一个任务(任务会根据自己的配置定时启动)
     *   定时信息:
     */
    scheduleTask(task) {
        console.log("Fn scheduleTask, 是否要配置定时任务?");
        if (task.enabled && task.startdate && task.starttime && this.isTaskUpdated(task)) {
            console.log("是.");
            taskQueue[task._id] && this.cancelScheduledJob(taskQueue[task._id].job);
            var j = this.setScheduleFunctionCall(task.startdate, task.starttime, task.scheduled, () => {
                console.log("定时任务被启动.");
                this.executeTask(task);
            });
            taskQueue[task._id] = {
                taskinfo: task,
                job: j
            };
        }
    }

    //startdate= '2016-05-17',starttime = '19:38'
    setScheduleFunctionCall(startdate, starttime, interval, fn) {
        console.log("in setScheduleFunctionCall,", startdate, starttime, interval);
        var job = null,
            rule = null,
            timedetail = starttime.split(":"),
            hour = timedetail[0] || 0,
            minute = timedetail[1] || 0;
        switch (interval) {
            case "perhour": //这时候会忽略年月日,UI上这种情况就隐藏年月日的选择吧
                rule = {minute: +minute};
                break;
            case "perday":
                rule = {hour: +hour, minute: +minute};
                break;
            case "onetime":
            case "":
            default:
                rule = new Date(startdate + " " + starttime);
                break;
        }
        console.log("rule ok", rule);
        if (rule) {
            job = schedule.scheduleJob(rule, function () {
                console.log("job coming~", startdate, starttime, interval);
                fn();
            });
            console.log("Schedule success~");
        }

        return job;
    }

    cancelScheduledJob(job) {
        return job.cancel();
    }

    cancelScheduledJobByTaskId(taskId) {
        var task = taskQueue[taskId];
        return this.cancelScheduledJob(task.job);
    }

    executeTaskById(taskId) {
        console.log("executeTaskById");
        return dboperator.getTasks({_id: taskId}).then(result => {
            this.executeTask(result.data[0])
        });
    }


    //执行一个任务,执行一次(忽略任务中的enabled标志)
    executeTask(taskinfo) {
        console.log("Run a task:", taskinfo);
        if (!taskinfo)return;

        //预处理一下数据
        var name_prefix = taskinfo.name_prefix || Global_CONFIG.name_prefix,
            date = new Date(), //IOS时间
            time = date.getTime();
        var opt = {
            url: taskinfo.url,
            name_prefix: name_prefix,
            filename: name_prefix + "_" + time,
        };
        var target_data = {
            taskid: taskinfo._id,
            taskinfo: taskinfo,
        };

        console.log("立即执行这个截图任务");
        capturer.capture(opt).then(data=> {
            console.log("Thenable capturer.capture");
            Object.assign(target_data, data);

            //开始图像对比
            console.log("In afterCpture,target is:", data);
            return dboperator.getLastestCaptureEntry({url: data.url});
        }).then(last_data => {
            if (last_data) {
                console.log("Has a pre capture, now diff with it.");
                target_data.diffwith = last_data._id;
                var resultFileName = target_data.filename + "_diff";
                var opt = {
                    target: Global_CONFIG.capture_image_save_folder + target_data.filename + "." + target_data.format,
                    other: Global_CONFIG.capture_image_save_folder + last_data.filename + "." + last_data.format,
                    resultfile: Global_CONFIG.capture_image_save_folder + resultFileName + "." + target_data.format
                };
                console.log("Before diff, opt is: ", opt);
                return comparer.diff(opt).then(data=> {
                    console.log("Diff success. add diff info  to target data", data);
                    target_data.diffinfo = data;
                    if (!data.similar) {
                        data.diffimg = resultFileName;
                    }
                    //console.log(data)
                });
            } else {
                console.log("No last data");
                return null;
            }
        }).then(()=> {
            console.log("Will dboperator.saveCaptureData");
            dboperator.saveCaptureData(target_data);
        }).catch(err=> {
            console.log("Error capturer.capture:", err);
            target_data.error = {message: err.message};
            dboperator.saveCaptureData(target_data);
        });
    }
}

module.exports = new TaskManager();