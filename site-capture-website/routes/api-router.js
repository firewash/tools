var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");
var taskmanager = require("../../site-capture/lib/taskmanager");


/*执行一个任务*/
router.get('/task/run', function(req, res, next) {
    var data = {msg:"请指定任务ID"};
    res.send(data);
});

router.post('/task/:id/run', function(req, res, next) {
    var id = req.params.id;
    console.log("/task/:id/run", id);
    taskmanager.excuteTaskById(id);
    var data = {
        msg:id+"任务发送启动指令"
    };
    res.send(data);

});




module.exports = router;
