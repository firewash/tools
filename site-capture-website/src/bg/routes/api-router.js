'use strict';

const express = require('express');
const loggie = require('../lib/loggie').logger;
const capturer = require('../lib/capturer');
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

const router = express.Router(); // eslint-disable-line

/* 任务相关的API */
router.get('/task/run', (req, res) => {
    const data = { msg: '请指定任务ID' };
    res.json(data);
});

router.post('/task/add', (req, res) => {
    const data = req.body;
    loggie.info('post request:', data);
    dboperator.addTask(data).then(result => {
        loggie.info('Then addtask . ');
        res.status('201').json(result);
    }).catch(err => {
        loggie.error('Error,', err);
        res.json(err);
    });
});

router.put('/task/:id', (req, res) => {
    loggie.info('/task/:id put update request.req.param: ', req.params, 'and req.body: ', req.body);
    const taskid = req.params.id;
    const updateinfo = req.body;

    loggie.info('Will updateTask, ', taskid, updateinfo);
    dboperator.updateTask({ _id: taskid }, updateinfo).then(result => {
        const data = {
            msg: `${taskid} 任务更新完成.Result:${result}`
        };
        res.json(data);
    }, err => {
        res.json({
            msg: `${taskid} 任务更新失败.Error:${err}`
        });
    });
});

router.delete('/task/:id', (req, res) => {
    const id = req.params.id;
    loggie.info('request /task/:id/delete', id);

    dboperator.deleteTask({ _id: id }).then(result => {
        loggie.info('Delete success ', result.id);
        res.json({
            message: `${id}删除成功`
        });
    }, err => {
        loggie.info('Delete errlr,', err);
        res.json(err);
    });
});

// 执行一个任务
router.post('/task/:id/run', (req, res) => {
    const id = req.params.id;
    loggie.info('/task/:id/run', id);
    taskmgr.executeTaskById(id);
    const data = {
        msg: `${id}任务发送启动指令.后台进行中`
    };
    res.json(data);
});

// 查询后台任务队列
router.get('/task/queue', (req, res) => {
    const data = {
        data: taskmgr.getScheduledTaskQueue()
    };
    // can instead by these
    // res.setHeader('Content-Type', 'application/json;charset=utf-8');
    // res.send(data);
    res.json(data);
});

// 查询获取截屏记录集合
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
            res.json(result);
        }, err => {
            result.err = {
                msg: `${opt.taskid} 任务更新指令失败.Err:${err}`
            };
            res.json(result);
        });
});

// 临时预览一个网站 todo 可用于任务创建时的预览
router.post('/capture/preview', (req, res) => {
    const opt = req.body;
    opt.base64 = true; // preview的话就直接base64吧，不要创建本地文件了
    return capturer.capture(opt).then(data => {
        res.json(data);
    });
});

// 删除一个截屏条目
router.delete('/capture/:id', (req, res) => {
    const id = req.params.id;
    return dboperator.deleteCaptureEntry({
        id
    }).then(data => {
        res.json(data);
    });
});


module.exports = router;
