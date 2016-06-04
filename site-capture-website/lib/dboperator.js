'use strict';

const loggie = require('../lib/loggie').logger;
const mongodbObjectID = require('mongodb').ObjectID;
const mongodb = require('mongodb');
const TABLES = {
    capture: 'origin_captures',
    task: 'tasks'
};
const idField = '_id';
const Transformer = {
    // 把搜索条件中的不合法数据转换为合法
    queryConditionOfCapture(_condition) {
        const condition = {};
        // 处理模糊搜索的字段. 作为URL的模糊字段
        if (_condition.hasOwnProperty('hazy')) {
            const value = _condition.hazy.trim();
            if (value) {
                condition.url = new RegExp(value, 'i');
            }
        }
        // 处理task id
        if (_condition.hasOwnProperty('taskid')) {
            const value = _condition.taskid;
            if (typeof value === 'string') {
                condition.taskid = mongodbObjectID(value);
            }
        }

        return condition;
    },

    // 把数据库origin_captures的文档一些不合法数据为合法
    captureDoc(_doc) {
        const doc = _doc;
        if (doc.interval) {
            doc.interval = +doc.interval;
        }
        return doc;
    },

    // 任务处理 - 对传入的数据字段进行过滤处理
    taskDoc(data) {
        const newData = {
            domain: data.domain,
            url: /^https?:/i.test(data.url) ? data.url : `http://${data.url}`,
            startdate: data.startdate,
            starttime: data.starttime,
            scheduled: data.scheduled || 'onetime',
            name_prefix: data.name_prefix,
            email_notify_enabled: data.email_notify_enabled === true
                                    || data.email_notify_enabled === 'true'
                                    || data.email_notify_enabled === 'on',
            email_list: data.email_list,
            enabled: data.enabled === true || data.enabled === 'true' || data.enabled === 'on',
            createtime: new Date()
        };
        loggie.info('Transformer.taskDoc', data, newData);
        return newData;
    }
};

const eventHandles = {
    afterAddTask: [],
    afterUpdateTask: [],
    afterDeleteTask: []
};

class DBOperator {
    constructor() {
        const MongoClient = mongodb.MongoClient;
        const url = 'mongodb://localhost:27017/tools_site_capture';

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
                                loggie.error('1 Something error in MongoDB,', e);
                                this.close();
                            });
                            db.on('timeout', e => {
                                loggie.error('2 Something error in MongoDB,', e);
                                this.close();
                            });
                            // db.on('reconnect', e => {
                            //    loggie.info('3 Something error in MongoDB,', e);
                            //    this.close();
                            // });
                            db.on('close', e => {
                                loggie.info('4 Something error in MongoDB,', e);
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
        loggie.info('dboperator triggerEvent', name);
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
        const queryCondition = Transformer.queryConditionOfCapture(opt);
        loggie.info('getCaptureEntries, queryCondition:', queryCondition, begin, limit);
        let db = null;
        const returnValue = {
            data: [],
            totalCount: 0,
            begin,
            limit
        };
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
        const newData = Transformer.taskDoc(data);

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
        const updateinfo = Transformer.taskDoc(_updateinfo);
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
