var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var ProjectService = require('../service/projectservice');
var GroupService = require('../service/groupservice');

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
            version:ret.version? ret.version:null,
            groups:ret.groups? ret.groups:null
        }
    } });
    return result;
}

router.route('/:pid/groups')
    .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        GroupService.findGroupzSimple(pid,function(err,objs){
            if (err) {
                console.error(err);
            }

            if(objs){
                objs = objs.map(_privateFun.prsBO2VO2);
            }
            var restmsg = new RestMsg();
            restmsg.successMsg();
            restmsg.setRsult(objs);
            res.send(restmsg);
        })
    })
    .post(function (req, res, next) {
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        var name = req.body.name;
        if(!name){
            restmsg.errorMsg('新增项目组，组名为必填！');
            res.send(restmsg);
            return;
        }
        var restmsg = new RestMsg();
        GroupService.save(pid,name,function(err,id){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult({gid:id});
            res.send(restmsg);
        })
    });

router.route('/:pid/groups/:gid')
    .put(function (req, res, next){
        var pid = req.params.pid;
        var gid = Number(req.params.gid);
        var name = req.body.name;
        var restmsg = new RestMsg();
        if(!name){
            restmsg.errorMsg('修改项目组，组名为必填！');
            res.send(restmsg);
            return;
        }
        GroupService.update(pid,gid,name,function(err,bos){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(bos);
            res.send(restmsg);
        });
    })
    .delete(function (req, res, next){
        var pid = req.params.pid;
        var gid = Number(req.params.gid);
        var restmsg = new RestMsg();
        if(gid==0){
            restmsg.errorMsg("默认分组不能删除");
            res.send(restmsg);
            return;
        }
        GroupService.remove(pid,gid,function(err,bos){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(bos);
            res.send(restmsg);
        });
    });
module.exports = router;
