
function DBReader() {
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

DBReader.prototype = {
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


    //todo 获取所有数据
    getAllCaptureEntries: function (callback) {
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

    //获取一个数据集合
    getCaptureEntries: function (opt, callback) {
        //todo 根据opt获取选择性处理
        var queryCondition = {
            //url: opt.url
        };
        queryCondition = opt;

        this.connect(function () {
            var cursor = this.db.collection("origin_captures").find(queryCondition).toArray().then(function(arr){
                /*
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
                 */
                callback(null, arr);
            });
        });

    },

    /**
     * 获取一个对比数据
     *
     * opt = {
     *    id:
     * }
     *
     *
     * */
    getCaptureEntry:function(opt, callback){
        console.log("getCaptureEntry:", opt);
        var queryCondition = {
           _id: `ObjectId("${opt._id}")`//TODO 这个查询有问题,就搞这个~~~~~~~~~~!!!!!
        };
        console.log("queryCondition:", queryCondition);
        this.connect(function (err, result) {
            if(err){
                callback(err);
                return;
            }
            console.log("queryCondition",queryCondition)
            var cursor = this.db.collection("origin_captures").find(queryCondition).limit(1).toArray().then(function(arr){
                console.log("--",arr);
                var data = arr && arr[0]?arr[0]:null;
                callback(null, data);
            });
        });
    },

    //获取最新的一组 数据
    getLastestCaptureEntry: function (opt, callback) {
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

                /*  */
                console.log("Mock query data")
                var data = {
                    title:"监控结果 "+opt.url,
                    time:"2016年3月1日13:00",
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

                callback(null, data);
            });
        });
    }
};

module.exports = new DBReader();