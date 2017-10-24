/**
 * Created by yhl on 2016/2/24.
 */

var mongoose = require('../../db/db');

var MonitorLogSchema = mongoose.Schema({
    //"_id": String, //主键，自动生�?
    "pid": String, //项目的ID
    "aid": String, //API的ID
    "name": String, //API名称
    "interval": Number, //设置的测试的时间间隔
    "alertrules": Number, //提醒规则 0表示只在监控结果状�?�改变后提醒 1设置提醒间隔时间
    "alerttime": Number, //提醒间隔时间 只在alertrules�?1时不�?""
    "email": String, //报警邮箱
    "url": String, //监控的url
    "headers": Array, //headers里面的测试参�? Json格式
    "params": Array, //测试参数 Json格式
    "expectresult": String, //期待结果
    "testtime": Date, //测试时间
    "result": String, //监控得到的结�?
    "monitorstatus": Number, //测试是否成功 0表示失败 1表示成功
    "statuscode": Number, //状�?�码
    "restime": Number, //响应时间 ms为单�?
    "status": Number //该日志是否处�? 0表示未处�? 1表示已处�? 只有失败日志有该字段，成功的日志该字段为""

});

var monitorlog = mongoose.model('monitorlog',MonitorLogSchema,'monitorlog');

module.exports = monitorlog;
