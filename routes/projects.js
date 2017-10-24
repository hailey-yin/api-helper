var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var Strutils = require('../common/strutils');
var ProjectService = require('../service/projectservice');
var UserService = require('../service/user/userservice');
var ProjectBO = require('../service/model/projectbo');
var groups = require('./groups');
var deployHelper = require('../service/deployHelper');
var Q = require('q');

var _privateFun = router.prototype

//BO 转 VO 继承BO的字段方法2，并且进行相关字段的扩展和删除
_privateFun.prsBO2VO2 = function(obj){
    var result = obj.toObject({ transform: function(doc, ret, options){
        var status = ret.status==undefined?1:ret.status;
        return {
            id:ret._id,
            name: ret.name,
            info: ret.info? ret.info:'',
            desc: ret.desc? ret.desc:'',
            urlprefix: ret.urlprefix,
            status:status,
            version:ret.version? ret.version:'',
            authStatus:ret.authStatus,
            virtualUrl: ret.virtualUrl,
            author: ret.author
        }
    } });
    return result;
}



router.route('/')
 .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var query = {};
        var name = req.param('name');
        if(name){
            query.name = new RegExp(name,'i');//不区分大小写模糊查询条件
        }
        if(!req.session.user) {
            query.authStatus = 1;
        }
        ProjectService.findSimple(query,function(err,objs){
            if (err) {
                console.error(err);
            }

            if(objs){
                objs = objs.map(_privateFun.prsBO2VO2);
            }
            if(req.session.user) {
                var tempArray = [];
                UserService.findById(req.session.user.uid, function(err, ret) {
                    if (err) {
                        console.error(err);
                    }
                    for(var i=0;i< objs.length;i++) {
                        if(objs[i].authStatus == 2) {
                            for (var j = 0; j < ret.project.length; j++) {
                                if(ret.project[j].pid == objs[i].id) {
                                    tempArray.push(objs[i]);
                                }
                            }
                        }else {
                            tempArray.push(objs[i]);
                        }
                    }
                    restmsg.successMsg();
                    restmsg.setRsult(tempArray);
                    res.send(restmsg);
                })
            }else {
                restmsg.successMsg();
                restmsg.setRsult(objs);
                res.send(restmsg);
            }
        })
})
 .post(function (req, res, next) {
        var project = new ProjectBO();
        var restmsg = new RestMsg();
        var name = req.param('name');
        var userId = req.session.user.uid;
        if(!name){
            restmsg.errorMsg('项目名称 必填');
            res.send(restmsg);
            return;
        }
        project.name = name;
        project.urlprefix =  req.param('urlprefix','http://<ip>:<port>/<context>');//后面的值为默认值
        project.info = req.param('info','');
        project.desc = req.param('desc','');
        project.status = 1;//初始化正常状态
        project.authStatus = req.param('authStatus');
        project.author = userId;
        ProjectService.findSimple({name:name},function(err,objs){
            if(objs&&objs.length>0){
                restmsg.errorMsg('项目名称重复');
                res.send(restmsg);
                return;
            }
            project.virtualUrl = serverAddress.ip + ':' + serverAddress.port + '/api/virtual/' + name.toLowerCase();
            new ProjectService().save(project,function(err,obj){
                if (err) {
                    console.error(err);
                }
                var ob = { $push:{"project":{"pid": obj._id,"auth": 0}}};
                UserService.update({_id:userId},ob,function(err,obj){
                    if (err) {
                        console.error(err);
                    }
                    restmsg.successMsg();
                    restmsg.setRsult({pid:obj._id});
                    res.send(restmsg);
                })
            });
        });
});

router.route('/updateUrl/:name')
    .get(function (req, res, next){
        var restmsg = new RestMsg();
    var name = req.params.name;
    var geturl = serverAddress.ip + ':' + serverAddress.port + '/api/virtual/' + name.toLowerCase();
    ProjectService.updateStatus({name:name},{virtualUrl:geturl},function(err,obj){
        if (err) {
            console.error(err);
            return;
        }
        ProjectService.findOne({name:name},function(err,objs) {
            if (err) {
                console.error(err);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(objs);
            res.send(restmsg);
        })
    })
})

router.route('/:pid')
    .put(function (req, res, next) {
        var pid = req.params.pid;
        var restmsg = new RestMsg();
        checkAuth(req,pid).then(function(flag) {
            if(flag) {
                var project = new ProjectBO();
                project._id = pid;
                var name = req.param('name');
                if (!name) {
                    restmsg.errorMsg('项目名称 必填');
                    res.send(restmsg);
                    return;
                }
                project.name = name;
                project.urlprefix = req.param('urlprefix', 'http://<ip>:<port>/<context>');//后面的值为默认值
                project.info = req.param('info', null);
                project.desc = req.param('desc', null);
                project.status = 1;//初始化正常状态
                project.authStatus = req.param('authStatus');
                ProjectService.findSimple({
                    '_id': {'$ne': pid},
                    'name': name
                }, function (err, objs) {
                    if (objs && objs.length > 0) {
                        if (objs[0]['_id'] != pid) {
                            restmsg.errorMsg('项目名称重复');
                            res.send(restmsg);
                            return;
                        }
                    }
                    ProjectService.update(project, function (err, obj) {
                        if (err) {
                            console.error(err);
                        }
                        res.send(restmsg.successMsg());
                    });
                });
            }else {
                restmsg.errorMsg('你不是创建者，操作失败');
                res.send(restmsg);
            }
        })
    })
   .delete(function(req,res,next){
        var pid = req.params.pid;
        var restmsg = new RestMsg();
        checkAuth(req,pid).then(function(flag) {
            if(flag) {
                ProjectService.remove(pid, function (err, obj) {
                    if (err) {
                        console.error(err);
                    }
                    //if(obj){
                    //    restmsg.errorMsg('不存在该项目');
                    //    res.send(restmsg);
                    //    return;
                    //}
                    deployHelper.unbindByPid(pid, function (flag) {
                        if (flag) {
                            res.send(restmsg.successMsg());
                        } else {
                            restmsg.successMsg('项目删除成功，但项目下的api解除部署失败');
                            res.send(restmsg);
                        }
                    })
                });
            }else {
                restmsg.errorMsg('你不是创建者，操作失败');
                res.send(restmsg);
            }
        })
    });

//分组
//router.use('/:pid/groups', function(req, res, next){
//    console.log(req.params.pid)
//    next();
//});
//router.use('/:pid/groups', groups);

function checkAuth(req,pid) {
    var defer = Q.defer();
    UserService.findById(req.session.user.uid, function(err,ret) {
        if (err) {
            console.error(err);
        }
        for(var i=0;i< ret.project.length;i++) {
            if((ret.project[i].pid == pid)&& ret.project[i].auth == 0) {
                defer.resolve(true);
            }
        }
        defer.resolve(false);
    })
    return defer.promise;
}

module.exports = router;
