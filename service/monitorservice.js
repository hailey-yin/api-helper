/**
 * 项目API监控service
 * Created by CK on 2015/7/6.
 */
var Project = require('./model/projectbo');
var Monitor = require('./model/monitorbo');
var Page = require('../common/page')

var MONITOR_REMOVED = true;//已删除状态
var MONITOR_UNREMOVED = false;//未删除状态

function MonitorService() {

}

/**
 * 添加监控列表
 * @param monitorlist
 * @param callback
 */
MonitorService.savelist = function(monitorlist,callback){
    Monitor.create(monitorlist, function (err, small) {
        if (err){
            return console.error(err);
        }
        callback(null, true);
    })
}

/**
 * 查看监控信息
 * @param mid
 * @param callback
 */
MonitorService.findById = function(mid,callback){
    Monitor.findOne({_id:mid},function(err,pro){
        if(err){
            callback(err);
            console.error(err);
            return;
        }
        if(pro) {
            var bo = {
                "id": pro._id,
                "pid": pro.pid,
                "aid": pro.aid,
                "name": pro.name,
                "monitorUrl": pro.url,
                "monitorApiParams": pro.params,
                "monitorHeaders": pro.headers,
                "email": pro.email,
                "alarmtype": pro.alertrules,
                "alarminterval": pro.alerttime,
                "monitorinterval": pro.interval,
                "expectdata": pro.expectresult,
                "ability":pro.ability
            }
            callback(null,bo);
        }else {
            callback("不存在该监控API！");
        }
    })
}

/**
 * 修改api监控状态
 * @param rid
 * @param op
 * @param callback
 */
MonitorService.updateStatus = function(rid,op,callback){
    Monitor.update({'aid':rid,'removed':false},{ability:op},function(err,ret){
        if(err){
            callback(err);
            return console.error(err);
        }
        callback(null, ret);
    });
}

/**
 * 修改/配置监控
 * @param mid
 * @param request 具体配置内容
 * @param callback
 */
MonitorService.updateMonitorConfig = function(mid,bo,callback){
    Monitor.update({_id:mid},bo,function(err,ret){
        if(err){
            callback(err);
            return console.error(err);
        }
        callback(null, ret);
    })
}

/**
 * 删除监控API（将API的监控状态置为0，不可监控状态即可）
 *
 * @param rid RequestID，即API ID
 * @param callback
 *
 */
MonitorService.remove = function(aid, callback) {
    var query = {
        'aid':aid,
        'removed': MONITOR_UNREMOVED
    };
    Monitor.find(query, function(err, apis) {
        if (err) {
            callback(err);
            return;
        }
        if (apis && apis.length > 0) {
            Monitor.update(query, {'removed': MONITOR_REMOVED}, function (err, ret) {
                if (err) {
                    callback(err);
                    return console.error(err);
                }
                callback(null, ret);
            });
        } else {
            callback('该API没有被监控，不能删除！');
            return;
        }
    });
};

/**
 * 分页查询监控列表
 * @param query 查询条件
 * @param start 起始位置
 * @param row   行数
 * @param callback
 */
MonitorService.getMonitorPage = function(query,start,row,callback) {
    if(!query){
        query = {};
    }
    var options = {'$slice': 2};
    options['limit'] = row;
    options['skip'] = start;
    var page = new Page();
    page.row = row;
    Monitor.count(query,function(err,count) {
        if(err) {
            callback(err);
            return console.error(err);
        }
        if(count <= 0) {
            page.setData([]);
            callback(null,page);
            return;
        }
        page.setPageAttr(count);
        Monitor.find(query, null, options,function(err,bos){
            if(err) {
                callback(err);
                return console.error(err);
            }
            if(bos) {
                page.setData(bos);
                callback(null,page);
            }
        });
    })
}

module.exports = MonitorService;
