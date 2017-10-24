/**
 * 数据库连接
 * @type {exports}
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/budrest');//简写
//mongoose.connect('mongodb://user:pass@localhost:port/database')
//mongoose.connect('mongodb://trinity:trinity@192.168.1.123:27017/trinity');
//mongoose.connect('mongodba:admin123@10.1.67.129:27017/budrest?auto_reconnect=true');

module.exports = mongoose;
