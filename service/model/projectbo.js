/**
 * 项目BO
 * @type {mongoose|exports}
 */
var mongoose = require('../../db/db');

var projectSchema = mongoose.Schema({
    "_id": String,//"<项目ID>",
    "name": String,//"<项目名称>",
    "info": String,//"<项目简介>",
    "desc": String,//"<项目描述>",
    "urlprefix": String,//"<项目路径前缀>",
    "status":Number,//<项目状态 0无效|1有效>,
    "version":String,//"<项目默认版本>"
    "groups": [],//"项目分组"
    "authStatus": Number, //项目权限 1公开 2私有
    "virtualUrl": String, //"项目虚拟部署地址"
    "author": String //创建者
});

var project = mongoose.model('project', projectSchema);

module.exports = project;