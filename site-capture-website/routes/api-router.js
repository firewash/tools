var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

router.get('/manager/task/view', function(req, res, next) {
    res.send('no api now');
});


module.exports = router;
