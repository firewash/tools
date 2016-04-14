"use strict";

var ObjectID = require("mongodb").ObjectID;
var TABLES = {
   "capture" : "origin_captures",
    "task":"tasks"
};

class DBOperator {
    constructor() {
        var mongodb = require("mongodb");
        var MongoClient = mongodb.MongoClient;
        var url = 'mongodb://localhost:27017/tools_site_capture';

        this.db = null;
        this.MongoClient = MongoClient;
        this.url = url;
    }

    connect() {
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

    //把数据库origin_captures的文档一些不合法数据为合法
    dataTransform(doc) {
        if (doc.interval) {
            doc.interval = +doc.interval;
        }
        return doc;
    }
    //把搜索条件中的不合法数据转换为合法
    queryConditionTranform(condition){
        //处理模糊搜索的字段. 作为URL的模糊字段
        if(condition.hasOwnProperty("hazy")){
            var value = condition.hazy.trim();
            if(value!="")condition.url = new RegExp(value,"i");
            delete condition.hazy;
        }
        return condition;
    }

    //todo 获取所有数据
    getAllCaptureEntries(callback) {
        console.log("in getAllCaptureEntries");
        this.connect(function () {
            var cursor = this.db.collection(TABLES.capture).find();
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
        var queryCondition = this.queryConditionTranform(opt);

        return Promise.resolve().then(()=>{
            return this.connect();
        }).then(db => {
            console.log("Connect then");
            return db.collection(TABLES.capture).find(queryCondition).toArray();
        }).then(arr => {
            console.log("Find then,length: ", arr.length);
            return arr;
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
                var cursor = db.collection(TABLES.capture).find(queryCondition).limit(1).toArray().then( arr => {
                    console.log("Find origin info:", arr);
                    var origin = data.origin_info = arr && arr[0] ? arr[0] : null;

                    if (origin && origin.diffinfo && origin.diffinfo.diffwith) {
                        console.log("Find diff info ...");
                        var diffwith = origin.diffinfo.diffwith;
                        db.collection(TABLES.capture).find({_id:ObjectID(diffwith)}).limit(1).toArray().then( arr => {
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
                db.collection(TABLES.capture).find(queryCondition).sort({timestamp: -1}).limit(1).toArray().then( arr => {
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
                        console.log("Insert success , in fn saveCaptureData.");
                        resolve(result);
                    }

                    this.close();
                });
            });
            Promise.resolve(p);
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

        return Promise.resolve().then(()=>{
            return this.connect();
        }).then(db => {
            console.log("then connect");
            console.log("queryCondition", queryCondition);
            return db.collection("tasks").find(queryCondition).toArray();
        }).then((arr)=>{
            return {
                query_condition: queryCondition,
                data: arr
            };
        });;
    }

    //添加一个新任务
    addtask(data){
        console.log("add task fn.");
        var _data = {
            domain:data.domain,
            url: data.url,
            interval : parseInt(data.interval),
            name_prefix: data.name_prefix,
            enabled: !!data.enabled,
        };

        return Promise.resolve().then(()=>{
            console.log("will connect.");
            return this.connect();
        }).then(db => {
            console.log("Insert data", _data);
            return db.collection("tasks").insertOne(_data);
        }).then(result=>{
            console.log("Result:",result);
            return arr;
        });
    }

    //更新一个任务数据. 差量更新机制.
    updateTask (opt,updateinfo){
        console.log("updateTask, opt is:",opt);
        var queryCondition = {},opt=opt||{};
        opt._id && (queryCondition._id = ObjectID(opt._id));
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                console.log("then connect,queryCondition",queryCondition);
                db.collection("tasks").updateOne(queryCondition,{$set:updateinfo}).then( result => {
                    console.log("Update sucess:", result);
                    resolve(result);
                });
            },err=>{
                reject(err);
            });
            Promise.resolve(p);
        });
    }

    deleteTask(opt){
        return Promise.resolve().then(()=>{
            return {message:"成功"}
        })
    }

}

module.exports = new DBOperator();