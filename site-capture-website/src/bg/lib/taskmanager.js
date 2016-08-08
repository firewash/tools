'use strict';

const loggie = require('./loggie').logger;
const gConfig = require('../config.js');
const comparer = require('./comparer');
const capturer = require('./capturer');
const dboperator = require('./dboperator');
const schedule = require('node-schedule');
const notify = require('../lib/notify.js');
const idField = '_id';
const imageFolder = gConfig.captureImageSaveFolder;
const taskQueue = { // 真正不停跑定时任务的管理器
    // task_id;{taskinfo:json, job:object, expired:bool}
};

const events = {
    progress: []
}

dboperator.config = gConfig;

// 粗暴的判断两个JSON是否内容相同
function isJsonEquals(jsonA, jsonB) {
    return JSON.stringify(jsonA) === JSON.stringify(jsonB);
}
class TaskManager {
    // 事件管理
    addEventListener(eventName, fn) {
        events[eventName].push(fn);
    }
    removeEventListener(eventName, fn) {
        const index = events[eventName].indexOf(fn);
        if (index > -1) events[eventName].splice(fn);
    }
    triggerEvent(eventName, ctx, data) {
        const event = events[eventName];
        if (event && event.length) {
            event.forEach(fn => {
                fn.call(ctx, data);
            });
        }
    }

    // 取出所有任务并执行
    launchAllTasks() {
        loggie.info('首次获取并执行所有任务');
        this.syncAndScheduleAllTasks();

        setTimeout(() => {
            this.syncAndScheduleAllTasks(); // 每天更新一次任务.这里也可以用node-schedule来搞
        }, 1000 * 60 * 60 * 24);
    }

    // 同步所有任务的执行状态,增删改jobs
    syncAndScheduleAllTasks() {
        loggie.info('syncAndScheduleAllTasks');
        const keys = Object.keys(taskQueue);
        for (let i = 0, len = keys.length; i < len; i++) {
            taskQueue[keys[i]].expired = true;
        }
        dboperator.getTasks().then(result => {
            const taskList = result.data;
            loggie.info('All task length: ', taskList.length);
            taskList.forEach(opt => {
                loggie.info('Task list item ,Enable:', opt.enabled);
                if (opt.enabled) {
                    this.scheduleTask(opt); // 添加新任务，或更新旧任务
                    // todo 只存在一个任务时,这里偶尔报错 [TypeError: Cannot set property 'expired' of undefined]
                    if (taskQueue[opt[idField]]) taskQueue[opt[idField]].expired = false;
                }
            });
        }).then(() => {
            loggie.info('尝试移除没有了的任务, taskQueue: ', taskQueue);
            for (let i = 0, len = keys.length; i < len; i++) {
                if (taskQueue[keys[i]].expired) {
                    this.cancelScheduledJobByTaskId(keys[i]);
                }
            }
            loggie.info('尝试结束 ');
        }).catch(err => {
            loggie.info('Err:', err);
        });
    }

    // 判断新来的taskinfo相对于就的task是否发生更新(以前没有\内容变了,都认为是更新了)
    isTaskUpdated(newTaskinfo) {
        const taskid = newTaskinfo[idField];
        const oldTaskinfo = taskQueue[taskid];
        loggie.info('old task info is: ', taskQueue[taskid]);
        const noChange = oldTaskinfo && isJsonEquals(newTaskinfo, oldTaskinfo.taskinfo);
        loggie.info('isTaskUpdated : ', !noChange);
        if (oldTaskinfo) loggie.info(isJsonEquals(newTaskinfo, oldTaskinfo.taskinfo));
        return !noChange;
    }

    /**
     *   启动一个任务(任务会根据自己的配置定时启动)
     *   如果已经有相同task的任务，则会删除重新创建。
     */
    scheduleTask(task) {
        loggie.info('In scheduleTask fn, task param: ', task);
        let scheduleResult = false;
        if (task.enabled && task.startdate && task.starttime && this.isTaskUpdated(task)) {
            loggie.info('要配置定时任务.');
            if (taskQueue[task[idField]]) {
                loggie.info('存在旧任务，先删掉，再加新的');
                this.cancelScheduledJobByTaskId(task[idField]);
            }
            const j = this.setScheduleFunctionCall(
                task.startdate,
                task.starttime,
                task.scheduled,
                () => {
                    loggie.info('定时任务被启动。');
                    this.executeTask(task);
                });

            if (j) {  // 有可能setScheduleFunctionCall会定制不成功(比如日期过期或不合理)
                taskQueue[task[idField]] = {
                    taskinfo: task,
                    job: j
                };
                scheduleResult = true;
            }
        } else {
            loggie.info('无需配置定时任务.');
        }
        return scheduleResult;
    }

    // startdate= '2016-05-17',starttime = '19:38'
    setScheduleFunctionCall(startdate, starttime, interval, fn) {
        loggie.info('in setScheduleFunctionCall,', startdate, starttime, interval);
        let job = null;
        let rule = null;
        const timedetail = starttime.split(':');
        const hour = timedetail[0] || 0;
        const minute = timedetail[1] || 0;
        switch (interval) {
        case 'perhour': // 这时候会忽略年月日,UI上这种情况就隐藏年月日的选择吧
            rule = { minute: +minute };
            break;
        case 'perday':
            rule = { hour: +hour, minute: +minute };
            break;
        case 'onetime':
        case '':
        default:
            rule = new Date(`${startdate} ${starttime}`);
            break;
        }
        loggie.info('rule ok', rule);
        if (rule) {
            job = schedule.scheduleJob(rule, () => {
                loggie.info('job coming~', startdate, starttime, interval);
                fn();
            });
            loggie.info('Schedule success~');
        }

        return job;
    }

    cancelScheduledJobByTaskId(taskId) {
        if (!taskQueue[taskId]) return null;
        const task = taskQueue[taskId];
        loggie.info('cancelScheduledJobByTaskId', task);
        delete taskQueue[taskId];
        return task.job.cancel();
    }

    getScheduledTaskQueue() {
        return taskQueue;
    }

    executeTaskById(taskId) {
        loggie.info('executeTaskById');
        return dboperator.getTasks({ _id: taskId }).then(result => {
            this.executeTask(result.data[0]);
        });
    }


    // 执行一个任务,执行一次(忽略任务中的enabled标志)
    executeTask(taskinfo) {
        loggie.info('Run a capture task:', taskinfo);
        if (!taskinfo) return;

        // 预处理一下数据
        const namePrefix = taskinfo.name_prefix || gConfig.namePrefix;
        const date = new Date(); // IOS时间
        const time = date.getTime();
        const opt = {
            url: taskinfo.url,
            name_prefix: namePrefix,
            filename: `${namePrefix}_${time}`
        };
        const targetData = {
            taskid: taskinfo[idField],
            taskinfo
        };

        this.triggerEvent('progress', taskinfo, { message: '准备执行' });
        capturer.capture(opt).then(data => {
            this.triggerEvent('progress', taskinfo, { message: '截图完成' });
            Object.assign(targetData, data);
            loggie.info('In afterCpture,target is:', data);
            return dboperator.getLastestCaptureEntry({ url: data.url });
        }).then(lastData => {
            let returnValue = null;
            if (lastData) {
                loggie.info('Has a pre capture, now diff with it.');
                this.triggerEvent('progress', taskinfo, { message: '获取上次截屏信息' });
                targetData.diffwith = lastData[idField];
                const resultFileName = `${targetData.filename}_diff`;
                let ignore;
                try {
                    ignore = JSON.parse(taskinfo.ignore);
                } catch (e) {
                    ignore = null;
                }
                const diffOption = {
                    target: `${imageFolder}${targetData.filename}.${targetData.format}`,
                    other: `${imageFolder}${lastData.filename}.${lastData.format}`,
                    resultfile: `${imageFolder}${resultFileName}.${targetData.format}`,
                    ignore
                };
                loggie.info('Before diff, diffOption is: ', diffOption);
                this.triggerEvent('progress', taskinfo, { message: '准备对比' });
                returnValue = comparer.diff(diffOption).then(data => {
                    loggie.info('Diff success. add diff info  to target data', data);
                    targetData.diffinfo = data;
                    if (!targetData.diffinfo.similar) {
                        targetData.diffinfo.diffimg = resultFileName;
                    }
                    this.triggerEvent('progress', taskinfo, { message: '完成对比' });
                });
            } else {
                loggie.info('No last data');
            }
            return returnValue;
        }).then(() => {
            loggie.info('Will dboperator.saveCaptureData');
            return dboperator.saveCaptureData(targetData);
        }).then(() => {
            this.triggerEvent('progress', taskinfo, { message: '数据已经存储' });
            const willSendMail = taskinfo.email_notify_enabled
                                    && targetData.diffinfo
                                    && !targetData.diffinfo.similar;
            if (willSendMail) { // 误差大时，发邮件通知
                notify.mail({
                    contentUrl: `http://${gConfig.domain}:${gConfig.port}/diff/view-for-mail?_id=${targetData[idField]}`,
                    // content: JSON.stringify(target_data)
                    list: taskinfo.email_list
                });
            } else {
                loggie.info('Needless to send mail');
            }
        }).catch(err => {
            loggie.error('Error when capturer.capture:', err);
            this.triggerEvent('progress', taskinfo, { message: '发生异常' });
            targetData.error = { message: err.message };
            dboperator.saveCaptureData(targetData);
        });
    }

    test() {
        console.log(1);
    }
}

module.exports = new TaskManager();
