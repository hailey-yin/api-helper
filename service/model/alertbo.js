/**
 * Created by yuqing on 2016/3/7.
 */

var mongoose = require('../../db/db');

var alertSchema = mongoose.Schema({
    sender: String, // ����������
    psword: String, // ��������������
    host: String, // ����������host
    port: Number, // ����������port
    to: String, // �ռ���
    cc: String // ������
});

var alert = mongoose.model('alert', alertSchema, 'alert');

module.exports = alert;