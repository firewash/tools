var express = require("express");
var app = express();

//app.set("views","views")

//app.get("/",function(req,res){
//   res.send("首页");
//});
//
//app.get("/diff",function(req,res){
//    res.send("diff页面");
//});

var router = express.Router();
router.get('/',function(req,res){
    //res.render('index',{title:'Express'});
    res.send("123")
});

app.use("/",router);

var start = function(){
    var server = app.listen(3000,function(){
        var host = server.address().address;
        var port = server.address().port;
        console.log("WWW service of capture running",host,port);
    });
}

module.exports = {
    start:start
};