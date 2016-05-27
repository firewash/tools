/**
 * Created by yushengjie on 16/5/20.
 */
'use strict';
const request = require('request');
// const fs = require('fs');
const loggie = require('../lib/loggie');
const emailJobUrl = 'http://jenkins.shenma-inc.local:8080/view/basic_service/job' +
    '/mail_service/buildWithParameters?token=RUPAKtgjkMPanrFY&';

function sendMail(data, callback) {
    loggie.info('Will sendMail');
    request.post(emailJobUrl, { form: data }, (err, result) => {
        loggie.info('Mail data: ', data);
        if (typeof callback === 'function') callback(err, result);
        if (err) {
            loggie.error('send mail error!', err);
        } else {
            loggie.info('send mail success!');
        }
    });
}

module.exports = sendMail;

