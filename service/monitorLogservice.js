/**
 * 项目监控日志servicer
 * Created by yuqing on 2016/2/26.
 */
var MonitorLog = require('./model/monitorlogbo');
var Page = require('../common/page');

var MONITOR_HANDLELOG = 1;//日志已处理状态

function MonitorLogService() {

}

/**
 *  保存监控日志
 * @param bo
 * @param callback
 */
MonitorLogService.save = function (bo, callback) {
    console.log(bo);
    bo.save(function (err, bo) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        callback(null, bo);
    });
}

/**
 *  查询全部日志-分页
 * @param query
 * @param callback
 */
MonitorLogService.findList = function (query, callback) {
    if (!query) {
        query = {};
    }
    //处理分页
    var row = query.row;
    var start = query.start;
    var options = {'$slice': 2};
    options['limit'] = row;
    options['skip'] = start;
    delete query.row;
    delete query.start;
    var page = new Page();
    MonitorLog.count(query, function (err, count) {
        if(err) {
            callback(err);
            return console.error(err);
        }
        if(count === 0) {
            callback(null, page);
            return;
        }
        MonitorLog.find(query, null, options, function (err, bos) {
            if (err) {
                callback(err);
                return console.error(err);
            }
            page.setPageAttr(count);
            page.setData(bos);
            callback(null, page);
        });
    });
}

/**
 *  获取单条监控日志
 * @param logid
 * @param callback
 */
MonitorLogService.findByLogID = function (query, callback) {
    MonitorLog.findOne(query, function (err, ret) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        if(ret) {
            callback(null, ret);
        } else {
            callback("不存在该日志");
        }
    });
}

/**
 *  处理单条日志
 * @param logid
 * @param callback
 */
MonitorLogService.handleLog = function (query, callback) {
    console.log(query);
    MonitorLog.findOne(query, function (err, pro) {
        if (err) {
            callback(err);
            return console.error(err);
        }
        if (pro) {
            MonitorLog.update(query, {'status': MONITOR_HANDLELOG}, function (err, bos) {
                if (err) {
                    callback(err);
                    return console.error(err);
                } else {
                    callback(null, bos);
                }
            });
        } else {
            callback("不存在该日志");
        }
    });
}


module.exports = MonitorLogService;