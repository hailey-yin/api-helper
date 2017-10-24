/**
 * 项目API测试服务
 * @type {project|exports}
 */
//var url = 'http://192.168.1.43:3010/api/menus';
//var method = 'GET';
//var data = {};
//var postData =
//{"pid":"0","name":"18","desc":"sasa","type":"0","path":"0","createSql":"","theads":{},"queryTerms":{},"querySql":"","sid":"","status":0,"timestamp":{"type":"1","dateType":"","monthType":"","day":"","hour":""}}
var superagent =  require('superagent')

function AgentService() {

}

AgentService.testAPI = function (url, method, data, callback) {
    if(method == 'DELETE') {
        method = 'del';
    }
    if(method == 'GET' || method == 'del') {
        superagent[method.toLowerCase()](url)
            .set('Content-Type', 'application/json')
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

module.exports = AgentService;


//AgentService.testAPI(url,method,postData, function (status, ret) {
//    console.log("mark"+ret.status);
//});


