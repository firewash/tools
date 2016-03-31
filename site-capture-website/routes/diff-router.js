var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

function realPath(filename,format){
    return "/capture/" + filename +"."+ format;
}

//路由集合
var RouterSets={
    '/list': function(req, res, next) {
        var query = req.query;

        var opt = {};
        query.domain && (opt.domain=query.domain);
        query.url && (opt.url=query.url);
        query.from && (opt.from=query.from);
        query.end && (opt.from=query.end);

        var p = dbreader.getCaptureEntries(opt);
        p.then(function(arr){
            console.log("then getCaptureEntries",arr);
            res.render('diff/list', {
                title: '采集列表' ,
                data: arr
            });
        });
        Promise.resolve(p);
    },
    '/detail': function(req, res, next) {
        var query = req.query;

        //需要安全的处理一下传入的参数,不要直接传递
        var opt = {};
        if(query._id)opt._id=query._id;

        var p = dbreader.getCaptureEntry(opt);
        p.then(function(data){
            console.log("get data callback", data);
            var diffwith_info = data.diffwith_info||{},
                origin_info = data.origin_info;
            console.log("origin_info is", origin_info);
            res.render('diff/detail', {
                id:origin_info._id,
                title:"采集详情 - "+origin_info.url,
                time: (new Date(origin_info.timestamp)).toLocaleDateString(),
                diffratio:origin_info.diffinfo?origin_info.diffinfo.misMatchPercentage:"",
                diffwith_img: realPath(diffwith_info.filename, diffwith_info.format),
                origin_img: realPath(origin_info.filename, origin_info.format),
                diff_img: realPath(origin_info.diffimg, origin_info.format)
            });
        });
        Promise.resolve(p);
    }
}

/**
 * GET list page.
 * /list
 *
 * GET detail page.
 *  /detail?id=***** 只根据id查询.想查询更多,请使用list的api
 *
 * */
router.get('', RouterSets["/list"]);
router.get('/list', RouterSets["/list"]);
router.get('/detail',RouterSets['/detail'] );

module.exports = router;
