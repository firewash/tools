/**
 * Mocha -t 20000
 * */

'use strict';
var expect = require("chai").expect;
const capturer = require('../lib/capturer');


describe('Capturer', function(){
    describe('.capture', function(){
        it('should save an image of url', function(){
           return capturer.capture({url:"http://www.uc123.com",filename:"unittest_sitecapture"}).then(result=>{
               console.log(result);
               expect(result).to.have.key("timestamp_capture_complete");
           });
        });
    });
});