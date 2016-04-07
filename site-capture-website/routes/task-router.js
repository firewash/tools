var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");;

router.get('/list', (req, res, next)=>{
    Promise.resolve().then(function(){
        return dbreader.getTasks();
    }).then(result=>{
        console.log("then getAllTasks",result);
        var items = result.data;
        res.render('task/list', {
            title: '任务管理列表' ,
            subtitle:"抓屏任务",
            data: items
        });
    },err=>{
        res.render('task/list', {
            title:  '发生错误: ' + err.message,
            data:{}
        });
    });
});

module.exports = router;
