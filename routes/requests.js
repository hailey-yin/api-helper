var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var ProjectService = require('../service/projectservice');
var RequestService = require('../service/requestservice');
var UserService = require('../service/user/userservice');
var Q = require('q');

var Request = require('../service/model/requestbo');

var _privateFun = router.prototype;

//BO 转 VO 继承BO的字段方法2，并且进行相关字段的扩展和删除
_privateFun.prsBO2VO2 = function(obj){
    var result = obj.toObject({ transform: function(doc, ret, options){
        var status = ret.status==undefined?1:ret.status;
        return {
            id:ret._id,
            name: ret.name,
            info: ret.info,
            desc: ret.desc? ret.desc:null,
            urlprefix: ret.urlprefix,
            status:status,
            ability:ability,
            version:ret.version? ret.version:null,
            groups:ret.groups? ret.groups:null
        }
    } });
    return result;
}

router.route('/:pid/rest')
    //获取项目的API列表
    .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        RequestService.findSimple(pid,function(err,objs){
            if (err) {
                console.error(err);
            }

            if(objs){
//                objs = objs.map(_privateFun.prsBO2VO2);
            }
            restmsg.successMsg();
            restmsg.setRsult(objs);
            res.send(restmsg);
        })
    })
    //添加项目的API列表
    .post(function (req, res, next) {
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        checkAuth(req,pid).then(function(flag) {
            if(flag) {
                var groupid = Number(req.param('groupid',0));

                var postflag = true;
                var request = _privateFun.getresData(req, res, postflag);
                if(!request){
                    return;
                }
                RequestService.save(pid,groupid,request,function(err,obj){
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    restmsg.successMsg();
                    restmsg.setRsult({rid:obj._id});
                    res.send(restmsg);
                })
            }else {
                restmsg.errorMsg('你不具有权限，操作失败');
                res.send(restmsg);
            }
        })
    });

router.route('/:pid/rest/:rid')
    //获取项目的API列表
    .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        var rid = req.params.rid;
        RequestService.findApiSimple(pid,rid,function(err,bo){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(bo);
            res.send(restmsg);
        });
    })
    //修改项目的API列表
    .put(function (req, res, next){
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        checkAuth(req,pid).then(function(flag) {
            if(flag) {
                var rid = req.params.rid;
                var groupid = Number(req.param('groupid',0));

                var postflag = false;
                var request = _privateFun.getresData(req, res, postflag);
                if(!request){
                    return;
                }
                RequestService.update(pid,groupid,rid,request,function(err,id){
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    restmsg.successMsg();
                    restmsg.setRsult({gid:id});
                    res.send(restmsg);
                })
            }else {
                restmsg.errorMsg('你不具有权限，操作失败');
                res.send(restmsg);
            }
        })
    })
    .delete(function (req, res, next){
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        checkAuth(req,pid).then(function(flag) {
            if(flag) {
                var rid = req.params.rid;
                RequestService.remove(rid,function(err,bo){
                    if (err) {
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    if(bo) {
                        restmsg.successMsg();
                        res.send(restmsg);
                    }
                    else{
                        restmsg.errorMsg('删除失败，不存在该API');
                        res.send(restmsg);
                        return;
                    }
                });
            }else {
                restmsg.errorMsg('你不具有权限，操作失败');
                res.send(restmsg);
            }
        })
    });

router.route('/:pid/rest/:rid/group')//修改项目的API分组
    .put(function (req, res, next){
        var rid = req.params.rid;
        var gid =  req.body.gid;
        RequestService.updateGroup(gid,rid,function(err,bo){
            var restmsg = new RestMsg();
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            res.send(restmsg);
        })
    })

//从前台数据组装bo
_privateFun.getresData = function(req,res,postflag){
    var restmsg = new RestMsg();
    var name = req.body.name;//
    var urlsuffix = req.body.urlsuffix;
    var method = req.body.method;
    var output = req.body.output;
    var errStr = '';
    if(!name){
        errStr += ' 名称必填';
    }
    if(!urlsuffix){
        errStr += ' API后缀必填';
    }
    if(!method){
        errStr += ' API方法必填';
    }
    if(!output){
        errStr += ' 输入格式必填';
    }
    if(errStr!=""){
        restmsg.errorMsg(errStr);
        res.send(restmsg);
        return;
    }
    var data = req.body.data;
    if(data){
        data = JSON.parse(req.body.data);//转参数字符串为object
    }
    var ability = 0;
    if(req.body.con){
        ability = req.body.con;
    }

    var request = new Request({
        name:name,//必填
        description:req.body.description,
        urlsuffix:urlsuffix,//必填
        method: method,//必填
        data:data,
        ability:ability,
        output:output,//必填
        outputsuccess:req.body.outputsuccess,
        outputerror :req.body.outputerror,
        detail:req.body.detail,
        status:1,// 只有ability=1时才有作用，默认为成功
        monitorStatus:0// 未被监控状态
    });

    if(postflag) { // 新增api时deploystatus为0
        request.deployStatus = 0; // 新增api时虚拟部署状态为0
        return request;
    } else { // 修改api时deploystatus不变
        return request;
    }

    /*var request = new Request({
        name:name,//必填
        description:req.body.description,
        urlsuffix:urlsuffix,//必填
        method: method,//必填
        data:data,
        ability:ability,
        output:output,//必填
        outputsuccess:req.body.outputsuccess,
        outputerror :req.body.outputerror,
        detail:req.body.detail,
        deployStatus: 0, // 新增api时虚拟部署状态为0
        status:1// 只有ability=1时才有作用，默认为成功，
    });
    return request;*/
}

function checkAuth(req,pid) {
    var defer = Q.defer();
    UserService.findById(req.session.user.uid, function(err,ret) {
        if (err) {
            console.error(err);
        }
        for(var i=0;i< ret.project.length;i++) {
            if((ret.project[i].pid == pid)&& (ret.project[i].auth == 0 || ret.project[i].auth == 2)) {
                defer.resolve(true);
            }
        }
        defer.resolve(false);
    })
    return defer.promise;
}

module.exports = router;
