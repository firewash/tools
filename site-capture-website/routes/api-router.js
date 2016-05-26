'use strict';

const express = require('express');
const loggie = require('../lib/loggie');
const dboperator = require('../lib/dboperator');
const taskmgr = require('../lib/taskmanager');
dboperator.addEventListener('afterAddTask', () => {
    taskmgr.syncAndScheduleAllTasks();
});
dboperator.addEventListener('afterUpdateTask', () => {
    taskmgr.syncAndScheduleAllTasks();
});
dboperator.addEventListener('afterDeleteTask', () => {
    taskmgr.syncAndScheduleAllTasks();
});
const router = express.Router();

/* 任务相关的API */
router.get('/task/run', (req, res) => {
    const data = { msg: '请指定任务ID' };
    res.send(data);
});

router.post('/task/add', (req, res) => {
    const data = req.body;
    loggie.info('post request:', data);
    dboperator.addTask(data).then(result => {
        loggie.info('Then addtask . ');
        res.status('201').send(result);
    }).catch(err => {
        loggie.info('Error,', err);
        res.send(err);
    });
});

router.put('/task/:id', (req, res) => {
    loggie.info('/task/:id put update request.req.param: ', req.params, 'and req.body: ', req.body);
    const taskid = req.params.id;
    const updateinfo = req.body;

    if (typeof updateinfo.enabled === 'string') {
        updateinfo.enabled = updateinfo.enabled === 'true';
    }

    loggie.info(taskid, updateinfo);
    dboperator.updateTask({ _id: taskid }, updateinfo).then(result => {
        const data = {
            msg: `${taskid} 任务更新完成.Result:${result}`
        };
        res.send(data);
    }, err => {
        res.send({
            msg: `${taskid} 任务更新失败.Error:${err}`
        });
    });
});

router.delete('/task/:id', (req, res) => {
    const id = req.params.id;
    loggie.info('request /task/:id/delete', id);

    dboperator.deleteTask({ _id: id }).then(result => {
        loggie.info('Delete success ', result.id);
        res.send({
            message: `${id}删除成功`
        });
    }, err => {
        loggie.info('Delete errlr,', err);
        res.send(err);
    });
});

router.post('/task/:id/run', (req, res) => {
    const id = req.params.id;
    loggie.info('/task/:id/run', id);
    taskmgr.executeTaskById(id);
    const data = {
        msg: `${id}任务发送启动指令.后台进行中`
    };
    res.send(data);
});

router.get('/task/queue', (req, res) => {
    const data = {
        data: taskmgr.getScheduledTaskQueue()
    };
    res.send(data);
});

router.post('/capture/list', (req, res) => {
    loggie.info('/capture/list', req.params, req.body);
    const opt = req.body;
    const result = {
        condition: opt,
        err: null,
        data: null
    };

    dboperator.getCaptureEntries(opt)
        .then(_result => {
            loggie.info('then getCaptureEntries, lenth: ', _result.data.length);
            Object.assign(result, _result);
            res.send(result);
        }, err => {
            result.err = {
                msg: `${opt.taskid} 任务更新指令失败.Err:${err}`
            };
            res.send(result);
        });
});

module.exports = router;
