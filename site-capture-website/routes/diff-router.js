"use strict";

const express = require('express');
var loggie = require('../lib/loggie').logger;
var router = express.Router();
var dboperator = require("../lib/dboperator");

function realPath(filename, format) {
    return "/capture/" + filename + "." + format;
}

// 路由集合
const RouterSets = {
    '/list': (req, res) => {
        // todo 要是能原生支持分析hash就好了,可以回填hazy
        res.render('diff/list', {
            title: '采集列表',
        });
    },
    '/detail': (req, res) => {
        const query = req.query;
        // 需要安全的处理一下传入的参数,不要直接传递
        const opt = {};
        if (query._id)opt._id = query._id;

        const p = dboperator.getCaptureEntry(opt);
        p.then(data => {
            console.log('get data callback', data);
            let diffwith_info = data.diffwith_info || {},
                origin_info = data.origin_info || {},
                diffinfo = origin_info.diffinfo || {};

            let renderData = {
                id: origin_info._id,
                title: '采集详情 - ' + origin_info.url,
                time: (new Date(origin_info.timestamp_start_capture)).toLocaleString(),
                diffratio: diffinfo.hasOwnProperty('misMatchPercentage') ? diffinfo.misMatchPercentage : '-1',
                has_diffwith_img: diffwith_info.filename ? true : false,
                is_similar: diffinfo.similar,
                origin_img: realPath(origin_info.filename, origin_info.format),
                diffwith_img: diffinfo.similar ? "" : realPath(diffwith_info.filename, diffwith_info.format),
                diff_img: diffinfo.similar ? "" : diffinfo.diffimg ? realPath(diffinfo.diffimg, origin_info.format) : "",
                diffinfo: diffinfo,
                taskinfo: origin_info.taskinfo
            };
            console.log('Detail page will render:', renderData)
            res.render('diff/detail', renderData);
        }).catch(e => {
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
router.get('', RouterSets['/list']);
router.get('/list', RouterSets['/list']);
router.get('/detail', RouterSets['/detail']);

module.exports = router;
