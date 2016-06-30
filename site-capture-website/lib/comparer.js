'use strict';

const resemble = require('node-resemble-js');
const fs = require('fs');
const loggie = require('../lib/loggie').logger;
const RATIO_BASELINE_DEFAULT = require('../config.js').image_compare_ratio_baseline; // 图像对比差异率最低值基线

resemble.outputSettings({
    errorColor: {
        red: 255,
        green: 0,
        blue: 255
    },
    errorType: 'movement',
    transparency: 0.8
});

/**
 *  把resemble比较的结果数据,转换成系统通用的,万一以后换掉了resemble
 *
 *   { isSameDimensions: false,
     dimensionDifference: { width: -15, height: -856 },
     misMatchPercentage: '10.49',
     analysisTime: 983 } }
 *
 *  不过目前,先让Key相同就是了.
 * */
function dataTransfer4resemble2system(from) {
    const to = {};
    to.isSameDimensions = from.isSameDimensions;
    to.dimensionDifference = from.dimensionDifference;
    to.misMatchPercentage = +from.misMatchPercentage;
    to.analysisTime = from.analysisTime;
    return to;
}

class Comparer {
    // 对比两个文件，并将对比结果图片写入磁盘
    // opt={file1 file2 resultfile ratio_baseline}
    diff(option) {
        const opt = option;
        loggie.info('Inner diff function. opt is:', opt);
        const target = opt.target;
        const other = opt.other;
        const resultfile = opt.resultfile;
        const ratioBaseline = opt.ratio || RATIO_BASELINE_DEFAULT;

        return new Promise((resolve, reject) => {
            try {
                const fileDataTarget = fs.readFileSync(target);
                const fileDataOther = fs.readFileSync(other);

                resemble(fileDataTarget)
                    .compareTo(fileDataOther)
                    .ignoreNothing()
                    .onComplete(_data => {
                        const data = dataTransfer4resemble2system(_data);
                        loggie.info('Resemble diff complete', data);
                        opt.diffinfo = data;
                        opt.ratio_baseline = ratioBaseline;
                        if (+data.misMatchPercentage <= ratioBaseline) {
                            data.similar = true;
                            data.message = 'misMatchPercentage too low,donnot save compare result~';
                        } else {
                            loggie.info('Save diff image to ', resultfile);
                            data.similar = false;
                            _data.getDiffImage().pack().pipe(fs.createWriteStream(resultfile));
                        }
                        resolve(data);
                    });
            } catch (e) {   // TODO: 文件比如other在磁盘上不存在时的异常，try目前捕获不到。奇怪
                loggie.error('Catch diff err: ', e);
                reject({ msg: e.msg }, null);
            }
        });
    }
}

module.exports = new Comparer();
