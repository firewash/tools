'use strict';

const express = require('express');
const loggie = require('../lib/loggie').logger;
const router = express.Router();
const dboperator = require('../lib/dboperator');
// const taskmgr = require('../lib/taskmanager');

router.get('/list', (req, res) => {
    Promise.resolve()
        .then(() => dboperator.getTasks())
        .then(result => {
            loggie.info('then getAllTasks', result);
            const items = result.data;
            res.render('task/list', {
                title: '任务管理列表',
                subtitle: '抓屏任务',
                data: items
            });
        }, err => {
            res.render('task/list', {
                title: `发生错误${err.message}`,
                data: {}
            });
        });
});

module.exports = router;
