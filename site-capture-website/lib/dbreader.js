"use strict";
var ObjectID = require("mongodb").ObjectID;
var dboperator = require("../../site-capture/lib/dboperator");
/*
class DBReader {
    constructor() {
        let mongodb = require("mongodb");
        let MongoClient = mongodb.MongoClient;
        //var assert = require('assert');
        let databaseUrl = "admin:admin@localhost:27017/tools_site_capture";
        let collections = ["origin_captures", "diff_captures", "tasks"];
        let url = 'mongodb://localhost:27017/tools_site_capture';

        this.db = null;
        this.MongoClient = MongoClient;
        this.url = url;
    }

    connect() {
        return new Promise((resolve, reject)=> {
            console.log("Try db connect");

            this.MongoClient.connect(this.url, (err, db) => {
                console.log(err ? "MongoDB connnect error!" : "MongoDB connnect success~.");
                this.db = db;
                err ? reject(err) : resolve(db);
            });
        });
    }

    /**
     * 关闭数据库
     * * /
    close() {
        this.db && this.db.close();
    }
    //todo 获取所有数据
    getAllCaptureEntries(callback) {
        console.log("in getAllCaptureEntries");
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
    }
    /**
     *   获取一个数据集合.
     arr= [{ //当前图片，其中包括可标记差异的图片
                 _id:"_id...",
                 url:"www.uc123.com",
                 filename:"uc123_home_1458569349304",
                 format:"png",
                 diffimg:"uc123_home_1458569349304_diff",
                 diffwith:"_id...",
                 diffratio:"30%"//差异率
                 },{ //当前图片，其中包括可标记差异的图片
                 _id:"_id...",
                 url:"www.uc123.com",
                 filename:"uc123_home_1458569349304",
                 format:"png",
                 diffimg:"uc123_home_1458569349304_diff",
                 diffwith:"_id...",
                 diffratio:"30%"//差异率
                 }];

     * * /
    getCaptureEntries (opt) {
        return new Promise((resolve, reject)=> {
            console.log("in db.getCaptureEntries");
            var queryCondition = {
                //url: opt.url
            };
            queryCondition = opt;//todo 根据opt获取选择性处理

            var p = this.connect();
            p.then(db => {
                console.log("connect then");
                return db.collection("origin_captures").find(queryCondition).toArray();
            }).then(arr => {
                console.log("find then,", arr);
                resolve(arr);
            });
        });
    }

    /**
     * 获取一个对比数据
     *
     * opt = {
     *    id:
     * }
     *
     * result data:
     * var data = {
                    title:"监控结果 "+opt.url,
                    time:"2016年3月1日13:00",
                    query_condition:queryCondition,
                    origin_info:{ //当前图片，其中包括可标记差异的图片
                        _id:"_id...",
                        url:"www.uc123.com",
                        filename:"uc123_home_1458569349304",
                        format:"png",
                        diffimg:"uc123_home_1458569349304_diff",
                        diffwith:"_id...",
                        diffratio:"30%"//差异率
                    },
                    diffwith_info:{ //和谁比的，通常是上一个时间图片
                        _id:"_id...",
                        url:"www.uc123.com",
                        filename:"uc123_home_1458569338843",
                        format:"png"
                    }
                };
     * * /
    getCaptureEntry (opt, callback) {
        console.log("getCaptureEntry:", opt);
        var queryCondition = {
            _id: ObjectID(opt._id)
        };
        console.log("queryCondition:", queryCondition);
        var data = {
            query_condition: queryCondition,
            origin_info: null,
            diffwith_info: null
        };
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                console.log("then connnect");
                console.log("queryCondition", queryCondition);
                var cursor = db.collection("origin_captures").find(queryCondition).limit(1).toArray().then(function (arr) {
                    console.log("Find origin info:", arr);
                    var origin = data.origin_info = arr && arr[0] ? arr[0] : null;

                    if (origin && origin.diffwith) {
                        console.log("Find diff info ...");
                        db.collection("origin_captures").find({}).limit(1).toArray().then(function (arr) {
                            console.log("Found diff info ", arr);
                            data.diffwith_info = arr && arr[0] ? arr[0] : null;
                            resolve(data);
                        });
                    } else {
                        resolve(data);
                    }
                });
            });
            Promise.resolve(p);
        });

    }

    /**获取最新的截图数据
     *
     * opt={
     *      url:string
     * }
     * * /
    getLastestCaptureEntry (opt, callback) {
        console.log("Get lastest capture in DB:", opt.url);
        var queryCondition = {
            url: opt.url
        };

        this.connect(function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            console.log("queryCondition", queryCondition)
            var cursor = this.db.collection("origin_captures").find(queryCondition).sort({key: -1}).limit(1).toArray().then(function (arr) {
                console.log("--", arr);
                var data = arr && arr[0] ? arr[0] : null;
                callback(null, data);
            });
        });
    }

    //获取所有的采集任务
    getAllTasks(){
        var queryCondition={};
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                console.log("then connnect");
                console.log("queryCondition", queryCondition);
                var cursor = db.collection("tasks").find(queryCondition).limit(1).toArray().then(function (arr) {
                    console.log("Find tasks:", arr);
                    resolve({
                        query_condition:queryCondition,
                        data:arr
                    });

                });
            });
            Promise.resolve(p);
        });
    }
}

var dbreader = new DBReader();*/
//module.exports = dbreader; //DBReader已经废弃掉了
module.exports = dboperator;