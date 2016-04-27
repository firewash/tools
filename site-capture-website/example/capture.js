/**
 *  run as :phantomjs capture.js
 *
 * Created by wangle on 2016/1/31.
 */



var page = require('webpage').create();
page.open('http://www.baidu.com', function(status) {
    console.log("Status: " + status);
    if(status === "success") {
        page.render('example.png');
    }
    phantom.exit();
});

var page = require('webpage').create();
page.viewportSize = { width: 1920, height: 1080 };
//page.clipRect = { top: 0, left: 0, width: 1024, height: 800 };
page.settings = {
    javascriptEnabled: true,
    loadImages: true,
    userAgent: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 UBrowser/5.5.10106.5 Safari/537.36"
};

page.open('http://www.uc123.com', function(status) {
    console.log("Status: " + status);
    if(status === "success") {
        page.render('result/example.png',{format: 'png', quality: '100'});
    }
    phantom.exit();
});