/**
 * Created by wangle on 2016/5/27.
 */
/**
 * Created by yushengjie on 16/5/26.
 */

const fs = require('fs');
const request = require('request');
const sendMail = require('./sendMail');

/**
 *  opt = {
 *      list    收件人
 *      subject 标题
 *
 *  }
 *
 * */
function mail(opt, callback){
    if(opt.contentUrl) {
        // console.log('######### Convert URL');
        var newOpt = opt;
        request.get(opt.contentUrl, (err, result) => {
            var content = result.body.trim();
            // console.log('#########',content.length);
            newOpt.content = content;
            delete newOpt.contentUrl;
            mail(newOpt, callback);
        });
        return;
    }

    const postData = {
        mail_list: opt.list || 'le.wangl1@alibaba-inc.com',
        mail_subject: opt.subject || `截屏监控_${Date.now()}`,
        mail_content: opt.content || '测试成功', // fs.readFileSync('./report/Test.html'),
        mail_content_type: 'html',
        mail_priority: '3'
    };

    sendMail(postData);
};

function sms(opt){

}

module.exports = {
    mail,
    sms
};