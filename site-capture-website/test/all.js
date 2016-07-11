/**
 * Mocha -t 20000
 * */
/* global define, it, describe */
/* eslint func-names: 'off', prefer-arrow-callback: 'off'  */

'use strict';
const expect = require('chai').expect;
const capturer = require('../lib/capturer');

describe('Capturer', function () {
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
