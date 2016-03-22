var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

var CONFIG = {
    image_path:"../../site-capture/data"
};

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
                filename:"uc123_home_1458639315680",
                format:"png",
                diffimg:"uc123_home_1458639315680_diff",
                diffwith:"_id..."
            },
            diffwith_info:{ //和谁比的，通常是上一个时间图片
                _id:"_id...",
                url:"www.uc123.com",
                filename:"uc123_home_1458639315680",
                format:"png",
            }
        };
        res.render('track', {
            title:"对比",
            diffwith_img: CONFIG.image_path + data.diffwith_info.filename + data.diffwith_info.format,
            origin_img: CONFIG.image_path + data.origin_info.filename + data.origin_info.format,
            diff_img: CONFIG.image_path + data.origin_info.diffimg + data.origin_info.format,
        });
        return;
    });

});

function getListFromDB(condition, callback){
    dbreader.getLastestCapture()
}

module.exports = router;
