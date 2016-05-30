/**
 * Created by wangle on 2016/5/27.
 * 通知服务组件
 *
 */

// const fs = require('fs');
const request = require('request');
const sendMail = require('./sendMail');
const loggie = require('../lib/loggie.js');

/**
 *  opt = {
 *      list    收件人
 *      subject 标题
 *
 *  }
 *
 * */
function mail(opt, callback) {
    if (opt.contentUrl) {
        const newOpt = opt;
        request.get(opt.contentUrl, (err, result) => {
            newOpt.content = result.body.trim();
            delete newOpt.contentUrl;
            loggie.info('Will send mail: ', newOpt);
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
}

function sms(opt) {
    // todo
    loggie.info('sms service, ', opt);
}

module.exports = {
    mail,
    sms
};
