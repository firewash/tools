var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var CONFIG = {
    image_path:"F:\\github\\tools\\site-capture\\data\\result" //必须用双反斜杠,否则找不到位置
};



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//设置静态资源目录
app.use("/public",express.static(path.join(__dirname, 'public')));
app.use("/capture", express.static(CONFIG.image_path));

//路由信息
var rootRoutes = require('./routes/index-router'); //首页
var diffRoutes = require('./routes/diff-router'); //对比相关
var mgrRoutes = require('./routes/mgr-router'); //对比相关
var users = require('./routes/users-router');  //用户管理

app.use('/', rootRoutes);
app.use('/diff', diffRoutes);
app.use('/manager', mgrRoutes);
app.use('/users', users);

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
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
