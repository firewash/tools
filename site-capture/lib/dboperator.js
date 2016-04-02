"use strict";

var ObjectID = require("mongodb").ObjectID;

class DBOperator {
    constructor() {
        var mongodb = require("mongodb");
        var MongoClient = mongodb.MongoClient;
        var databaseUrl = "admin:admin@localhost:27017/tools_site_capture";
        var collections = ["origin_captures", "diff_captures", "tasks"];
        var url = 'mongodb://localhost:27017/tools_site_capture';

        this.db = null;
        this.MongoClient = MongoClient;
        this.url = url;
    }

    connect(callback) {
        return new Promise((resolve, reject)=> {
            console.log("Try db connect");

            this.MongoClient.connect(this.url, (err, db) => {
                console.log(err ? ("MongoDB connnect error!",err) : "MongoDB connnect success~.");
                this.db = db;
                err ? reject(err) : resolve(db);
            });
        });
    }

    /**
     * 关闭数据库
     * */
        close() {
        this.db && this.db.close();
    }

    //转换一些不合法数据为合法
    dataTransform(data) {
        if (data.interval) {
            data.interval = +data.interval;
        }
        return data;
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

     * */
     getCaptureEntries(opt) {
        return new Promise((resolve, reject)=> {
            console.log("in db.getCaptureEntries");
            var queryCondition = {
                //url: opt.url
            };
            queryCondition = opt;//todo 根据opt获取选择性处理

            var p = this.connect();
            p.then(db => {
                console.log("Connect then");
                return db.collection("origin_captures").find(queryCondition).toArray();
            }).then(arr => {
                console.log("Find then,", arr);
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
     * */
      getCaptureEntry(opt) {
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
                        db.collection("origin_captures").find({_id:ObjectID(origin.diffwith)}).limit(1).toArray().then(function (arr) {
                            console.log("Found diff info ", arr);
                            data.diffwith_info = arr && arr[0] ? arr[0] : null;
                            resolve(data);
                        });
                    } else {
                        resolve(data);
                    }
                });
                return cursor;
            });
            Promise.resolve(p);
        });

    }

    /**
     * 获取最新的截图数据
     * opt={
     *      url:string,
     *      with_diff_info: flase as default
     * }
     * */
     getLastestCaptureEntry(opt) {
        console.log("GetLastestCaptureEntry:", opt.url);
        var queryCondition = {
            url: opt.url
        };
        console.log("queryCondition", queryCondition);
        return new Promise((resolve, reject)=>{
            var p = this.connect();
            p.then( db => {
                db.collection("origin_captures").find(queryCondition).sort({timestamp: -1}).limit(1).toArray().then(function (arr) {
                    console.log("Result: ", arr);
                    var data = arr && arr[0] ? arr[0] : null;
                    resolve(data);
                });
            },err=>{
                reject(err);
            });
        });

    }

    //保存一个截图数据
    saveCaptureData(data) {
        console.log("Will save capture data:", data);
        return new Promise((resolve,reject) => {
            var p = this.connect();
            p.then( result => {
                this.db.collection('origin_captures').insertOne(this.dataTransform(data),  (err, result) => {
                    if(err){
                        console.log("insert data error",err);
                        reject(err);
                    }else{
                        console.log("Insert success , in fn saveCaptureData.",result);
                        resolve(result);
                    }

                    this.close();
                });
            });
            Promise.resolve(p);
        });
    }

    getCaptureData(callback) {
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
     * 获取所有的采集任务
     * arr = [
     {
         domain:"www.uc123.com",
         url: "http://www.uc123.com",
         interval : 100000,
         name_prefix: "uc123_home",
         enabled:true
     },...
     ];
     */
    getTasks(opt) {
        console.log("getTasks, opt is:",opt);
        var queryCondition = {},opt=opt||{};
        //topt安全填入
        opt._id && (queryCondition._id = ObjectID(opt._id));

        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                console.log("then connect");
                console.log("queryCondition", queryCondition);
                var cursor = db.collection("tasks").find(queryCondition).toArray().then(function (arr) {
                    console.log("Find tasks:", arr);
                    resolve({
                        query_condition: queryCondition,
                        data: arr
                    });

                });
            },err=>{
                reject(err);
            });
            Promise.resolve(p);
        });
    }
    //更新一个任务数据. 差量更新机制.
    updateTask(opt,updateinfo){
        console.log("updateTask, opt is:",opt);
        var queryCondition = {},opt=opt||{};
        opt._id && (queryCondition._id = ObjectID(opt._id));
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                console.log("then connect,queryCondition",queryCondition);
                db.collection("tasks").updateOne(queryCondition,{$set:updateinfo}).then(function (result) {
                    console.log("Update sucess:", result);
                    resolve(result);
                });
            },err=>{
                reject(err);
            });
            Promise.resolve(p);
        });
    }

}

module.exports = new DBOperator();