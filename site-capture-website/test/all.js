/**
 * Mocha -t 20000
 * */
/* global define, it, describe */
/* eslint func-names: 'off', prefer-arrow-callback: 'off'  */

'use strict';

// common
const expect = require('chai').expect;
const path = require('path');

// busyness
const capturer = require('../src/bg/lib/capturer');
const notify = require('../src/bg/lib/notify');
const taskmanager = require('../src/bg/lib/taskmanager');
const comparer = require('../src/bg/lib/comparer');

const testCaseFolder = __dirname;

describe('Comparer', function () {
    describe('diff', function () {
        it('two same', function () {
            const opt = {
                target: path.join(testCaseFolder, 'assets/target.png'),
                other: path.join(testCaseFolder, 'assets/other.png'),
                resultfile: path.join(testCaseFolder, 'assets/result.png'),
                ignore: []
            };
            comparer.diff(opt);
        });
    });
});

describe('Capturer', function () {return;
    describe('.capture', function () {
        it('Save an image on the disk.', function () {
            this.timeout(10000);
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

describe('TaskManager', function () {return;
    describe('.isTaskUpdated', function () {
        before(function(){
            taskmanager.scheduleTask({taskinfo: {
                _id: '577b24dec5a9beec5668b773',
                domain: 'alimarket.taobao.com',
                url: 'https://alimarket.taobao.com/markets/browser/fan',
                startdate: '2016-07-05',
                starttime: '11:13',
                scheduled: 'perday',
                name_prefix: 'alimarket.taobao.com',
                email_notify_enabled: true,
                email_list: 'le.wangl1@alibaba-inc.com',
                enabled: true,
                createtime: new Date('2016-07-07T13:40:20.043Z'),
                updatetime: new Date('2016-07-07T13:40:20.043Z')
            }});
        });
        it('任务更新', function () {
            const newTask1 = {
                domain: 'alimarket.taobao.com',
                url: 'https://alimarket.taobao.com/markets/browser/fan',
                startdate: '2016-07-05',
                starttime: '11:13',
                scheduled: 'perday',
                name_prefix: 'alimarket.taobao.com-变了',
                email_notify_enabled: true,
                email_list: 'le.wangl1@alibaba-inc.com',
                enabled: true,
                createtime: new Date('2016-07-07T13:40:20.043Z'),
                updatetime: new Date('2016-07-07T13:40:20.043Z')
            };
            const result1 = taskmanager.isTaskUpdated(newTask1);
            expect(result1).to.be.true;
        });
        it('任务未更新', function () {
            const newTask2 = {
                _id: '577b24dec5a9beec5668b773',
                domain: 'alimarket.taobao.com',
                url: 'https://alimarket.taobao.com/markets/browser/fan',
                startdate: '2016-07-05',
                starttime: '11:13',
                scheduled: 'perday',
                name_prefix: 'alimarket.taobao.com',
                email_notify_enabled: true,
                email_list: 'le.wangl1@alibaba-inc.com',
                enabled: true,
                createtime: new Date('2016-07-07T13:40:20.043Z'),
                updatetime: new Date('2016-07-07T13:40:20.043Z') };
            const result2 = taskmanager.isTaskUpdated(newTask2);
            expect(result2).to.be.false;
        });
    });
});

describe('Notify', function () {return;
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
