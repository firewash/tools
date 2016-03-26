var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

router.get('/tasklist', function(req, res, next) {
   var p = dbreader.getAllTasks();
    p.then(function(result){
        console.log("then getAllTasks",result);
        res.render('manager/tasklist', {
            title: '列表' ,
            data: result.data
        });
    });
    Promise.resolve(p);

});

module.exports = router;
