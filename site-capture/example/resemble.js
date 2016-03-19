/*run node resemble*/
var resemble= require('node-resemble-js');
var fs= require("fs");

//基本设置
resemble.outputSettings({
  errorColor: {
    red: 255,
    green: 0,
    blue: 255
  },
  errorType: 'movement',
  transparency: 0.3
});

//比较两个图片
var file1 = "./example/resemble/a.png",
    file2 = "./example/resemble/b.png",
    resultfile = "./example/resemble/diff.png";

var diff = resemble(file1).compareTo(file2)
            .ignoreColors().ignoreAntialiasing()
            .onComplete(function(data){
                console.log(data);
                /*{ isSameDimensions: true,
                    dimensionDifference: { width: 0, height: 0 },
                    misMatchPercentage: '0.59',
                    analysisTime: 231,
                    getDiffImage: [Function] }
                  */
                 if (+data.misMatchPercentage <= 0.01) {
                    callback();
                  } else {
                     data.getDiffImage().pack().pipe(fs.createWriteStream(resultfile));
                  } 
            });

