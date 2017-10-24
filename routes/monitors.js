/**
 * Created by CK on 2015/7/6.
 */
var express = require('express');
var router = express.Router();
var RestMsg = require('../common/restmsg');
var MonitorBO = require('../service/model/monitorbo');
var MonitorLogBO = require('../service/model/monitorlogbo');

var ProjectService = require('../service/projectservice');
var MonitorService = require('../service/monitorservice');
var MonitorLogService = require('../service/monitorlogService');
var RequestService = require('../service/requestservice');
var Agent = require('../service/agentservice');
var moment = require('moment');
var constant = require('../common/constant');
var _privateFun = router.prototype;
//日志列表item转成js对象
_privateFun.prsBO2VO2Log = function(obj){
    var result = obj.toObject({ transform: function(doc, ret, options){
        return {
            id:ret._id,
            aid: ret.aid,
            name: ret.name,
            url: ret.url,
            urlsuffix: ret.urlsuffix,
            date:ret.testtime,
            method:ret.method,
            statuscode:ret.statuscode,
            statusDesc: ret.monitorstatus,
            responsetime: ret.restime,
            monitorinterval: ret.interval,
            responsedata: ret.result,
            expectdata: ret.expectresult,
            handlecode: ret.status
        }
    } });
    return result;
}
var ISNOT_MONITORED = 0; // 未被监控状态
var IS_MONITORED = 1; // 被监控状态
var WAIT_FOR_MONITOR = 2; //等待配置

//定义测试状态和状态描述变量
global.testDesc = {};//保存最后一次测试状态描述，例如：”状态码：200“
global.testStatus = {};//保存最后一次测试结果，例如”成功“
global.testDate = {};//保存最后一次测试时间

/**
 * @describe 运行API测试代码，更新监控状态字段
 * @author GLJ
 * @date 2015-07-09
 */
_privateFun.updateAPIStatus = function(monitor, callback){
    //只测试处于"正在监控"状态的API
    if(monitor.ability == 0) {
        //判断测试数据
        /*try{
         if(monitor.params == undefined){
         callback('请确认是否已配置测试数据！', null);
         return;
         }
         var testUrl = monitor.url;
         if(testUrl == undefined){
         callback('请确认测试数据url是否遗失！', null);
         return;
         }
         var testData = monitor.params != undefined ? testDataCompose(monitor.params) : {};
         }catch(e){
         callback(e, null);
         return;
         }*/
        // 调用测试API更新实时状态
        Agent.testAPI(monitor.url, monitor.method.toUpperCase(), testDataCompose(monitor.params), function (err, response) {
            monitor.testTime = moment().format("YYYY-MM-DD HH:mm:ss") ;
            if (err) {
                monitor.statusCode = -1;
                monitor.testStatus = "失败";
                monitor.statusDesc = "状态码：" + monitor.statusCode;
                callback(null, monitor);
                return;
            }
            monitor.statusCode = Number(response.status);
            monitor.testStatus = constant.HTTP_STATUS_CODE[monitor.statusCode];
            monitor.statusDesc = "状态码：" + monitor.statusCode;
            callback(null,monitor);
            //TODO 存内存
        });
    }else{
        //TODO 从内存中获取最后一次监控信息
    }
};

function testDataCompose (param) {
    var testdata = {};
    for (var i = 0; i<param.length; i++) {
        testdata[param[i].key] = param[i].value;
    }
    return testdata;
}

router.route('/apis/status')
    //开始/暂停监控
    .put(function(req,res,next){
        var rid = req.body.rid;
        var op = req.body.op;
        MonitorService.updateStatus(rid,op,function(err,ret){
            var restmsg = new RestMsg();
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            //TODO 返回内存中的测试结果
            var bo = {
                "monitorStatus": op,
                "testStatus": 1,
                "statusCode": 1,
                "testTime": 1140213012
            };
            restmsg.successMsg();
            restmsg.setRsult(bo);
            res.send(restmsg);
        })
    })

router.route('/:mid')
    /**
     * @describe 修改/配置监控
     * @author YHL
     * @date 2016-02-15
     */
    .post(function(req,res,next){
        var mid = req.params.mid;
        var monitor = _privateFun.getresData(req, res);
        MonitorService.updateMonitorConfig(mid,monitor,function(err,ret){
            var restmsg = new RestMsg();
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            res.send(restmsg);
        })
    })
    /**
     * @describe 查看监控配置
     * @author YHL
     * @date 2016-02-15
     */
    .get(function(req,res,next){
        var mid = req.params.mid;
        MonitorService.findById(mid,function(err,bo){
            var restmsg = new RestMsg();
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult(bo);
            res.send(restmsg);
        })
    })

router.route('/projects/:pid')
    /**
     * @describe 查询被监控API监控状态列表
     * @author GLJ
     * @date 2015-07-08
     */
    .get(function(req, res, next) {
        var restmsg = new RestMsg();
        //从界面获取查询参数
        var start = req.param('start');
        var row = req.param('row');
        var pid = req.param('pid');
        var apiName = req.param('apiName');//API名称，主要用于搜索查询
        var monitorStatus = req.param('monitorStatus');//monitorStatus为1表示成功，0表示失败
        var time = Number(req.param('time'));//测试时间过滤,0全部，1今天，2昨天，3最近7天
        var startTime = req.param('startTime');//最早开始测试时间，用于自定义过滤时间段
        var endTime = req.param('endTime');//最晚开始测试时间，用于自定义过滤时间段

        var query = {};
        query.pid = pid;
        query.removed = false;
        if(apiName) {
            query.name = new RegExp(apiName,'i');
        }

        //选择时间范围设置
        if(time && time !=0) {
            if(time == 1) {
                startTime = moment().startOf('day').toDate();
                endTime = moment().endOf('day').toDate()
            }else if(time == 2) {
                startTime = moment().subtract(1, 'days').startOf('day').toDate();
                endTime = moment().subtract(1, 'days').endOf('day').toDate();
            }else if(time == 3) {
                startTime = moment().subtract(7, 'days').startOf('day').toDate()
                endTime = moment().toDate();
            }
            query.createDate = {"$gte": startTime,"$lte": endTime}
        }

        //自定义时间范围设置
        if(startTime && endTime) {
            query.createDate = {"$gte": new Date(startTime),"$lte": new Date(endTime)};
        }else if(!startTime && endTime) {
            query.createDate = {"$lte": new Date(endTime)};
        }else if(startTime && !endTime) {
            query.createDate = {"$gte": new Date(startTime)};
        }

        // 根据项目pid等条件，获取项目中可监控API监控情况
        MonitorService.getMonitorPage(query,start,row, function(err, page){
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            var monitors = page.data;
            // 若存在符合条件的监控API，则测试其状态并返回
            if(monitors && monitors.length > 0) {
                var monitorApi = [];

                //设置日期，测试结果等从内存获取的数据
                var setPro = function (i) {
                    var monitor = {};
                    monitor._id = monitors[i]._id;//监控id
                    monitor.pid = monitors[i].pid;//项目id
                    monitor.aid = monitors[i].aid;//API id
                    monitor.name = monitors[i].name?monitors[i].name:"";//API名称
                    monitor.url = monitors[i].url?monitors[i].url:"";//API路径
                    monitor.urlsuffix = monitors[i].urlsuffix?monitors[i].urlsuffix:"";
                    monitor.method = monitors[i].method?monitors[i].method:""//数据获取方法
                    monitor.ability = monitors[i].ability;//监控状态，0正在监控，1暂停中，2等待配置

                    //TODO 从内存获取监控结果
                    monitor.date = moment().format("YYYY-MM-DD HH:mm:ss");//
                    monitor.statusCode = 500;
                    monitor.statusDesc = "状态码为： " + monitor.statusCode;
                    monitor.testStatus = 2;

                    if(monitorStatus && monitorStatus != 0) {
                        if(monitor.testStatus == monitorStatus){
                            monitorApi.push(monitor);
                        }
                    }else {
                        monitorApi.push(monitor);
                    }
                    if(i == monitors.length - 1){
                        page.setPageAttr(monitorApi.length);
                        page.setData(monitorApi);

                        //return;
                    } else {
                        setPro(++i);
                    }
                }
                setPro(0);
            }
            restmsg.successMsg();
            restmsg.setRsult(page);
            res.send(restmsg);
        });
    })
    /**
     * @describe 新增/编辑监控API测试数据、ability设为1：可监控
     * @author GLJ
     * @date 2015-07-08
     */
    .put(function (req, res, next){
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        var rid = req.params.rid;
        var monitorDataStr = req.param('monitordata');
        // 判空
        if(!monitorDataStr){
            restmsg.errorMsg('请填写需要配置的实时监控测试数据！');
            res.send(restmsg);
            return;
        }
        // 测试数据处理
        var monitorData = {};
        try{
            monitorData = JSON.parse(monitorDataStr);
        } catch (e){
            restmsg.errorMsg(e.message);
            res.send(restmsg);
            return;
        }
        // 更新API测试数据
        MonitorService.updateRequestMonitorInfo(pid, rid, monitorData, function(err) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            res.send(restmsg);
        });
    });

    /**
     *  获取日志列表
     */
router.route('/logs/projects/:pid')
    .get(function(req, res, next) {
        var restmsg = new RestMsg();

        //从界面获取查询参数
        var pid = req.params.pid;
        var row = req.param('row');
        var start = req.param('start');
        var apiName = req.param('name');//API名称，主要用于搜索查询
        var monitorStatus = req.param('monitorStatus');//monitorStatus为1表示成功，0表示失败
        var time = Number(req.param('time'));//测试时间过滤,0全部，1今天，2昨天，3最近7天
        var startTime = req.param('startTime');//最早开始测试时间，用于自定义过滤时间段
        var endTime = req.param('endTime');//最晚开始测试时间，用于自定义过滤时间段
        var handleStatus = req.param('handleStatus'); // 过滤处理状态

        var query = {};
        query.pid = pid;
        if(apiName) {
            query.name = new RegExp(apiName,'i');//不区分大小写模糊查询条件
        }
        if(monitorStatus && monitorStatus != -1) {
            query.monitorstatus = monitorStatus;
        }
        if(row) {
            query.row = row;
        }
        if(start) {
            query.start =start;
        }
        if(handleStatus != -1 && handleStatus != undefined) {
            query.status = handleStatus;
        }

        //选择时间范围设置
        if(time) {
            if(time == 1) {
                startTime = moment().startOf('day').toDate();
                endTime = moment().endOf('day').toDate();
            }else if(time == 2) {
                startTime = moment().subtract(1, 'days').startOf('day').toDate();
                endTime = moment().subtract(1, 'days').endOf('day').toDate();
            }else if(time == 3) {
                startTime = moment().subtract(7, 'days').startOf('day').toDate();
                endTime = moment().toDate();
            }
            query.testtime = {"$gte": startTime,"$lte": endTime};
        }
        if(startTime && endTime) {
            query.testtime = {"$gte": startTime,"$lte": endTime};
        }
        //获取日志列表
        MonitorLogService.findList(query, function(err, logs) {
            if (err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(logs.data.length >= 1) {
                logs.data = logs.data.map(_privateFun.prsBO2VO2Log);
            }
            restmsg.successMsg();
            restmsg.setRsult(logs);
            res.send(restmsg);
        });
    })
    /**
     *  保存日志
     */
    .post(function(req, res, next) {
        var restmsg = new RestMsg();
        var log = new MonitorLogBO();
        var result = req.body;
        for(var data in result){
            log[data] = result[data];
        }
        log.pid = req.params.pid;
        log.testtime = new Date();

        MonitorLogService.save(log, function(err, ret) {
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            restmsg.setRsult({logid: ret._id});
            res.send(restmsg);
        });
    });

router.route('/logs/:logid')
    /**
     * 查询单条日志详情
     */
    .get(function (req, res, next) {
        var restmsg = new RestMsg();
        var query = {'_id': req.params.logid};
        MonitorLogService.findByLogID(query, function(err, log) {
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            if(log) {
                restmsg.successMsg();
                restmsg.setRsult(_privateFun.prsBO2VO2Log(log));
                res.send(restmsg);
            }else {
                restmsg.errorMsg("找不到该日志");
                res.send(restmsg);
            }
        });
    })
    /**
     *  处理单条日志
     */
    .post(function(req, res, next) {
        var restmsg = new RestMsg();

        var query = {};
        query._id = req.param('logid');
        MonitorLogService.handleLog(query ,function(err, ret) {
            if(err) {
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            restmsg.successMsg();
            //restmsg.setRsult(ret);
            restmsg.setRsult(null);
            res.send(restmsg);
        });

    });

router.route('/projects/:pid/nomonitor')
    /**
     * 获取项目中未被监控的API
     */
    .get(function(req, res, next){
        var restmsg = new RestMsg();
        var rests = [];
        var pid = req.params.pid;
        var word = req.param("word")
        //查询条件：该项目下未被监控的API
        var query = {
            pid:pid,
            monitorStatus:ISNOT_MONITORED
        };
        RequestService.findApi(query, function(err, apis){
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            for(var i = 0; i <= apis.length-1; i++){
                var rest = {};
                rest.id = apis[i]._id;
                rest.name = apis[i].name;
                rest.group = apis[i].gid;//先设置gid，然后根据gid找到分组name
                rest.url = apis[i].url;
                rest.urlsuffix = apis[i].urlsuffix;
                rest.method = apis[i].method;
                rests.push(rest);
            }
            var query_pro = {
                _id:pid
            }
            ProjectService.findOne(query_pro, function(err, pro){
                if(err){
                    //do nothing
                    return;
                }
                var groups = [];
                if(pro){
                    groups = pro.groups;
                    for(var i = 0; i <= rests.length-1; i++){
                        for(var j = 0; j <= groups.length-1; j++){
                            if(rests[i].group == groups[j].id){
                                rests[i].group = groups[j].name;
                            }
                        }
                    }
                }
                var result = []
                if(word == ""){
                    result = rests;
                }else{
                    for(var i = 0; i <= rests.length-1; i++){
                        if(rests[i].name.indexOf(word) >= 0){
                            result.push(rests[i])
                        }
                    }
                }
                restmsg.successMsg();
                restmsg.setRsult(result);
                res.send(restmsg);
            })

        })
    })

router.route('/projects/:pid/rest')
    /**
     * 批量添加API到监控列表
     */
    .post(function(req, res, next){
        var restmsg = new RestMsg();
        var pid = req.params.pid;
        var idlist = req.param('rid');
        var monitorlist = [];
        var query = {
            '_id':{$in:idlist}
        }
        //批量找出各个api详细信息
        RequestService.findApi(query, function(err, apis){
            if(err){
                restmsg.errorMsg(err);
                res.send(restmsg);
                return;
            }
            //筛选部分信息，添加监控字段，生成monitor对象
            for(var data in apis){
                var monitorbo = new MonitorBO();
                monitorbo.pid = apis[data].pid;
                monitorbo.aid = apis[data]._id;
                monitorbo.name = apis[data].name;
                monitorbo.url = apis[data].url;
                monitorbo.urlsuffix = apis[data].urlsuffix;
                monitorbo.method = apis[data].method;
                monitorbo.interval = null;
                monitorbo.alertrules = null;
                monitorbo.alerttime = null;
                monitorbo.email = null;
                monitorbo.ability = WAIT_FOR_MONITOR;
                monitorbo.headers = apis[data].headers;
                monitorbo.params = null;
                monitorbo.expectresult = null;
                monitorbo.removed = false;
                monitorlist.push(monitorbo);
            }
            //保存monitor对象
            MonitorService.savelist(monitorlist, function(err, bo){
                if(err){
                    restmsg.errorMsg(err);
                    res.send(restmsg);
                    return;
                }
                var query = {
                    '_id':{$in:idlist}
                }
                //更新request表中监控字段
                RequestService.updateStatusList(query,IS_MONITORED,function(err, bo){
                    if(err){
                        restmsg.errorMsg(err);
                        res.send(restmsg);
                        return;
                    }
                    restmsg.successMsg();
                    restmsg.setRsult(null);
                    res.send(restmsg);
                })
            })
        })
    })

router.route('/:aid')
    /**
     * 删除监控的API，逻辑删除，'removed'设置为true
     */
    .delete(function (req, res, next){
        var aid = req.params.aid;
        var op = ISNOT_MONITORED;
        var restmsg = new RestMsg();

        RequestService.updateStatus(aid,op,function(err,ret) {
            if(err) {
                restmsg.errorMsg("API表监控状态未修改！");
                res.send(restmsg);
                return;
            }
            MonitorService.remove(aid, function(err, bo) {
                if (err) {
                    restmsg.errorMsg(err);
                    res.send(restmsg);
                    return;
                }
                if(bo) {
                    restmsg.successMsg();
                    restmsg.setRsult("");
                    res.send(restmsg);
                }
            })
        })
    })

//从前台数据组装bo
_privateFun.getresData = function(req,res){
    var restmsg = new RestMsg();
    var ability = req.body.ability;
    var monitorUrl = req.body.monitorUrl; // 监控url
    if(!monitorUrl){
        restmsg.errorMsg('测试路径 必填');
        res.send(restmsg);
        return;
    }
    var monitorApiParams = req.body.monitorApiParams; // API参数
    var monitorHeaders = req.body.monitorHeaders; // 首部参数
    var email = req.body.email; // 告警邮箱
    if(!email){
        restmsg.errorMsg('告警邮箱 必填');
        res.send(restmsg);
        return;
    }
    var alarmtype = req.body.alarmtype;// 0只在监控结果的状态改变后提醒|1设置提醒间隔最小时间
    if(!alarmtype){
        restmsg.errorMsg('提醒规则 必填');
        res.send(restmsg);
        return;
    }
    if(alarmtype == 1) {
        var alarminterval = req.body.alarminterval; // 提醒间隔时间，只在alarmtype=1时生效，单位分钟
        if(!alarminterval){
            restmsg.errorMsg('提醒间隔时间 必填');
            res.send(restmsg);
            return;
        }
    }else {
        var alarminterval = '';
    }
    var monitorinterval = req.body.monitorinterval; // 监控频率 单位分钟
    if(!monitorinterval){
        restmsg.errorMsg('监控频率 必填');
        res.send(restmsg);
        return;
    }
    var expectdata = req.body.expectdata; // 期待的结果

    return {
        "url": monitorUrl, // 监控url
        "params": monitorApiParams, // API参数
        "headers": monitorHeaders, // 首部参数
        "email": email, // 告警邮箱
        "alertrules": alarmtype, // 0只在监控结果的状态改变后提醒|1设置提醒间隔最小时间
        "alerttime": alarminterval, // 提醒间隔时间，只在alarmtype=1时生效，单位分钟
        "interval": monitorinterval, // 监控频率 单位分钟
        "expectresult": expectdata, // 期待的结果
        "ability": Number(ability)
    };
}

module.exports = router;