/**
 * Mocha -t 20000
 * */
/* global define, it, describe */
/* eslint func-names: 'off', prefer-arrow-callback: 'off'  */

'use strict';
const expect = require('chai').expect;
const capturer = require('../lib/capturer');
const notify = require('../lib/notify');

describe('Capturer', function () {
    describe('.capture', function () {
        it('Save an image on the disk.', function () {
            this.timeout(100000);
            return capturer.capture({ url: 'http://www.uc123.com', filename: 'unittest_sitecapture' })
                .then(result => {
                    expect(result)
                        .to.include.keys('timestamp_capture_complete');
                    expect(result.timestamp_capture_complete)
                        .to.instanceOf(Date);
                });
        });
    });
});

describe('Notify', function () {
    describe('.mail', function () {
        it('send mail to box', function () {
            console.log('before every test in every file');
            this.timeout(10000);
            notify.mail({
                content: '123',
                list: 'le.wangl1@alibaba-inc.com'
            }, function (err, result) {
                expect(result).to.be.ok;
                done();
            });
        });
    });
});
