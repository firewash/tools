'use strict';

const express = require('express');
const loggie = require('../lib/loggie').logger;
/* eslint-disable */
const router = express.Router();
/* eslint-enable */
const dboperator = require('../lib/dboperator');
const idField = '_id';

function realPath(filename, format) {
    return `/capture/${filename}.${format}`;
}

// 路由集合
const RouterSets = {
    '/list': (req, res) => {
        // todo 要是能原生支持分析hash就好了,可以回填hazy
        res.render('diff/list', {
            title: '采集列表'
        });
    },
    '/detail': (req, res) => {
        const query = req.query;
        // 需要安全的处理一下传入的参数,不要直接传递
        const opt = {};
        if (query[idField])opt[idField] = query[idField];

        dboperator.getCaptureEntry(opt).then(data => {
            loggie.info('get data callback', data);
            const diffwithInfo = data.diffwith_info || {};
            const originInfo = data.origin_info || {};
            const diffinfo = originInfo.diffinfo || {};

            const renderData = {
                id: originInfo[idField],
                title: '采集详情',
                url: originInfo.url,
                time: (new Date(originInfo.timestamp_start_capture)).toLocaleString(),
                diffratio: diffinfo.hasOwnProperty('misMatchPercentage')
                            ? diffinfo.misMatchPercentage : '-1',
                has_diffwith_img: !!diffwithInfo.filename,
                is_similar: diffinfo.similar,
                origin_img: realPath(originInfo.filename, originInfo.format),
                diffwith_img: diffinfo.similar
                                ? '' : realPath(diffwithInfo.filename, diffwithInfo.format),
                diff_img: (function getDiffImgPath() {
                    let str = '';
                    if (!diffinfo.similar && diffinfo.diffimg) {
                        str = realPath(diffinfo.diffimg, originInfo.format);
                    }
                    return str;
                }()),
                diffinfo,
                taskinfo: originInfo.taskinfo
            };
            loggie.info('Detail page will render:', renderData);
            res.render('diff/detail', renderData);
        }).catch(e => {
            loggie.error('diff-router.js, /detail error: ', e);
        });
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
