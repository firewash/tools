var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

router.get('/list', (req, res, next)=>{
   var p = dbreader.getTasks();
    p.then(result=>{
        console.log("then getAllTasks",result);
        var items = result.data;
        res.render('task/list', {
            title: '列表' ,
            data: items
        });
    },err=>{
        res.render('task/list', {
            title:  '发生错误: ' + err.message,
            data:{}
        });
    });
    Promise.resolve(p);
});

module.exports = router;
