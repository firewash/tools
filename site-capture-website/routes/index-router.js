'use strict';

const express = require('express');
const router = express.Router();
const loggie = require('../lib/loggie');

/* GET home page. */
router.get('/', (req, res) => {
    res.render('index', {title: 'Express'});
});


module.exports = router;
