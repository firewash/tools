'use strict';

const express = require('express');
const loggie = require('../lib/loggie').logger;
const router = express.Router(); // eslint-disable-line
const dboperator = require('../lib/dboperator');
const taskmanager = require('../lib/taskmanager');

router.get('/list', (req, res) => {
    dboperator.getTasks()
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

// Server-sent Event专用API，用来推送任务状态
router.get('/statesync', (req, res) => {
    const retry = 1000 * 60 * 5; // ms

    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
    });

    const fn = function (data) {
        // todo 每个statesync的访问，都要 addEventListener一下，代价不小啊
        // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Add a progress event');
        const msg = {
            taskinfo: this,
             data
        };
        res.write(`retry: 1000\n`); // todo 这个retry 浏览器端收不到
        res.write(`data:${JSON.stringify(msg)}\n\n`);
    };
    taskmanager.addEventListener('progress', fn);

    // 5分钟就自动断开。否则页面关闭后此处资源无法释放。页面如果需要，会自己再建立连接的。
    setTimeout(() => {
        taskmanager.removeEventListener('progress', fn);
        res.end();
    }, retry);

});

module.exports = router;
