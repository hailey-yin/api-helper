var User = require('./model/userbo');
var Page = require('../../common/page');

function UserService(){

}

/**
 * 用户登录查询
 *
 * @param login 登录名
 * @param pwd 密码
 * @param callback
 */
UserService.login = function(login, pwd, callback){
    User.findOne({username: login, password: pwd},function (err, bo) {
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,bo);
    });
}

/**
 * 获取用户数量
 *
 * @param callback
 */
UserService.count = function(callback){
    User.count(function (err, count) {
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,count);
    });
}

/**
 * 根据id获取用户信息
 *
 * @param id 用户id
 * @param callback
 */
UserService.findById = function(id,callback){
    User.findById(id, function (err, bo) {
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,bo);
    });
}

/**
 * 根据用户名获取用户信息
 *
 * @param name 用户名
 * @param callback
 */
UserService.findByName = function(name,callback){
    User.findOne({username:name},function(err,pro){
        if (err){
            callback(err);
            return console.error(err);
        }
        if(pro){
            callback(null,pro);
        }else{
            callback("不存在该用户");
        }
    });
}

/**
 * 保存用户
 *
 * @param bo userbo对象
 * @param callback
 */
UserService.save = function(bo,callback){
    bo.created_at = new Date();
    bo.save(function (err, bo) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, bo);
    });
}

/**
 * 查询用户列表
 *
 * @param query 查询条件
 * @param callback
 */
UserService.findList = function(query,callback){
    if(!query){
        query = {};
    }
    User.find(query,function(err,bos){
        if (err){
            callback(err);
            return console.error(err);
        }
        callback(null,bos);
    });
}

/**
 * 查询用户列表 - 分页
 *
 * @param query 查询条件
 * @param callback
 */
UserService.findPage = function(query,callback){
    if(!query){
        query = {};
    }
    //处理分页
    var row = query.row;
    var start = query.start;
    var options = {'$slice':2};
    options['limit'] = row;
    options['skip'] = start;
    delete query.row;
    delete query.start;
    var page = new Page();
    User.count(query,function(err,count){
        if (err){
            callback(err);
            return console.error(err);
        }
        if(count===0){//无数据
            callback(null,page);
            return;
        }
        User.find(query,null,options,function (err, bos) {
            if (err){
                callback(err);
                return console.error(err);
            }
            page.setPageAttr(count);
            page.setData(bos);
            callback(null,page);
        });
    });

}

/**
 * 更新多条用户信息
 *
 * @param query 匹配条件
 * @param obj 用户需要修改的信息
 * @param callback 回调
 */

UserService.updateList = function(query,obj,callback){
    User.update(query,obj,{multi:true},function (err, bos) {
        if (err){
            callback(err);
            return console.error(err);
        }else {
            callback(null, null);
        }
    });
}

/**
 * 更新用户信息
 *
 * @param
 * @param obj 用户需要修改的信息
 * @param callback 回调
 */
UserService.update = function(query,obj,callback){
    User.findOne(query,function(err,pro){
        if (err){
            callback(err);
            return console.error(err);
        }
        if(pro){
            User.update(query,obj,function (err, bos) {
                if (err){
                    callback(err);
                    return console.error(err);
                }else{
                    callback(null,bos);
                }
            });
        }else{
            callback("不存在该用户");
        }
    });
}

/**
 * 重名校验
 * 返回：true没有重名|false有重名
 *
 * @param name 登录名
 * @param callback
 */
UserService.duplication = function (name, callback){
    User.count({username: name}, function (err, count) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        if(count === 0){
            callback(null, true);
        }else{
            callback(null, false);
        }
    });
}

module.exports = UserService;