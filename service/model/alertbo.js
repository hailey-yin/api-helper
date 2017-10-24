/**
 * Created by yuqing on 2016/3/7.
 */

var mongoose = require('../../db/db');

var alertSchema = mongoose.Schema({
    sender: String, // 发件人邮箱
    psword: String, // 发件人邮箱密码
    host: String, // 发件人邮箱host
    port: Number, // 发件人邮箱port
    to: String, // 收件人
    cc: String // 抄送人
});

var alert = mongoose.model('alert', alertSchema, 'alert');

module.exports = alert;