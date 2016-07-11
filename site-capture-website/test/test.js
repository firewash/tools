/* global define, it, describe */
/* eslint func-names: 'off', prefer-arrow-callback: 'off'  */


'use strict';
const expect = require('chai').expect;

describe('Array', function () {
    it('常识相等', function () {
        expect('everthing').to.be.ok;
        expect(false).to.not.be.ok;
        expect(0).to.be.not.equal('0');
        // expect(0).to.be.equal('0');
    });
});
