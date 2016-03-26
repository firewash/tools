var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

function realPath(filename,format){
    return "/capture/" + filename +"."+ format;
}

/* GET list page. */
router.get('/list', function(req, res, next) {
    var query = req.query;

    var opt = {};
    if(query.url)opt.url=query.url;
    if(query.from)opt.from=query.from;
    if(query.end)opt.from=query.end;

    var p = dbreader.getCaptureEntries(opt);
    p.then(function(arr){
        console.log("then getCaptureEntries",arr);
        res.render('diff/list', {
            title: '列表' ,
            data: arr
        });
    });
    Promise.resolve(p);

});
/* GET detail page.
*  /detail?id=***** 只根据id查询.想查询更多,请使用list的api
* */
router.get('/detail', function(req, res, next) {
    var query = req.query;

    //需要安全的处理一下传入的参数,不要直接传递
    var opt = {};
    if(query._id)opt._id=query._id;

    var p = dbreader.getCaptureEntry(opt);
    p.then(function(data){
        console.log("get data callback", data);
        data.diffwith_info = data.diffwith_info||{};

        res.render('diff/detail', {
            id:data.origin_info._id,
            title:data.title,
            time:data.time,
            diffratio:data.origin_info.diffratio,
            diffwith_img: realPath(data.diffwith_info.filename, data.diffwith_info.format),
            origin_img: realPath(data.origin_info.filename, data.origin_info.format),
            diff_img: realPath(data.origin_info.diffimg, data.origin_info.format)
        });
    });
    Promise.resolve(p);
});

module.exports = router;
