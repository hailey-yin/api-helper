/**
 * Created by weirui on 2015/10/15.
 */
var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var http = require('http');
var url = require('url');
var Agent = require('../service/agentservice');
var RequestService = require('./requestservice');

global.Binding ={};   //用来保存执行内容，key 为 url,value 为执行函数引用，建议这个变量放在redis中

function deployHelper() {

}

//为所有部署的api进行动态绑定
deployHelper.deployAll = function() {
    var query={};
    RequestService.getRequestList(query,function(err,obj){
        if (err){
            callback(err);
            return console.error(err);
        }
        for(var i = 0;i<obj.length;i++) {
            if (obj[i].deployStatus == 1) {
                var method = obj[i].method.toUpperCase();
                var url = obj[i].depurl;
                var trueUrl = obj[i].url;
                trueUrl=trueUrl.substring(0,trueUrl.indexOf(obj[i].urlsuffix));
                var readyBind = dynamic(method,url,trueUrl);
                readyBind();
            }
        }
    })
}

deployHelper.unbindByPid = function(pid,callback) {
    var query = {};
    query.pid = pid;
    RequestService.findApi(query , function(err,bos) {
        if (err) {
            callback(false);
        }
        if(bos.length>0) {
            for (var i = 0; i < bos.length; i++) {
                var url = bos[i].depurl;
                var method = bos[i].method.toUpperCase();
                var key = url + method;
                Binding[key] = cancelbind;
            }
            RequestService.updateList(query, {deployStatus:0}, function(err,bo) {
                if (err) {
                    callback(false);
                }
                callback(true);
            });
        }else {
            callback(true);
        }
    })
}

deployHelper.route = router;

//绑定
var dynamic = function (method,url,trueurl) {
    var method = method;
    var url = url;
    var trueurl = trueurl;
    var key = url + method;
    var bind = function() {
        Binding[key] = getbind(trueurl,url);
        switch (method) {
            case 'GET':
            {
                router.route(url).get(function (req, res, next) {
                    Binding[key](req, res, next);
                });
                break;
            }
            case 'POST':
            {
                router.route(url).post(function (req, res, next) {
                    Binding[key](req, res, next);
                });
                break;
            }
            case 'DELETE':
            {
                router.route(url).delete(function (req, res, next) {
                    Binding[key](req, res, next);
                });
                break;
            }
            case 'PUT':
            {
                router.route(url).put(function (req, res, next) {
                    Binding[key](req, res, next);
                });
                break;
            }
        }
    }
    return bind;
}

//执行内容
var getbind = function(url,regurl) {
    var restmsg = new RestMsg();
    var trueUrl = url;
    var regUrl = regurl;
    var visit = function(req,res,next) {
        var method = req.method.toUpperCase();
        var data = req.body;
        var vurl = req.url;
        var url2 = vurl.substring(vurl.substring(1).indexOf('/')+2);
        var  gourl = trueUrl + url2;
        Agent.testAPI(gourl, method, data, function (err, response) {
            if (err) {
                restmsg.errorMsg(err.toString());
                res.send(restmsg);
                return;
            }
            res.send(response.body);
        });
    };
    return visit;
}

//解绑执行返回404
function cancelbind(req,res,next) {
    //杩斿洖404
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
}

module.exports = deployHelper;