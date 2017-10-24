/**
 * Created by zhoubin on 2015/5/19.
 */
var express = require('express');
var router = express.Router();
var groups = require('./groups');
var projects = require('./projects');
var requests = require('./requests');
var apiTest = require('./api-test');
var monitors = require('./monitors');
var authority = require('./authority');
var users = require('./user');
var deploy = require('./virtualDeploy');
var deployhelper = require('../service/deployHelper');
var virtual = require('./virtual');


//允许跨域访问资源
router.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

router.use('/projects', projects);
router.use('/projects', groups);
router.use('/projects', requests);
router.use('/apitest', apiTest);
router.use('/monitor', monitors);
router.use('/authority', authority);
router.use('/users', users);
router.use('/projects', deploy);
router.use('/virtual', deployhelper.route);
router.use('/virtual', virtual);

module.exports = router;