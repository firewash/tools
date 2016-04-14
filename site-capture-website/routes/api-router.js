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

router.post('/task/add',  function(req, res, next) {
    var data = req.body;
    console.log("post request:",data)
    dbreader.addtask(data).then(result=>{
        console.log("Then addtask . ");
        res.send(result);
    });
});


router.post('/task/:id/run', function(req, res, next) {
    var id = req.params.id;
    console.log("/task/:id/run", id);
    taskmanager.executeTaskById(id);
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

router.post('/capture/list', function(req, res, next) {
    console.log("/capture/list", req.params, req.body);
    let opt = req.body;
    var result = {
        condition:opt,
        err:null,
        data:null
    }

    var p = dbreader.getCaptureEntries(opt);
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
