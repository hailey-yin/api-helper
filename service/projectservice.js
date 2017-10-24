/**
 * 项目管理服务
 * @type {project|exports}
 */
var Project = require('./model/projectbo');
var Group = require('./model/groupbo');
var Counters = require('./common/counters');
var RequestService = require('./requestservice');

function ProjectService(){

}
//保存项目
ProjectService.prototype.save = function(bo,callback){
    new Counters().getNextSequence('pid',function(err,ret){
        if(err){return console.error}
        bo._id = ret;
        var groupDef = new Group({
            id:0,
            name:'default'
        });
        //为了保持统一，所有的API前缀最后以/作为结尾
        if(bo.urlprefix&&bo.urlprefix.lastIndexOf("/")!=bo.urlprefix.length-1){
            bo.urlprefix = bo.urlprefix+"/";
        }
        bo.groups = [groupDef]
        bo.save(function (err, bo) {
            if (err) {
                return console.error(err);
            }
            callback(null, bo);
        });
    });

}

//查询项目基本信息（第一层级）
ProjectService.findSimple = function(query,callback){
    if(!query){
        query = {};
    }
    if(query.id){//转意ID
        query._id =query.id//状态不等于删除状态
        delete query.id;
    }
    if(query.status==undefined||query.status==null){
        query.status ={ $ne: 0 }//状态不等于删除状态
    }
    Project.find(query,{
        groups:0//groups层级内容不需要查询出来
    },function (err, bos) {
        if (err){
            return console.error(err);
        }
        callback(null,bos);
    });
}
//更新项目
ProjectService.update = function(bo,callback){
    //如果直接使用bo对象需要转换对象并且删除_id属性
    Project.findOne({_id:bo._id},function(err,pro){
        if (err){
            callback(err);
            return console.error(err);
        }
        if(pro){
            bo = bo.toObject();
            var id = bo._id;
            delete bo._id;
            delete bo.groups;//不更新组
            //为了保持统一，所有的API前缀最后以/作为结尾
            if(bo.urlprefix&&bo.urlprefix.lastIndexOf("/")!=bo.urlprefix.length-1){
                bo.urlprefix = bo.urlprefix+"/";
            }
            Project.update({_id:id},bo,function (err, bos) {
                if (err){
                    return console.error(err);
                }
                if(bo.urlprefix!=pro.urlprefix){//如果路径进行了修改,则需要同步更改API列表
                    RequestService.updateUrl(id,bo.urlprefix,callback);
                }else{
                    callback();
                }
            });
        }else{
            callback("不存在该项目");
        }
    });
}

//更新项目的状态
ProjectService.updateStatus = function(query,obj,callback){
    Project.findOne(query,function(err,pro){
        if (err){
            callback(err);
            return console.error(err);
        }
        if(pro){
            Project.update(query,obj,function (err, bos) {
                if (err){
                    callback(err);
                    return console.error(err);
                }else{
                    callback(null,bos);
                }
            });
        }else{
            callback("不存在该项目");
        }
    });
}

//删除项目
ProjectService.remove = function(id,callback){
    Project.update({_id:id},{status:0},function (err, bos) {
        if (err){
            return console.error(err);
        }
        callback(null,bos);
    });
}

ProjectService.findOne = function(query,callback){
    Project.findOne(query,function (err, bo) {
        if (err){
            callback(err);
            return console.error(err);
        }
        else{
            callback(null,bo);
        }
    });
}


module.exports = ProjectService;