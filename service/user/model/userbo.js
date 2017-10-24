var mongoose = require('../../../db/db');

var userSchema = mongoose.Schema({
    "username": String, //用户名
    "password": String, //密码
    "project": [], //json数组，每个用户对应的项目和对应的权限 {pid:  ,auth:  }  auth:(0 master)(1 查看)(2 编辑)
    "created_at": Date  //创建时间
});

var user = mongoose.model('user', userSchema, 'user');

module.exports = user;
