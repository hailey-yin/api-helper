/**
 * Created by zl on 2016/2/24.
 */

var mongoose = require('../../db/db');

var monitorSchema = mongoose.Schema({
    //"_id": String,  //这个参数是不需要的，系统会自动生成，作为主键
    "pid": String, //项目id
    "aid": String, //API的id
    "name": String, //API名称
    "url": String, //请求路径
    "urlsuffix":String,//API后缀
    "method":String,//方法
    "interval": Number, //设置的测试的时间间隔
    "alertrules": Number, //提醒规则 0表示只在监控结果状态改变后提醒 1设置提醒间隔时间
    "alerttime": Number, //提醒间隔时间 只在alertrules为1时不为""
    "email": String, //报警邮箱
    "ability": Number, //0表示正处于监控状态中，1表示暂停监控, 2未配置的监控
    "headers": Array, //headers里面的测试参数 Json格式
    "params": Array, //测试参数 Json格式
    "expectresult": String, //期待结果
    "removed":Boolean //逻辑删除字段，false表示未删除，true表示已删除
})

var monitor = mongoose.model('monitor', monitorSchema);

module.exports = monitor;