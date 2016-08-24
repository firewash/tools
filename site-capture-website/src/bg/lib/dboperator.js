'use strict';

const loggie = require('../lib/loggie').logger;
const mongodbObjectID = require('mongodb').ObjectID;
const mongodb = require('mongodb');
const config = require('../config');
const taskInfoFactory = require('../models/taskinfo').factory;
const captureInfoFactory = require('../models/captureinfo').factory;
const captureQueryFactory = require('../models/captureEntriesQueryCondition').factory;
const TABLES = {
    capture: 'origin_captures',
    task: 'tasks'
};
const idField = '_id';

const eventHandles = {
    afterAddTask: [],
    afterUpdateTask: [],
    afterDeleteTask: []
};

class DBOperator {
    constructor() {
        const MongoClient = mongodb.MongoClient;
        const url = config.db.url;

        this.db = null;
        this.MongoClient = MongoClient;
        this.url = url;
    }

    connect() {
        return Promise.resolve().then(() => {
            loggie.info('Try db connect');
            return new Promise((resolve, reject) => {
                if (this.db) {
                    // loggie.info('MongoDB connnect: Use last db.', this.db);
                    resolve(this.db);
                } else {
                    // option can be { autoReconnect: true },
                    this.MongoClient.connect(this.url, (err, db) => {
                        if (err) {
                            loggie.error('MongoDB connnect error!', err);
                            reject(err);
                        } else {
                            loggie.info('MongoDB connnect success~.');
                            db.on('error', e => {
                                loggie.error('MongoDB: something error, e:', e);
                                this.close();
                            });
                            db.on('timeout', e => {
                                loggie.error('MongoDB: timeout, e: ', e);
                                this.close();
                            });
                            // db.on('reconnect', e => {
                            //    loggie.info('3 Something error in MongoDB,', e);
                            //    this.close();
                            // });
                            db.on('close', e => {
                                loggie.info('MongoDB: been closed, e: ', e);
                                this.reset();
                            });
                            this.db = db;
                            resolve(db);
                        }
                    });
                }
            });
        });
    }

    /**
     * 关闭数据库
     * */
    close() {
        if (this.db) {
            this.db.close();
            this.reset();
        }
    }
    // 内部状态归位
    reset() {
        this.db = null;
    }

    addEventListener(name, fn) {
        eventHandles[name].push(fn);
        return this;
    }

    removeEventListener(name, fn) {
        if (fn) {
            const index = eventHandles[name].indexOf(fn);
            if (index > -1) {
                eventHandles[name].splice(index, 1);
            }
        } else {
            eventHandles[name] = [];
        }
        return this;
    }

    triggerEvent(name) {
        loggie.info('Dboperator triggerEvent', name);
        const arr = eventHandles[name];
        let res = true;
        for (let i = 0, len = arr.length; i < len; i++) {
            res = res && arr[i].call(this);
        }
        return res;
    }

    /**
     *   查询一个数据集合.
     *
     *
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
        const begin = +opt.begin || 0;
        const limit = +opt.limit || 5;
        const queryCondition = captureQueryFactory.create(opt);
        const returnValue = {
            data: [],
            totalCount: 0,
            begin,
            limit
        };
        let db = null;
        loggie.info('GetCaptureEntries, queryCondition:', queryCondition);
        return this.connect().then(_db => {
            db = _db;
            loggie.info('Connect then,', queryCondition);
            return db.collection(TABLES.capture).find(queryCondition)
                .sort({ timestamp_start_capture: -1 }).skip(begin).limit(limit)
                .toArray();
        }).then(arr => {
            loggie.info('Find then,length: ', arr.length);
            returnValue.data = arr;
        }).then(() =>
            db.collection(TABLES.capture).count(queryCondition) // todo 每次查询都会查一下总数 可缓存
        ).then(count => {
            returnValue.totalCount = count;
            return returnValue;
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
            _id: mongodbObjectID(opt[idField])
        };
        loggie.info('queryCondition:', queryCondition);
        const data = {
            query_condition: queryCondition,
            origin_info: null,
            diffwith_info: null
        };
        let db = null;

        return this.connect().then(_db => {
            db = _db;
            loggie.info('then connnect. queryCondition', queryCondition);
            return db.collection(TABLES.capture).find(queryCondition).limit(1).toArray();
        }).then(arr => {
            loggie.info('Find origin info:', arr);
            const origin = data.origin_info = arr && arr[0] ? arr[0] : null;

            return new Promise(resolve => {
                if (origin && origin.diffwith) {
                    loggie.info('Find diff info ...');
                    const diffwithId = origin.diffwith;
                    db.collection(TABLES.capture)
                        .find({ _id: mongodbObjectID(diffwithId) }).limit(1)
                        .toArray().then(arrTemp => {
                            loggie.info('Found diff info ', arrTemp);
                            data.diffwith_info = arrTemp && arrTemp[0] ? arrTemp[0] : null;
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
        const queryCondition = {
            url: opt.url
        };
        loggie.info('queryCondition', queryCondition);
        return this.connect().then(db =>
            db.collection(TABLES.capture)
                .find(queryCondition).sort({ timestamp_start_capture: -1 }).limit(1).toArray()
        ).then(arr => {
            loggie.info('Result: ', arr);
            return arr && arr[0] ? arr[0] : null;
        });
    }

    // 保存一个截图数据
    saveCaptureData(data) {
        loggie.info('Will save capture data:', data);
        return this.connect().then(db => {
            loggie.info('Will insert.');
            return db.collection(TABLES.capture).insertOne(captureInfoFactory.create(data));
        }).then(result => {
            loggie.info('SaveCaptureData sucess, result.insertedId: ', result.insertedId);
            this.close();
            return result;
        });
    }

    // 删除一个截屏记录（先只支持基于id的删除）
    deleteCaptureEntry(opt) {
        loggie.info('Will delete capture data:', opt);

        const id = opt.id;
        let result = {ok: 0, n: 0};
        let db = null;
        if (!id) return false;
        return this.connect().then(_db => {
            db = _db;
            //查询一下数据，将相关磁盘路径拿出来
            loggie.info('find db info first, and get file path.');
        }).then(() => {
            loggie.info('Will delete db info.');
            return db.collection(TABLES.capture).deleteOne({ _id: mongodbObjectID(id) });
        }).then(r => {
            result = r;
            loggie.info('delete db success: ', result);
            this.close();
            loggie.info('Will delete disk file ');
            // todo 删除本地磁盘文件
            result.ok_diskfile = 1;
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
        loggie.info('getTasks, opt is:', _opt);
        const opt = _opt || {};
        const queryCondition = {};
        // 安全填入
        if (opt[idField])queryCondition[idField] = mongodbObjectID(opt[idField]);

        return this.connect().then(db => {
            loggie.info('then connect, queryCondition', queryCondition);
            return db.collection(TABLES.task).find(queryCondition).toArray();
        }).then(arr => {
            loggie.info('Result count', arr.length);
            return {
                query_condition: queryCondition,
                data: arr
            };
        });
    }

    // 添加一个新任务
    addTask(data) {
        loggie.info('add task fn.');
        const newData = taskInfoFactory.create(data);

        return this.connect().then(db => {
            loggie.info('Insert data', newData);
            return db.collection(TABLES.task).insertOne(newData);
        }).then(result => {
            loggie.info('Result:', result);
            this.triggerEvent('afterAddTask');
            return result;
        });
    }

    // 更新一个任务数据. 差量更新机制.
    updateTask(_opt, _updateinfo) {
        // loggie.info('UpdateTask, opt is:', _opt);
        // 处理查询条件
        const opt = _opt || {};
        const queryCondition = {};
        if (opt[idField]) queryCondition[idField] = mongodbObjectID(opt[idField]);
        // 处理update info
        const updateinfo = taskInfoFactory.create(_updateinfo);
        if (updateinfo[idField]) (delete updateinfo[idField]);
        updateinfo.updatetime = new Date();

        return this.connect().then(db => {
            loggie.info('taskmanager.updateTask. queryCondition:',
                            queryCondition, 'updateinfo: ', updateinfo);
            return db.collection(TABLES.task).updateOne(queryCondition, { $set: updateinfo });
        }).then(result => {
            loggie.info('Update success:', result);
            this.triggerEvent('afterUpdateTask');
            return result;
        });
    }

    deleteTask(opt) {
        const id = opt[idField];
        loggie.info('dboperator deleteTask, _id:', id);
        return this.connect().then(db => {
            loggie.info('db.deleteOne, _id:', id);
            return db.collection(TABLES.task).deleteOne({ _id: mongodbObjectID(id) });
        }).then(results => {
            this.triggerEvent('afterDeleteTask');
            return results;
        });
    }
}

module.exports = new DBOperator();
