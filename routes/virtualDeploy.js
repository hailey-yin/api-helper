var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var DeployService = require('../service/deployservice');
var ProjectService = require('../service/projectservice');
var RequestService = require('../service/requestservice');
var Agent = require('../service/agentservice');
var _privateFun = router.prototype;

// 根据条件查询api
router.route('/requests')
    .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var query = {
            pid: req.param('pid')
        };

        if (req.param('apiName')) {
            query.name = new RegExp(req.param('apiName')); // 模糊查询api名称
        }
        if (req.param('gid')) {
            query.gid = req.param('gid');
        }
        if (req.param('method')) {
            query.method = req.param('method');
        }
        if (req.param('deployStatus')) {
            query.deployStatus = req.param('deployStatus');
        }

        DeployService.findAPI(query, function (err, ret) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }

            var recArr = []; // 记录没有部署状态字段的api id

            for(var i=0;i<ret.length;i++) {
                if (ret[i].deployStatus == undefined) {
                    recArr.push(ret[i]._id);
                }
            }

            if (recArr.length != 0) { // 有api没有部署状态字段
                var tmpquery = {_id:{$in:recArr}};

                // 增加部署状态字段，赋初始值为0
                RequestService.updateList(tmpquery, {deployStatus:0}, function(err,bo) {
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }

                    // 根据查询条件查询api
                    DeployService.findAPI(query, function(err, ret){
                        if (err) {
                            restmsg.errorMsg(err);
                            res.send(restmsg);
                            return;
                        }

                        var apiArr = [];
                        for(var i=0;i<ret.length;i++){

                            //提取需要页面展示的字段
                            var obj = {};
                            obj._id = ret[i]._id;
                            obj.name = ret[i].name;
                            obj.gid = ret[i].gid;
                            obj.pid = ret[i].pid;
                            obj.method = ret[i].method;
                            obj.deployStatus = ret[i].deployStatus;
                            obj.urlsuffix = ret[i].urlsuffix;

                            apiArr[i] = obj;
                        }

                        // 查询api组名
                        DeployService.findGroup(query.pid, function (err, groupRet) {
                            if (err) {
                                restmsg.errorMsg(err);
                                res.send(restmsg);
                                return;
                            }

                            // 组名赋值
                            for (var i=0;i<apiArr.length;i++) {
                                for(var j=1;j<groupRet.length;j++) {
                                    if(apiArr[i].gid === groupRet[j].id) {
                                        apiArr[i].gname = groupRet[j].name;
                                    }
                                }
                            }
                            restmsg.successMsg();
                            restmsg.setRsult(apiArr);
                            res.send(restmsg);
                        });
                    });
                });
            } else {
                // 根据查询条件查询api
                var apiArr = [];
                for(var i=0;i<ret.length;i++){
                    //提取需要页面展示的字段
                    var obj = {};
                    obj._id = ret[i]._id;
                    obj.name = ret[i].name;
                    obj.gid = ret[i].gid;
                    obj.pid = ret[i].pid;
                    obj.method = ret[i].method;
                    obj.deployStatus = ret[i].deployStatus;
                    obj.urlsuffix = ret[i].urlsuffix;

                    apiArr[i] = obj;
                }

                // 查询api组名
                DeployService.findGroup(query.pid, function (err, groupRet) {
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }

                    // 组名赋值
                    for (var i=0;i<apiArr.length;i++) {
                        for(var j=1;j<groupRet.length;j++) {
                            if(apiArr[i].gid === groupRet[j].id) {
                                apiArr[i].gname = groupRet[j].name;
                            }
                        }
                    }
                    restmsg.successMsg();
                    restmsg.setRsult(apiArr);
                    res.send(restmsg);
                });
            }
        });
    });

// 返回查询条件中的分组信息
router.route('/query')
    .get(function (req, res, next) {
        var restmsg = new RestMsg();

        DeployService.findGroup(req.param('pid'), function (err, ret) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            ret.shift(); // 规范数据
            restmsg.successMsg();
            restmsg.setRsult(ret);
            res.send(restmsg);
        })
    });

// 虚拟部署
router.route('/deploy')
    .post(function (req, res, next) {
        var restmsg = new RestMsg();
        var idArr= req.param('idArr'); // id数组
        var dStatusArr= req.param('dStatusArr'); // 部署状态数组
        var urlArr = req.param('urlArr'); // url后缀数组
        var methodArr = req.param('methodArr'); // 方法名数组
        var pid = req.param('pid'); // project id

        var projctQuery = {
            '_id': pid
        };

        //递归更新部署状态
        _privateFun.updDeployStatus(idArr, dStatusArr);

        restmsg.successMsg();
        restmsg.setRsult('部署成功');
        res.send(restmsg);
    });

// 递归调用更新部署状态service
_privateFun.updDeployStatus = function (idArr, dStatusArr) {
    var len = idArr.length;
    if (len === 0) {
        return;
    }
    DeployService.updDeployStatus(idArr[len-1], dStatusArr[len-1], function (err, rt) {
        if (err) {
            restmsg.errmsg(err);
            res.send(restmsg);
            return;
        }

        idArr.pop();
        dStatusArr.pop();
        _privateFun.updDeployStatus(idArr, dStatusArr);
    })
};

module.exports = router;