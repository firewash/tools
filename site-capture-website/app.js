'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const favicon = require('serve-favicon');
const logger = require('morgan');
const loggie = require('./lib/loggie');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const GLOBAL_CONFIG = require('./config.js');
const app = express();

loggie.info('工程目录: ', __dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
const accessLogStream = fs.createWriteStream(`${__dirname}/access.log`, { flags: 'a' });
app.use(logger('combined', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 路由信息
const rootRoutes = require('./routes/index-router'); // 首页
const diffRoutes = require('./routes/diff-router'); // 对比相关
const taskRoutes = require('./routes/task-router'); // 对比相关
const users = require('./routes/users-router');  // 用户管理
const apiRouters = require('./routes/api-router');  // 用户管理

app.use('/', rootRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/capture', express.static(GLOBAL_CONFIG.captureImageSaveFolder));
app.use('/diff', diffRoutes);
app.use('/task', taskRoutes);
app.use('/users', users);
app.use('/api', apiRouters);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
    res.status(err.status || 500)
        .render('error', {
            message: err.message,
            error: {}
        });
});

module.exports = app;
