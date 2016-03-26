var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

router.get('/tasklist', function(req, res, next) {
   var p = dbreader.getTasks();
    p.then(function(result){
        console.log("then getAllTasks",result);
        var items = result.data;
        res.render('manager/tasklist', {
            title: '列表' ,
            data: items
        });
    });
    Promise.resolve(p);

});

module.exports = router;
