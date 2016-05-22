"use strict";

var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var loggie = require('./lib/loggie');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var GLOBAL_CONFIG = require("./config.js");

console.log("工程目录: ",__dirname);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
var accessLogStream = fs.createWriteStream(__dirname + '/access.log',{flags: 'a'});
app.use(logger('combined',{stream: accessLogStream}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//路由信息
var rootRoutes = require('./routes/index-router'); //首页
var diffRoutes = require('./routes/diff-router'); //对比相关
var taskRoutes = require('./routes/task-router'); //对比相关
var users = require('./routes/users-router');  //用户管理
var apiRouters = require('./routes/api-router');  //用户管理

app.use('/', rootRoutes);
app.use("/public",express.static(path.join(__dirname, 'public')));
app.use("/capture",express.static(GLOBAL_CONFIG.capture_image_save_folder));
app.use('/diff', diffRoutes);
app.use('/task', taskRoutes);
app.use('/users', users);
app.use('/api', apiRouters);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
      .render('error', {
        message: err.message,
        error: {}
      });
});

module.exports = app;