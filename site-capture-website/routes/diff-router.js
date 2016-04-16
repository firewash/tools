var express = require('express');
var router = express.Router();
var dbreader = require("../lib/dbreader");

function realPath(filename,format){
    return "/capture/" + filename +"."+ format;
}

//路由集合
var RouterSets={
    '/list': function(req, res, next) {
        //todo 要是能原生支持分析hash就好了,可以回填hazy
        res.render('diff/list', {
            title: '采集列表',
        });
    },
    '/detail': function(req, res, next) {
        var query = req.query;
        //需要安全的处理一下传入的参数,不要直接传递
        var opt = {};
        if(query._id)opt._id=query._id;

        var p = dbreader.getCaptureEntry(opt);
        p.then(data => {
            console.log("get data callback", data);
            var diffwith_info = data.diffwith_info||{},
                origin_info = data.origin_info||{},
                diffinfo = origin_info.diffinfo||{};

            var renderData = {
                id:origin_info._id,
                title:"采集详情 - "+origin_info.url,
                time: (new Date(origin_info.timestamp)).toLocaleString(),
                diffratio:diffinfo.hasOwnProperty("misMatchPercentage")?diffinfo.misMatchPercentage:"",
                diffwith_img: realPath(diffwith_info.filename, diffwith_info.format),
                origin_img: realPath(origin_info.filename, origin_info.format),
                diff_img: diffinfo.diffimg?realPath(diffinfo.diffimg, origin_info.format):""
            };
            console.log("Detail page will render:",renderData)
            res.render('diff/detail', renderData);
        }).catch(function(e){
            console.log(e);
        });
        Promise.resolve(p);
    }
};

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
