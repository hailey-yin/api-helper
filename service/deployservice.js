/**
 * 虚拟部署API服务
 * @type {project|exports}
 */

var Project = require('./model/projectbo');
var Request = require('./model/requestbo');
var Counters = require('./common/counters');

function DeployService () {

}

// 根据条件查询出api
DeployService.findAPI = function (query, callback) {
    Request.find(query, function (err, ret) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, ret);
    });
}

// 查询分组信息
DeployService.findGroup = function (pid, callback) {
    Project.findOne({'_id': pid}, function (err, ret) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, ret.groups);
    })
}

// 更新部署状态
DeployService.updDeployStatus = function (id, dStatus, callback) {
    Request.update({'_id': id}, {'deployStatus': dStatus}, function (err, ret) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, ret);
    })
}

module.exports = DeployService;




