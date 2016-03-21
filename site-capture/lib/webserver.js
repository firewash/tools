var express = require("express");

var app = express();
app.get("/",function(req,res){
   res.send("hello world");
});

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