"use strict";

var express = require('express');
var loggie = require('../lib/loggie');
var dboperator = require("../lib/dboperator");
var taskmgr = require("../lib/taskmanager");
dboperator.addEventListener("afterAddTask",function(){taskmgr.syncAndScheduleAllTasks()});
dboperator.addEventListener("afterUpdateTask",function(){taskmgr.syncAndScheduleAllTasks()});
dboperator.addEventListener("afterDeleteTask",function(){taskmgr.syncAndScheduleAllTasks()});
var router = express.Router();

/* 任务相关的API */
router.get('/task/run', function(req, res, next) {
    var data = {msg:"请指定任务ID"};
    res.send(data);
});

router.post('/task/add',  function(req, res, next) {
    var data = req.body;
    console.log("post request:",data)
    dboperator.addTask(data).then(result=>{
        console.log("Then addtask . ");
        res.status("201").send(result);
    }).catch(function(err){
        console.log("Error,",err);
        res.send(err);
    });
});


router.put('/task/:id', function(req, res, next) {
    console.log("/task/:id put update request.req.param: ", req.params, "and req.body: " ,req.body);
    let taskid = req.params.id,
        updateinfo = req.body;

    if(typeof updateinfo.enabled == "string"){
        updateinfo.enabled = updateinfo.enabled=="true"?true:false;
    }

    console.log(taskid,updateinfo);
    dboperator.updateTask({_id:taskid},updateinfo).then(result=>{
        var data = {
            msg:taskid+" 任务更新完成.Result:" + result
        };
        res.send(data);
    },err=>{
        res.send({
            msg:taskid+" 任务更新失败.Error:" +err
        });
    });
});

router.delete('/task/:id', function(req, res, next) {
    var id = req.params.id;
    console.log("request /task/:id/delete", id);

    dboperator.deleteTask({_id:id}).then( result=>{
            console.log("Delete success ",result);
            res.send({
                message: id+"删除成功"
            });
        }, err=>{
            console.log("Delete errlr,",err);
            res.send(err);
        });
});

router.post('/task/:id/run', function(req, res, next) {
    var id = req.params.id;
    console.log("/task/:id/run", id);
    taskmgr.executeTaskById(id);
    var data = {
        msg:id+"任务发送启动指令.后台进行中"
    };
    res.send(data);
});

router.post('/capture/list', function(req, res, next) {
    console.log("/capture/list", req.params, req.body);
    let opt = req.body;
    var result = {
        condition:opt,
        err:null,
        data:null
    }

    var p = dboperator.getCaptureEntries(opt);
    p.then(function(arr){
        console.log("then getCaptureEntries, lenth: ",arr.length);
        result.data = arr;
        res.send(result);
    },err=>{
        result.err = {
            msg:taskid+" 任务更新指令失败.Err:" +err
        };
        res.send(result);
    });
    Promise.resolve(p);
});

module.exports = router;
