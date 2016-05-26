'use strict';

// const loggie = require('../lib/loggie');
const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/a', (req, res) => {
    res.send('respond with a resource');
});

module.exports = router;
