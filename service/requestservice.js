/**
 * 项目API管理服务
 * @type {project|exports}
 */
var Project = require('./model/projectbo');
var Request = require('./model/requestbo');
var Counters = require('./common/counters');

function RequestService(){

}
//保存项目API
RequestService.save = function(pid,gid,bo,callback){
    var gid = gid?gid:0;
    var retquery = {'urlprefix':1};//如果分组为0 ，则不需要判断项目是否具有该组
    if(gid!=0){
        retquery.groups = 1;
    }
    Project.findOne({'_id':pid},retquery,function(err,pro){
        if(err){
            callback(err);
            return;
        }
        if(pro){
            var urlprefix = pro.urlprefix;
            var groups = pro.groups;
            //判断组ID是否在项目中
            if(groups){
                var groupslen = groups.length;
                var groupsflag = false;//包含组标志
                for(var i=0;i<groupslen;i++){
                    if(groups[i].id == gid){
                        groupsflag = true;
                        break;
                    }
                }
                if(!groupsflag){
                    callback('该项目不包含该分组');return;
                }
            }
            var urlsuffix = bo.urlsuffix;
            //为了保持统一，所有的API后缀不能以/作为开头
            if(urlsuffix.indexOf("/")==0){
                urlsuffix = urlsuffix.substring(1);
                bo.urlsuffix = urlsuffix;
            }
            var method = bo.method;
            var name = bo.name;
            Request.findOne({'pid':pid,'name':name},function(err,obj){
                if(obj){
                    callback('该项目已注册相同名称API');
                    return;
                }else{
                    Request.findOne({'pid':pid,'urlsuffix':urlsuffix,'method':method},function(err,obj){
                        if(obj){
                            callback('已经注册相同路径API');return;
                        }
                        bo.pid = pid;
                        bo.gid = gid?gid:0;
                        bo.url = urlprefix+urlsuffix;
                        bo.ability == undefined?0:bo.ability;
                        bo.save(function (err, ret) {
                            if (err) {
                                return console.error(err);
                            }
                            callback(null, ret);
                        });
                    });
                }
            });
        }else{
            callback('不存在该项目');
        }
    })
}

//查询项目API基本信息列表（项目层级）
RequestService.findSimple = function(pid,callback){
    var query = {
        '_id': pid
    };
    Project.findOne(query,function (err, bo) {
        if (err){
            callback(err);
            return console.error(err);
        }
        if(bo){
            var groups = bo.groups;
            var gLen = groups.length;
            var gids = [];
            for(var i=0;i<gLen;i++){
                var group = groups[i];
                gids[group.id] = group;
            }
            Request.find({'pid':pid},{
                '_id':1,
                'name':1,
                'url':1,
                'urlsuffix':1,
                'method':1,
                'gid':1,
                'ability':1
            },function(err,bos){
                bos.map(function(bo){
                    var req = bo.toObject();
                    req.id = req._id;
                    var gid = req.gid;
                    delete req._id;
                    delete req.gid;
                    if(gids[gid]){
                        gids[gid].requests.push(req);
                    }
                });
                callback(null, bo);
            });
        }else{
            callback('不存在该项目');
        }
    });
}
//查询项目API基本信息（项目API层级）
RequestService.findApiSimple = function(pid,rid,callback){
    var query = {
        '_id': rid
    };
    Request.findOne(query,{
//        'groups.requests':1//只需要查询出requests层级
    },function (err, bo) {
        if (err){
            return console.error(err);
        }
        callback(null,bo);
    });
}

//查询项目API
RequestService.findApi = function(query,callback){
    Request.find(query,function (err, bos) {
        if (err){
            return console.error(err);
        }
        callback(null,bos);
    });
}

//更新项目API
RequestService.update = function(pid,gid,rid,bo,callback){
    Project.find({'_id':pid},{'urlprefix':1},function(err,bos){
        if(err){
            callback(err);
            return;
        }
        if(bos&&bos.length>0){
            var urlprefix = bos[0].urlprefix;
            var urlsuffix = bo.urlsuffix;
            //为了保持统一，所有的API后缀不能以/作为开头
            if(urlsuffix.indexOf("/")==0){
                urlsuffix = urlsuffix.substring(1);
                bo.urlsuffix = urlsuffix;
            }
            var method = bo.method;
            var name = bo.name;
            Request.findOne({'pid':pid,'name':name,'_id':{'$ne':rid}},function(err,obj){
                if(obj){
                     callback('该项目已注册相同名称API');
                }else{
                    Request.findOne({'pid':pid,'urlsuffix':urlsuffix,'method':method,'_id':{'$ne':rid}},function(err,obj){
                        //如果直接使用bo对象需要转换对象并且删除_id属性
                        bo = bo.toObject();
                        delete bo._id;
                        if(obj){
                            callback('已经注册相同路径API');return;
                        }
                        bo.pid = pid;
                        bo.gid = gid?gid:0;
                        bo.url = urlprefix+urlsuffix;
                        Request.update({'_id':rid},bo,function (err, ret) {
                            if (err) {
                                callback(err);
                                return console.error(err);
                            }
                            callback(null, ret);
                        });
                    });
                }
            });
        }else{
            callback('不存在该项目');
        }
    })
}

/**
 * 修改api监控状态
 * @param rids  RequestID，即API ID
 * @param op 监控状态
 * @param callback
 */
RequestService.updateStatus = function(rid,op,callback){
    Request.update({'_id':rid},{'$set':{'monitorStatus':op}},function(err,ret){
       if(err){
           callback(err);
           return console.error(err);
       }
        callback(null,ret);
    });
}

//批量修改API表中的监控状态
RequestService.updateStatusList = function(query,op,callback){
    Request.update(query,{'$set':{'monitorStatus':op}},{'multi':true},function(err,ret){
        if(err){
            callback(err);
            return console.error(err);
        }
        callback(null,ret);
    });
}

//更新项目API所在组
RequestService.updateGroup = function(gid,rid,callback){
    Request.update({'_id':rid},{gid:gid},function (err, ret) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, ret);
    });
}

//更新项目API的全局路径
RequestService.updateUrl = function(pid,urlprefix,callback){
    Request.find({'pid':pid},{'urlsuffix':1},function(err,bos){
        if (err) {
            callback(err);
            return console.error(err);
        }
        if(bos&&bos.length>0){
            var boslen = bos.length;
            //如下有两种写法，作为事例代码，实际根据需要编写代码
            //递归进行同步更新，关注处理结果
//            syncUpdate(boslen,bos,urlprefix,callback);
            //异步更新，不关注处理结果
            asyncUpdate(boslen,bos,urlprefix,callback);

        }
    });

}

//异步更新，不关注处理结果
function asyncUpdate(boslen,bos,urlprefix,callback){
    for(var i=0;i<boslen;i++){
        var bo = bos[i];
        var url = urlprefix+bo.urlsuffix;
        Request.update({'_id':bo._id},{'url':url},function (err, ret) {
            if (err) {
                return console.error(err);
            }
        });
    }
    callback();
}

//同步更新，关注处理结果
function syncUpdate(boslen,bos,urlprefix,callback){
    updateurl(boslen,bos,urlprefix,callback);//递归处理同步
}

//递归进行更新
function updateurl(i,bos,urlprefix,callback){
    if(i==0){
        callback();
        return;
    }
    else{
        i--;
        var bo = bos[i];
        var url = urlprefix+bo.urlsuffix;
        Request.update({'_id':bo._id},{'url':url},function (err, ret) {
            if (err) {
                callback(err);
                return console.error(err);
            }
            updateurl(i,bos,urlprefix,callback);
        });
    }
}

//删除项目API
RequestService.remove = function(rid,callback){
    Request.findOneAndRemove({_id:rid},function (err, bo) {
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,bo);
    });
}

/**
 * @describe 根据查询条件query获取project.request列表
 * @author GLJ
 * @date 2015-07-08
 */
RequestService.getRequestList = function(query,callback){
    if(!query){
        query = {};
    }
    if(query.id){
        query._id = query.id
        delete query.id;
    }
    Request.find (query, function (err, bos) {
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,bos);
    });
};

RequestService.updateOne = function(query,obj,callback){
    Request.update(query,obj,function (err, bos) {
        if (err){
            callback(err);
            return console.error(err);
        }else {
            callback(null, null);
        }
    });
}

RequestService.updateList = function(query,obj,callback){
    Request.update(query,obj,{multi:true},function (err, bos) {
        if (err){
            callback(err);
            return console.error(err);
        }else {
            callback(null, null);
        }
    });
}

module.exports = RequestService;
