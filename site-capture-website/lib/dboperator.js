'use strict';

const loggie = require('../lib/loggie');
const mongodbObjectID = require('mongodb').ObjectID;
const TABLES = {
    capture: 'origin_captures',
    task: 'tasks'
};
const Transformer = {
    // 把搜索条件中的不合法数据转换为合法
    queryConditionOfCapture(_condition) {
        const condition = _condition;
        // 处理模糊搜索的字段. 作为URL的模糊字段
        if (condition.hasOwnProperty('hazy')) {
            const value = condition.hazy.trim();
            if (value !== '')condition.url = new RegExp(value, 'i');
            delete condition.hazy;
        }
        // 处理模糊搜索的字段. 作为URL的模糊字段
        if (condition.hasOwnProperty('taskid')) {
            let value = condition.taskid;
            if (typeof value === 'string') {
                condition.taskid = mongodbObjectID(value);
            }
        }
        return condition;
    },

    // 把数据库origin_captures的文档一些不合法数据为合法
    captureDoc(doc) {
        if (doc.interval) {
            doc.interval = +doc.interval;
        }
        return doc;
    },

    // 任务处理
    taskDoc(data) {
        return {
            domain: data.domain,
            url: /^https?:/i.test(data.url) ? data.url : 'http://' + data.url,
            startdate: data.startdate,
            starttime: data.starttime,
            scheduled: data.scheduled || 'onetime',
            name_prefix: data.name_prefix,
            enabled: !!data.enabled,
            createtime: new Date()
        };
    }
};

const eventHandles = {
    afterAddTask: [],
    afterUpdateTask: [],
    afterDeleteTask: []
};

class DBOperator {
    constructor() {
        const mongodb = require('mongodb');
        const MongoClient = mongodb.MongoClient;
        const url = 'mongodb://localhost:27017/tools_site_capture';

        this.db = null;
        this.MongoClient = MongoClient;
        this.url = url;
    }

    connect() {
        return new Promise((resolve, reject) => {
            loggie.info('Try db connect');
            if (this.db) {
                resolve(this.db);
            } else {
                this.MongoClient.connect(this.url, (err, db) => {
                    loggie.info(err ? ('MongoDB connnect error!', err) : 'MongoDB connnect success~.');
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
        loggie.info('in getAllCaptureEntries');
        this.connect(function () {
            var cursor = this.db.collection(TABLES.capture).find();
            cursor.each(function (err, item) {
                if (item) {
                    loggie.info(item);
                } else {
                    loggie.info('over');
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
            loggie.info('Connect then,', queryCondition);
            return db.collection(TABLES.capture).find(queryCondition).toArray();
        }).then(arr => {
            loggie.info('Find then,length: ', arr.length);
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
        loggie.info('getCaptureEntry:', opt);
        const queryCondition = {
            _id: mongodbObjectID(opt._id)
        };
        loggie.info('queryCondition:', queryCondition);
        const data = {
            query_condition: queryCondition,
            origin_info: null,
            diffwith_info: null
        };
        let db = null;

        return Promise.resolve().then(() => {
            return this.connect();
        }).then(_db => {
            db = _db;
            loggie.info('then connnect. queryCondition', queryCondition);
            return db.collection(TABLES.capture).find(queryCondition).limit(1).toArray();
        }).then(arr => {
            loggie.info('Find origin info:', arr);
            var origin = data.origin_info = arr && arr[0] ? arr[0] : null;

            return new Promise(resolve=> {
                if (origin && origin.diffwith) {
                    loggie.info('Find diff info ...');
                    var diffwith_id = origin.diffwith;
                    db.collection(TABLES.capture).find({ _id: mongodbObjectID(diffwith_id) }).limit(1).toArray().then(arr => {
                        loggie.info('Found diff info ', arr);
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
        loggie.info('GetLastestCaptureEntry:', opt.url);
        var queryCondition = {
            url: opt.url
        };
        loggie.info('queryCondition', queryCondition);
        return new Promise((resolve, reject)=> {
            var p = this.connect();
            p.then(db => {
                db.collection(TABLES.capture).find(queryCondition).sort({ timestamp: -1 }).limit(1).toArray().then(arr => {
                    loggie.info('Result: ', arr);
                    var data = arr && arr[0] ? arr[0] : null;
                    resolve(data);
                });
            }, err => {
                reject(err);
            });
        });
    }

    // 保存一个截图数据
    saveCaptureData(data) {
        loggie.info('Will save capture data:', data);
        return Promise.resolve()
            .then(() => this.connect())
            .then(db => {
                loggie.info('Will insert.');
                return db.collection(TABLES.capture).insertOne(Transformer.captureDoc(data));
            }).then(result => {
                loggie.info('SaveCaptureData sucess, result.insertedId: ', result.insertedId);
                this.close();
                return result;
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
    getTasks(_opt) {
        loggie.info('getTasks, opt is:',_opt);
        const opt = _opt || {};
        const queryCondition = {};
        // 安全填入
        if(opt._id)queryCondition._id = mongodbObjectID(opt._id);

        return Promise.resolve().then(() =>
            this.connect()
        ).then(db => {
            loggie.info('then connect, queryCondition', queryCondition);
            return db.collection(TABLES.task).find(queryCondition).toArray();
        }).then(arr => {
            loggie.info('will return:');
            return {
                query_condition: queryCondition,
                data: arr
            };
        });
    }

    // 添加一个新任务
    addTask(data) {
        loggie.info('add task fn.');
        const newData = Transformer.taskDoc(data);

        return Promise.resolve().then(() => {
            loggie.info('Will connect.');
            return this.connect();
        }).then(db => {
            loggie.info('Insert data', newData);
            return db.collection(TABLES.task).insertOne(newData);
        }).then(result => {
            loggie.info('Result:', result);
            this.triggerEvent('afterAddTask');
            return result;
        });
    }

    // 更新一个任务数据. 差量更新机制.
    updateTask(_opt, updateinfo) {
        loggie.info('UpdateTask, opt is:', _opt);
        // 处理查询条件
        const opt = _opt || {};
        const queryCondition = {};
        if(opt._id) queryCondition._id = mongodbObjectID(opt._id);
        // 处理update info
        updateinfo._id && (delete updateinfo._id);
        updateinfo.updatetime = new Date();

        return Promise.resolve()
            .then(() => this.connect())
            .then(db => {
                loggie.info('then connect,queryCondition:', queryCondition, 'updateinfo: ', updateinfo);
                return db.collection(TABLES.task).updateOne(queryCondition, { $set: updateinfo });
            }).then(result => {
                loggie.info('Update success:', result);
                this.triggerEvent('afterUpdateTask');
                return result;
            });
    }

    deleteTask(opt) {
        const _id = opt._id;
        loggie.info('dboperator deleteTask, _id:', _id);
        return Promise.resolve()
            .then(() => this.connect())
            .then(db => {
                loggie.info('db.deleteOne, _id:', _id);
                return db.collection(TABLES.task).deleteOne({ _id: mongodbObjectID(_id) });
            }).then(results => {
                this.triggerEvent('afterDeleteTask');
                return results;
            });
    }
}

module.exports = new DBOperator();
