/**
 * Created by wangle on 2016/1/31.
 *
 * TODO: 抓图，分析，报警，应该独立成三个不同的任务进程，其中心围绕task表
 *
 */

"use strict";

//主函数
(function main() {
    var taskmgr = require("../lib/taskmanager");
    taskmgr.launchAllTasks();

    var server = require("../bin/www.js");
})();


