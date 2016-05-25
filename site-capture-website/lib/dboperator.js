"use strict";

var loggie = require('../lib/loggie');
var ObjectID = require("mongodb").ObjectID;
var TABLES = {
    "capture": "origin_captures",
    "task": "tasks"
};
var Transformer = {
    //把搜索条件中的不合法数据转换为合法
    queryConditionOfCapture: function (condition) {
        //处理模糊搜索的字段. 作为URL的模糊字段
        if (condition.hasOwnProperty("hazy")) {
            var value = condition.hazy.trim();
            if (value != "")condition.url = new RegExp(value, "i");
            delete condition.hazy;
        }
        //处理模糊搜索的字段. 作为URL的模糊字段
        if (condition.hasOwnProperty("taskid")) {
            var value = condition.taskid;
            if (typeof value == "string") {
                condition.taskid = ObjectID(value);
            }
        }
        return condition;
    },

    //把数据库origin_captures的文档一些不合法数据为合法
    captureDoc: function (doc) {
        if (doc.interval) {
            doc.interval = +doc.interval;
        }
        return doc;
    },

    //任务处理
    taskDoc: function (data) {
        return {
            domain: data.domain,
            url: /^https?:/i.test(data.url) ? data.url : "http://" + data.url,
            startdate: data.startdate,
            starttime: data.starttime,
            scheduled: data.scheduled || "onetime",
            name_prefix: data.name_prefix,
            enabled: !!data.enabled,
            createtime: new Date()
        };
    }
};

const eventHandles = {
    "afterAddTask": [],
    "afterUpdateTask": [],
    "afterDeleteTask": []
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
        return new Promise((resolve, reject) => {
            console.log('Try db connect');
            if (this.db) {
                resolve(this.db);
            } else {
                this.MongoClient.connect(this.url, (err, db) => {
                    console.log(err ? ('MongoDB connnect error!', err) : 'MongoDB connnect success~.');
                    this.db = db;
                    err ? reject(err) : resolve(db);
                });
            }
        });
    }

    /**
     * 关闭数据库
     * */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    addEventListener(name, fn) {
        eventHandles[name].push(fn);
        return this;
    }

    removeEventListener(name, fn) {
        // todo
        return this;
    }

    triggerEvent(name) {
        loggie.info('dboperator triggerEvent', name);
        let arr = eventHandles[name];
        let res = true;
        for (let i = 0, len = arr.length; i < len; i++) {
            res = res && arr[i].call(this);
        }
        return res;
    }


    // todo 获取所有数据
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
        var queryCondition = Transformer.queryConditionOfCapture(opt);

        return Promise.resolve().then(() => {
            return this.connect();
        }).then(db => {
            console.log("Connect then,", queryCondition);
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
        var db = null;

        return Promise.resolve().then(()=> {
            return this.connect();
        }).then(_db=> {
            db = _db;
            console.log("then connnect. queryCondition", queryCondition);
            return db.collection(TABLES.capture).find(queryCondition).limit(1).toArray();
        }).then(arr=> {
            console.log("Find origin info:", arr);
            var origin = data.origin_info = arr && arr[0] ? arr[0] : null;

            return new Promise(resolve=> {
                if (origin && origin.diffwith) {
                    console.log("Find diff info ...");
                    var diffwith_id = origin.diffwith;
                    db.collection(TABLES.capture).find({_id: ObjectID(diffwith_id)}).limit(1).toArray().then(arr => {
                        console.log("Found diff info ", arr);
                        data.diffwith_info = arr && arr[0] ? arr[0] : null;
                        resolve(data);
                    });
                } else {
                    resolve(data);
                }
            });
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
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                db.collection(TABLES.capture).find(queryCondition).sort({timestamp: -1}).limit(1).toArray().then(arr => {
                    console.log("Result: ", arr);
                    var data = arr && arr[0] ? arr[0] : null;
                    resolve(data);
                });
            }, err=> {
                reject(err);
            });
        });
    }

    //保存一个截图数据
    saveCaptureData(data) {
        console.log("Will save capture data:", data);
        return Promise.resolve()
            .then(()=> this.connect())
            .then(db=> {
                console.log("Will insert.");
                return db.collection(TABLES.capture).insertOne(Transformer.captureDoc(data));
            }).then(result=> {
                console.log("SaveCaptureData sucess, result.insertedId: ", result.insertedId);
                this.close();
                return result
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
        opt = opt || {};
        var queryCondition = {};
        //安全填入
        opt._id && (queryCondition._id = ObjectID(opt._id));

        return Promise.resolve().then(()=> {
            return this.connect();
        }).then(db => {
            console.log("then connect, queryCondition", queryCondition);
            return db.collection(TABLES.task).find(queryCondition).toArray();
        }).then(arr=> {
            console.log("will return:");
            return {
                query_condition: queryCondition,
                data: arr
            };
        });
    }

    //添加一个新任务
    addTask(data) {
        console.log("add task fn.");
        var _data = Transformer.taskDoc(data);

        return Promise.resolve().then(()=> {
            console.log("Will connect.");
            return this.connect();
        }).then(db => {
            console.log("Insert data", _data);
            return db.collection(TABLES.task).insertOne(_data);
        }).then(result=> {
            console.log("Result:", result);
            this.triggerEvent("afterAddTask");
            return result;
        });
    }

    //更新一个任务数据. 差量更新机制.
    updateTask(opt, updateinfo) {
        console.log("UpdateTask, opt is:", opt);
        //处理查询条件
        opt = opt || {};
        var queryCondition = {};
        opt._id && (queryCondition._id = ObjectID(opt._id));
        //处理update info
        updateinfo._id && (delete updateinfo._id);
        updateinfo.updatetime = new Date();

        return Promise.resolve().then(()=> {
            return this.connect();
        }).then(db => {
            console.log("then connect,queryCondition:", queryCondition, "updateinfo: ", updateinfo);
            return db.collection(TABLES.task).updateOne(queryCondition, {$set: updateinfo});
        }).then(result=> {
            console.log("Update success:", result);
            this.triggerEvent("afterUpdateTask");
            return result;
        });
    }

    deleteTask(opt) {
        var _id = opt._id;
        console.log("dboperator deleteTask, _id:", _id);
        return Promise.resolve().then(()=> {
            return this.connect();
        }).then(db=> {
            console.log("db.deleteOne, _id:", _id);
            return db.collection(TABLES.task).deleteOne({_id: ObjectID(_id)});
        }).then(results => {
            this.triggerEvent("afterDeleteTask");
            return results;
        });
    }
}

module.exports = new DBOperator();