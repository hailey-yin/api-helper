var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var http = require('http');
var url = require('url');
var Agent = require('../service/agentservice');

router.route('/') // 获取接口测试结果
    .get(function (req,res,next) {
        var restmsg = new RestMsg();

        //获取参数：测试API接口地址、请求方法、测试数据
        var testurl = req.param('testurl');
        var testmethod = req.param('testmethod').toUpperCase();
        var testdata = req.param('testdata');

        // 判空
        if (!testurl) {
            testResult.errorMsg('请填写测试接口地址！');
            response.send(testResult);
            return;
        }

        Agent.testAPI(testurl, testmethod, testdata, function (err,response) {
            if (err) {
                restmsg.errorMsg(err.toString());
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(response.body);
            res.send(restmsg);
        });
    });

module.exports = router;