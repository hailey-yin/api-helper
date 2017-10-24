var mongoose = require('../../db/db');
/**
 * API BO对象
 */
var requestSchema = mongoose.Schema({
    "name":String,//API名称
    "description":String,//API描述
    "url":String,//完整url(项目前缀+api后缀)
    "urlsuffix":String,//api的后缀
    "method":String,//方式getpostdeleteput
    "data":[],//[{"key": "<入参key>","value": "<入参值>","type": "<入参类型>"}];
    "monitordata":{},
    "ability":Number,
    "output":String,//输出描述
    "outputsuccess":String,//输出正确事例
    "outputerror":String,//输出错误事例
    "detail":String,//详细描述
    "pid":String,//项目ID
    "gid":Number,//分组ID
    "status":Number,//API测试结果响应码
    "depurl":String,
    "deployStatus":Number, // API虚拟部署状态，0为未部署，1为已部署
    "monitorStatus": Number //该api是否被监控 0表示未被监控 1表示被监控
});
//function Request(request){
//    this.id = request.id;//"<api ID>",
//    this.name = request.name;//"<API名称>",
//    this.description = request.description;//"<API描述>",
//    this.url = request.url;//"<完整url>",
//    this.urlsuffix = request.urlsuffix;//"<api的后缀>",
//    this.method = request.method;//"<方式getpostdeleteput>",
//    this.data = request.data;// [{"key": "<入参key>","value": "<入参值>","type": "<入参类型>"}];
//    this.output = request.output;//"<输出描述>",
//    this.outputsuccess = request.outputsuccess;//"<输出正确事例>",
//    this.outputerror = request.outputerror;//"<输出错误事例>",
//    this.detail = request.detail;//"<详细描述>"
//}

//requestSchema.method.data = function(data){
//    this.key = data.key;//<入参key>
//    this.value = data.value;//<入参值>
//    this.type = data.type;//<入参类型>
//};


//入参类型
requestSchema.statics.TYPE = {
    STRING  :'Stirng',// 字符串
    INTEGER:'Integer'// 整数
};

//入参类型
requestSchema.statics.method = {
    GET:'get',// 资产主键
    POST:'post',// 分组主键
    PUT:'put',// API主键
    DELETE:'delete'// API主键
};

var request= mongoose.model('project.requests', requestSchema);

module.exports = request;
