
function DBOperator() {
    var mongodb = require("mongodb");
    var MongoClient = mongodb.MongoClient;
    //var assert = require('assert');
    var databaseUrl = "admin:admin@localhost:27017/tools_site_capture";
    var collections = ["origin_captures", "diff_captures", "tasks"];
    var url = 'mongodb://localhost:27017/tools_site_capture';

    this.db = null;
    this.MongoClient = MongoClient;
    this.url = url;
    //this.connect();
}

DBOperator.prototype = {
    connect: function (callback) {
        this.MongoClient.connect(this.url, function (err, db) {
            console.log(err ? "MongoDB connnect error!" : "MongoDB connnect success~.");
            this.db = db;
            callback && callback(err, db);
        });
    },
    close: function () {
        this.db && this.db.close();
    },

    //转换一些不合法数据为合法
    dataTransform:function(data){
         if(data.interval){
             data.interval = +data.interval;
         }
        return data;
    },

    saveCaptureData: function (data, callback) {
        var self = this;
        this.connect(function (err,result) {
            if(err){
                callback && callback(err);
                return;
            }
            console.log("Will save capture data:", data);
            console.log(self.dataTransform)
            this.db.collection('origin_captures').insertOne(self.dataTransform(data), function (err, result) {
                console.log("Insert success , in fn saveCaptureData.");
                callback && callback(err, result);
                self.close();
            });
        });
    },
    getCaptureData: function (callback) {
        this.connect(function () {
            var cursor = this.db.collection("origin_captures").find();

            cursor.each(function (err, item) {
                if (item) {
                    console.log(item);
                } else {
                    console.log("over");
                }
            });
        });

    },
    getLastestCapture: function (opt, callback) {
        console.log("Get lastest capture in DB:", opt.url);
        var queryCondition = {
            //url: opt.url
        };

        this.connect(function (err, result) {
            if(err){
                callback(err);
                return;
            }
            console.log("queryCondition",queryCondition)
            var cursor = this.db.collection("origin_captures").find(queryCondition).sort({key: -1}).limit(1).toArray().then(function(arr){
                console.log("--",arr);
                var data = arr && arr[0]?arr[0]:null;
                callback(null, data);
            });
        });
    }
};

module.exports = new DBOperator();