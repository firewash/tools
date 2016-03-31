var resemble = require('node-resemble-js');
var fs = require("fs");

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
function dataTransfer_resemble2system(from, to){
    to.isSameDimensions = from.isSameDimensions;
    to.dimensionDifference = from.dimensionDifference;
    to.misMatchPercentage = from.misMatchPercentage;
    to.analysisTime = from.analysisTime;
}


function Comparer() {
    resemble.outputSettings({
        errorColor: {
            red: 255,
            green: 0,
            blue: 255
        },
        errorType: 'movement',
        transparency: 0.3
    });
}

Comparer.prototype = {
    //对比两个文件，并将对比结果图片写入磁盘
    //opt={file1 file2 resultfile ratio}
    diff: function (opt, callback) {
        console.log("Inner diff function. opt is:",opt);
        var target = opt.target, other = opt.other, resultfile = opt.resultfile, ratio = opt.ratio || 0.01;

        var _diff = null;
        try{
            _diff = resemble(target).compareTo(other).ignoreColors().ignoreAntialiasing().onComplete(function (_data) {
                var data = dataTransfer_resemble2system(_data);
                opt.diffinfo = data;
                if (+data.misMatchPercentage <= ratio) {
                    callback({msg: "misMatchPercentage is too low,donnot save compare result~"}, null);
                } else {
                    console.log("Save diff image to ",resultfile);
                    data.getDiffImage().pack().pipe(fs.createWriteStream(resultfile));
                    callback(null, data);
                }
            });
        }catch (e){//TODO: 文件比如other在磁盘上不存在时的异常，try目前捕获不到。奇怪
            callback({msg: e.msg}, null);
        }
        return _diff;
    }
};

module.exports = new Comparer();
