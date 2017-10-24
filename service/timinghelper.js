/**
 * Created by yuqing on 2016/3/7.
 */

var later = require('later');
var superagent = require('superagent');
var AgForMonitorService = require('./agForMonitorService');

later.date.localTime(); //设置本地时区

//用于以key value形式存储定时任务id和相应的引用
global.TimingTaskMap = {}

function timinghelper() {

}

/**
 *  定时任务
 * @param interval
 */
timinghelper.setSched = function setSched(interval, id) {
    var sched = later.parse.recur().every(interval).second();
    task = later.setInterval(function () {

        monitorTask();

        //test(Math.random(10));

    }, sched);
    TimingTaskMap[id] = task;
}

function test(val) {
    console.log(new Date());
    console.log(val);
}

/*setTimeout(function(){
 t.clear();
 console.log("Clear");
 },15*1000);*/

function monitorTask() {
    AgForMonitorService.testMonito("www.baidu.com", "get", null, null, function(err,obj){
        if(err) {
            callback(err);
            return console.error(err);
        }
        if(obj) {
            console.log(obj);
        }
    });

}

module.exports = timinghelper;
