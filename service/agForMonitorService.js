/**
 * Created by yuqing on 2016/3/7.
 */

var superagent =  require('superagent');

function AgForMonitorService() {

}

/**
 *  监控定时任务 API请求代理服务
 * @param url url
 * @param method 方法
 * @param data 参数
 * @param headers 头部
 * @param callback
 */
AgForMonitorService.testMonito = function(url, method, data, headers, callback) {
    if(method == 'DELETE') {
        method = 'del';
    }
    if(method == 'GET' || method == 'del') {
        superagent[method.toLowerCase()](url)
            // todo header值确认
            .set('Content-Type', 'application/json')
            .set(headers)
            .type('form')
            .query(data)
            .timeout(30000)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return console.error(err);
                }
                if (res.type.indexOf('text/') == 0) {
                    res.body = res.text;
                    console.log("Res: ", res.body);
                    callback(null, res);
                } else {
                    console.log("Res: ", JSON.stringify(res.body));
                    callback(null, res);
                }
            });
    }else {
        superagent[method.toLowerCase()](url)
            .set('Content-Type', 'application/json')
            .set(headers)
            .type('form')
            .send(data)
            .timeout(30000)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return console.error(err);
                }
                if (res.type.indexOf('text/') == 0) {
                    res.body = res.text;
                    console.log("Res: ", res.body);
                    callback(null, res);
                } else {
                    console.log("Res: ", JSON.stringify(res.body));
                    callback(null, res);
                }
            });
    }
};

module.exports = AgForMonitorService;