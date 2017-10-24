/**
 * Created by weirui on 2015/10/15.
 */
var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var http = require('http');
var url = require('url');
var requestService = require('../service/requestservice');
var Agent = require('../service/agentservice');

//绑定路由
router.route('/binding')
    .get(function (req,res,next) {
        var restmsg = new RestMsg();
        var idArr = req.param('idArr');
        var pname = req.param('pname').toLowerCase();
        var query = {};
        query._id = {$in: idArr};
        requestService.findApi(query, function (err, bos) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            var count = 0;
            if (bos.length > 0) {
                for (var i = 0; i < bos.length; i++) {
                    var urlsuffixformat = formatUrl(bos[i].urlsuffix);
                    var url = '/' + pname + '/' + urlsuffixformat;
                    var method = bos[i].method.toUpperCase();
                    var trueUrl = bos[i].url;
                    trueUrl=trueUrl.substring(0,trueUrl.indexOf(bos[i].urlsuffix));
                    var readyBind = dynamic(method, url, trueUrl);
                    readyBind();
                    //更新数据库
                    requestService.updateOne({_id:bos[i]._id}, {deployStatus: 1, depurl: url}, function (err, bo) {
                        if (err) {
                            restmsg.errorMsg(err);
                            res.send(restmsg);
                            return;
                        }
                        count++;
                        if(count == bos.length) {
                            restmsg.successMsg();
                            restmsg.setRsult('绑定成功');
                            res.send(restmsg);
                        }
                    });
                }
            }
        });
    });

//解绑路由
router.route('/nobinding')
    .get(function (req,res,next) {
        var restmsg = new RestMsg();
        var idArr= req.param('idArr');
        var query = {};
        query._id = {$in:idArr};
        requestService.findApi(query , function(err,bos) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(bos.length>0) {
                for (var i = 0; i < bos.length; i++) {
                    var url = bos[i].depurl;
                    var method = bos[i].method.toUpperCase();
                    var key = url + method;
                    Binding[key] = cancelbind;
                }
                requestService.updateList(query, {deployStatus:0}, function(err,bo) {
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    restmsg.successMsg();
                    restmsg.setRsult('解绑成功');
                    res.send(restmsg);
                });
            }
        })
    });

//绑定路由具体操作
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

//执行真实访问的函数
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

//格式化url后缀  包括{}
function formatUrl(url) {
    var newurl= url;
    if(url.indexOf('{')>-1&&url.indexOf('}')>-1) {
        newurl = '';
        while (url.indexOf('{') > -1 && url.indexOf('}') > -1) {
            var url1 = url.substring(url.indexOf('{') + 1, url.indexOf('}'));
            var url2 = url.substring(0, url.indexOf('{'));
            url = url.substring(url.indexOf('}') + 1);
            newurl += url2 + ':' + url1;
        }
        newurl += url;
    }else if (url.indexOf('<')>-1&&url.indexOf('>')>-1) {
        newurl = '';
        while (url.indexOf('<') > -1 && url.indexOf('>') > -1) {
            var url1 = url.substring(url.indexOf('<') + 1, url.indexOf('>'));
            var url2 = url.substring(0, url.indexOf('<'));
            url = url.substring(url.indexOf('>') + 1);
            newurl += url2 + ':' + url1;
        }
        newurl += url;
    }
    return newurl;
}

module.exports = router;
