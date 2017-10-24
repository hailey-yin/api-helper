var express = require('express');
var router = express.Router();
var UserService = require('../service/user/userservice');
var ProjectService = require('../service/projectservice');
var RestMsg = require('../common/restmsg');

var _privateFun = router.prototype;


_privateFun.prsBO2VO = function(obj){
    var result = obj.toObject({ transform: function(doc, ret, options){
        return {
            id:ret._id,
            name: ret.username
        }
    } });
    return result;
}

router.route('/')
    .get(function (req, res, next) {                 //获取该项目下的用户
        var restmsg = new RestMsg();
        var pid = req.param('pid');
        var name = req.param('name');
        var query = {};
        var list= [];
        query = {project:{$elemMatch : { 'pid': pid} }}
        UserService.findList(query,function(err,obj) {
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            for(var i=0;i< obj.length;i++) {
                var tempObj = {};
                if(name) {
                    if(obj[i].username.indexOf(name) > -1) {
                        tempObj.id = obj[i]._id;
                        tempObj.name = obj[i].username;
                        for (var j = 0; j < obj[i].project.length; j++) {
                            if (pid == obj[i].project[j].pid) {
                                tempObj.status = obj[i].project[j].auth;
                            }
                        }
                    }
                }else {
                    tempObj.id = obj[i]._id;
                    tempObj.name = obj[i].username;
                    for (var j = 0; j < obj[i].project.length; j++) {
                        if (pid == obj[i].project[j].pid) {
                            tempObj.status = obj[i].project[j].auth;
                        }
                    }
                }
                if(tempObj.name != null) {
                    list.push(tempObj);
                }
            }
            restmsg.successMsg();
            restmsg.setRsult(list);
            res.send(restmsg);
        })
    })
    .post(function (req, res, next) {                    //新增该项目下的用户
        var restmsg = new RestMsg();
        var name = req.param('name');
        var auth = req.param('auth');
        var pid = req.param('pid');
        var query = {};
        query.username = {$in:name}
        //UserService.findList(query,function(err,obj) {
        //    if(err) {
        //        restmsg.errorMsg(err);
        //        res.send(restmsg);
        //        return;
        //    }
        //    for(var i=0;i<obj.length;i++) {
        //        for (var j = 0; j < obj[i].project.length; j++) {
        //            if (pid == obj[i].project[j].pid) {
        //                restmsg.errorMsg(obj[i].username + '用户已在项目中,请勿重复添加');
        //                res.send(restmsg);
        //                return;
        //            }
        //        }
        //    }
            var ob = { $push:{"project":{"pid": pid,"auth": parseInt(auth)}}};
            UserService.updateList(query,ob,function(err,obj){
                if(err) {
                    restmsg.errorMsg(err);
                    res.send(restmsg);
                    return;
                }
                restmsg.successMsg();
                restmsg.setRsult(obj);
                res.send(restmsg);
            })
        //})
    })

router.route('/:id')
    .delete(function (req, res, next) {                           //删除该项目下的用户
        var restmsg = new RestMsg();
        var userId = req.param('id');
        var pid = req.param('pid');
        var ob ={ $pull :{"project": { "pid": pid }}};
        UserService.update({_id:userId},ob,function(err,obj){
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult();
            res.send(restmsg);
        })
    })

router.route('/changeAuthStatus')
    .put(function (req, res, next) {                          //改变项目的状态 由公开变为私有
        var restmsg = new RestMsg();
        var query = {};
        var project = {};
        query._id = req.param('pid');
        project.authStatus = req.param('authStatus');
        ProjectService.updateStatus(query,project,function(err,obj){
            if (err) {
                console.error(err);
            }
            restmsg.successMsg();
            restmsg.setRsult();
            res.send(restmsg);
        });
    })

router.route('/users')
    .get(function (req, res, next) {                         //获取该项目下的未被添加的其他用户
        var restmsg = new RestMsg();
        var name = req.param('name');
        var users = req.param('users');
        var query = {};
        if(name) {
            if(users) {
                query = {username:{'$nin' : users, $regex:name, $options: 'i'}};
            }else {
                query.username = new RegExp(name, 'i');
            }
        }else {
            if (users) {
                query.username = {'$nin': users};
            }
        }
        UserService.findList(query,function(err,obj) {
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(obj!==null && obj.length>0){
                obj = obj.map(_privateFun.prsBO2VO)
            }
            restmsg.successMsg();
            restmsg.setRsult(obj);
            res.send(restmsg);
        })
    })

router.route('/projects')
    .get(function (req, res, next) {                             //获取该用户的所有项目
        var restmsg = new RestMsg();
        var userId = req.param('id');
        var name = req.param('name');
        var query = {};
        var queryList = [];
        UserService.findById(userId, function (err,obj){
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            for(var i=0;i<obj.project.length;i++) {
                if(obj.project[i].auth == 0) {
                    queryList.push(obj.project[i].pid);
                }
            }
            query._id = {$in:queryList};
            if (name) {
                query.name = new RegExp(name, 'i'); // 不区分大小写模糊查询条件
            }
            ProjectService.findSimple(query,function(err,obj){
                if(err) {
                    restmsg.errorMsg(err);
                    res.send(restmsg);
                    return;
                }
                restmsg.successMsg();
                restmsg.setRsult(obj);
                res.send(restmsg);
            })
        })
    })

router.route('/edit')
    .post(function (req, res, next) {                             //改变项目下用户权限
        var restmsg = new RestMsg();
        var userId = req.param('id');
        var auth = req.param('auth');
        var pid = req.param('pid');
        var ob = {'project.$.auth':parseInt(auth)};
        UserService.update({_id:userId,'project.pid':pid},ob,function(err,obj){
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult();
            res.send(restmsg);
        })
    })

module.exports = router;

