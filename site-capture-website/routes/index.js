var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

function realPath(filename,format){
    return "/capture/" + filename +"."+ format;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/track', function(req, res, next) {
    var opt = {
        url:"http://www.uc123.com"
    };

    dbreader.getLastestCapture(opt,function(data){
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
        res.render('track', {
            title:data.title,
            time:data.time,
            diffratio:data.origin_info.diffratio,
            diffwith_img: realPath(data.diffwith_info.filename, data.diffwith_info.format),
            origin_img: realPath(data.origin_info.filename, data.origin_info.format),
            diff_img: realPath(data.origin_info.diffimg, data.origin_info.format)
        });
        return;
    });
});

function getListFromDB(condition, callback){
    dbreader.getLastestCapture()
}

module.exports = router;
