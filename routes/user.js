var express = require('express');
var router = express.Router();
var crypto = require('../common/encrypt');
var RestMsg = require('../common/restmsg');
var UserService = require('../service/user/userservice');
var UserBO = require('../service/user/model/userbo');

var _privateFun = router.prototype


/**
 * 注册
 */
router.route('/register')
    .post(function (req, res, next) {
        var restmsg = new RestMsg();
        var user = new UserBO();
        var name = req.param('name');
        var pwd = req.param('pwd');
        if(!name){
            restmsg.errorMsg('用户名称 必填');
            res.send(restmsg);
            return;
        }
        if(!pwd){
            restmsg.errorMsg('登录密码 必填');
            res.send(restmsg);
            return;
        }
        UserService.duplication(name,function(err, bos) {
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(bos) {                                       //未重名
                user.username = name;
                user.created_at = new Date();
                user.password = crypto.sha1Hash(pwd);
                UserService.save(user,function(err,obj){
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    restmsg.successMsg();
                    restmsg.setRsult({uid:obj._id,name:obj.username,project:obj.project});
                    res.send(restmsg);
                });
            }else {                                     //用户名重名
                restmsg.errorMsg('用户名已被注册');
                res.send(restmsg);
                return;
            }
        });
    });

/**
 * 获取所有用户，除了自身
 */
router.route('/list')
    .get(function (req, res, next) {
        var query = {};
        var restmsg = new RestMsg();
        query._id = {$ne: req.session.user.uid};
        UserService.findList(query,function(err,bos){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(bos){
                if(bos!==null && bos.length>0){
                    bos = bos.map(_privateFun.prsBO2VO);
                }
            }
            restmsg.successMsg();
            restmsg.setRsult(bos);
            res.send(restmsg);
        })
    });

/**
 * 登录
 */
router.route('/login')
    .post(function (req, res, next) {
        var username = req.param('name');
        var pwd = crypto.sha1Hash(req.param('pwd'));
        var restmsg = new RestMsg();
        UserService.findByName(username,function(err,obj){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(pwd == obj.password) {
                req.session.user = {
                    uid : obj._id,
                    name : obj.username
                }
                var tempobj = {
                    uid : obj._id,
                    name : obj.username
                };
                restmsg.successMsg();
                restmsg.setRsult(tempobj);
                res.send(restmsg);
            }else {
                restmsg.errorMsg('密码错误');
                res.send(restmsg);
                return;
            }
        });
});

/**
 * 登出
 */
router.route('/logout')
    .get(function (req, res, next) {
       req.session.user = null;
        var restmsg = new RestMsg();
        restmsg.successMsg('账号已退出');
        res.send(restmsg);
    });


router.route('/:uid')
    .get(function(req,res,next){
        //获取用户信息（没有密码字段）

        var uid = req.params.uid;
        var restmsg = new RestMsg();
        UserService.findById(uid,function(err,obj){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            obj = obj.toObject();
            delete obj.password;
            restmsg.successMsg();
            restmsg.setRsult(obj);
            res.send( restmsg);
        });
    })
    .put(function (req, res, next) {

        //修改用户信息
        var restmsg = new RestMsg();
        var user = {};
        var query = {};
        query._id = req.params.uid;
        var uid = req.params.uid;
        var oldpwd = req.param('oldpwd');
        var newpwd = req.param('newpwd');
        if(!newpwd){
            restmsg.errorMsg('用户密码 必填');
            res.send(restmsg);
            return;
        }
        var moldpwd = crypto.sha1Hash(oldpwd);
        user.password = crypto.sha1Hash(newpwd);
        UserService.findById(uid,function(err,obj){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(obj.password == moldpwd) {
                UserService.update(query, user, function(err,obj){
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    res.send(restmsg.successMsg());
                });
            }else {
                restmsg.errorMsg('原密码错误');
                res.send(restmsg);
                return;
            }
        });
    })


module.exports = router;
