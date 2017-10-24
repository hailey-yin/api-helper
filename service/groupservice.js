/**
 * 项目组管理服务
 * @type {project|exports}
 */
var Project = require('./model/projectbo');
var Group = require('./model/groupbo');
var Counters = require('./common/counters');
var Request = require('./model/requestbo');

function GroupService() {

}
//新增组
GroupService.save = function (id, name, callback) {
    var query = {
        'groups.name': name,
        _id: id
    };
    Project.find(query, {'groups': 1, 'groups.name': 1, 'groups.id': 1}, function (err, bos) {
        if (err) {
            return console.error(err);
        }
        if (bos && bos.length > 0) {
            callback("分组重名", null);
        } else {
            new Counters().getNextSequence(Counters.IDS.GROUP_ID, function (err, ret) {
                if (err) {
                    return console.error
                }
                var bo = new Group({
                    id: ret,
                    name: name
                })
                Project.update({_id: id}, {
                    $push: {"groups": bo}
                }, function (err, bos) {
                    if (err) {
                        return console.error(err);
                    }
                    callback(null, ret);//返回分组ID
                });
            });
        }
    });

}

//查询项目基本信息（查询到组的级别）
GroupService.findGroupzSimple = function (id, callback) {
    var query = {};
    query.status = { $ne: 0 }//查询不能为删除
    if (id) {//转意ID
        query._id = id//项目ID
    }
    Project.find(query, function (err, bos) {
        if (err) {
            return console.error(err);
        }
        callback(null, bos);
    });
}
//更新组
GroupService.update = function (pid, gid, name, callback) {
    var query = {
        _id: pid,
        'groups': {'$elemMatch': {'id': {'$ne': gid}, 'name': name}}//查询name 是否存在，排除掉gid为当前ID
    };
    Project.find(query, {'groups': 1}, function (err, bos) {
        if (err) {
            return console.error(err);
        }
        if (bos && bos.length > 0) {
            callback("分组重名", null);
        } else {
            query = {
                _id: pid,
                'groups.id': gid
            };
            Project.update(query, {'$set': {'groups.$.name': name}}, function (err, bos) {
                if (err) {
                    return console.error(err);
                }
                callback(null, bos);
            });
//            Project.update(query,{'$set':{'groups.$.name':name}},function (err, bos) {
//                if (err){
//                    return console.error(err);
//                }
//                callback(null,bos);
//            });
        }
    });
}


//删除组
GroupService.remove = function (pid, gid, callback) {
//    db.projects.update(
//        {
//            _id:'12'
//        },{
//            '$pull':{
//                'groups':{
//                    "id" : 18
//                }
//            }
//        }
//    );
    Request.find({pid:pid,gid:gid},function(err,objs){
        if(objs&&objs.length>0){
            callback("该分组下包含API，请先移除API后再删除分组");
            return;
        }
        Project.update({
            _id: pid
        }, {
            $pull: {
                'groups': {
                    "id": gid
                }
            }
        }, function (err, bos) {
            if (err) {
                return console.error(err);
            }
            callback(null, bos);
        });
    })
}


module.exports = GroupService;