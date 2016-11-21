/*** 
 * run in command:
 *  node make_crx.js
 *  
 * 
 * */

var proc = require('child_process');
var chromepath = "C:/Users/admin/AppData/Local/Google/Chrome/Application/chrome.exe";
var src = "E:/github/tools/导航竞品分析-扩展/code";
var pem = "E:/github/tools/导航竞品分析-扩展/导航竞品分析-扩展.pem";
var cmdString = `${chromepath} --pack-extension=${src} --pack-extension-key=${pem}`;
cmdString = "start C:/Users/admin/AppData/Local/Google/Chrome/Application/chrome.exe --pack-extension=E:\\github\\tools\\导航竞品分析-扩展\\code --pack-extension-key=E:\\github\\tools\\导航竞品分析-扩展\\导航竞品分析-扩展.pem";
proc.exec(cmdString, function(err,stdout,stderr){
    console.log(err,stdout,stderr);

});
