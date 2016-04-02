"use strict";

var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");
var taskmanager = require("../../site-capture/lib/taskmanager");


/* 任务相关的API */
router.get('/task/run', function(req, res, next) {
    var data = {msg:"请指定任务ID"};
    res.send(data);
});

router.post('/task/:id/run', function(req, res, next) {
    var id = req.params.id;
    console.log("/task/:id/run", id);
    taskmanager.excuteTaskById(id);
    var data = {
        msg:id+"任务发送启动指令.后台进行中"
    };
    res.send(data);
});
router.post('/task/:id/update', function(req, res, next) {
    console.log("/task/:id/undate", req.params, req.body);
    let taskid = req.params.id,
        updateinfo = req.body;

    if(typeof updateinfo.enabled == "string"){
        updateinfo.enabled = updateinfo.enabled=="true"?true:false;
    }

    console.log(taskid,updateinfo);
    dbreader.updateTask({_id:taskid},updateinfo).then(result=>{
        var data = {
            msg:taskid+" 任务更新指令完成.Result:" + result
        };
        res.send(data);
    },err=>{
        res.send({
            msg:taskid+" 任务更新指令失败.Err:" +err
        });
    });

});

module.exports = router;
