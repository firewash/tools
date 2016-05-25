'use strict';

const express = require('express');
const loggie = require('../lib/loggie');
const dboperator = require('../lib/dboperator');
const taskmgr = require('../lib/taskmanager');
dboperator.addEventListener('afterAddTask', function () {
    taskmgr.syncAndScheduleAllTasks()
});
dboperator.addEventListener('afterUpdateTask', function () {
    taskmgr.syncAndScheduleAllTasks()
});
dboperator.addEventListener('afterDeleteTask', function () {
    taskmgr.syncAndScheduleAllTasks()
});
const router = express.Router();

/* 任务相关的API */
router.get('/task/run', function (req, res) {
    const data = {msg: '请指定任务ID'};
    res.send(data);
});

router.post('/task/add', function (req, res) {
    const data = req.body;
    console.log('post request:', data);
    dboperator.addTask(data).then(result => {
        console.log('Then addtask . ');
        res.status('201').send(result);
    }).catch(function (err) {
        console.log('Error,', err);
        res.send(err);
    });
});

router.put('/task/:id', function (req, res) {
    console.log('/task/:id put update request.req.param: ', req.params, 'and req.body: ', req.body);
    let taskid = req.params.id,
        updateinfo = req.body;

    if (typeof updateinfo.enabled === 'string') {
        updateinfo.enabled = updateinfo.enabled == 'true' ? true : false;
    }

    console.log(taskid, updateinfo);
    dboperator.updateTask({_id: taskid}, updateinfo).then(result => {
        const data = {
            msg: taskid + ' 任务更新完成.Result:' + result
        };
        res.send(data);
    }, err => {
        res.send({
            msg: taskid + ' 任务更新失败.Error:' + err
        });
    });
});

router.delete('/task/:id', (req, res) => {
    const id = req.params.id;
    console.log('request /task/:id/delete', id);

    dboperator.deleteTask({_id: id}).then(result => {
        console.log('Delete success ', result);
        res.send({
            message: `${id}删除成功`
        });
    }, err => {
        console.log('Delete errlr,', err);
        res.send(err);
    });
});

router.post('/task/:id/run', function (req, res) {
    const id = req.params.id;
    console.log('/task/:id/run', id);
    taskmgr.executeTaskById(id);
    const data = {
        msg: id + '任务发送启动指令.后台进行中'
    };
    res.send(data);
});

router.get('/task/queue', (req, res) => {
    const data = {
        msg: taskmgr.getScheduledTaskQueue()
    };
    res.send(data);
});

router.post('/capture/list', (req, res) => {
    console.log('/capture/list', req.params, req.body);
    let opt = req.body;
    const result = {
        condition: opt,
        err: null,
        data: null
    };

    dboperator.getCaptureEntries(opt)
        .then(arr => {
            console.log('then getCaptureEntries, lenth: ', arr.length);
            result.data = arr;
            res.send(result);
        }, err => {
            result.err = {
                msg: taskid + ' 任务更新指令失败.Err:' + err
            };
            res.send(result);
        });
});

module.exports = router;
