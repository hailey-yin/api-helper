var mongoose = require('../../db/db');

var countersSchema = mongoose.Schema({
    "_id": String,//"<当前ID>",
    "seq": Number//"<当前ID值>"
});

countersSchema.methods.getNextSequence = function(name,callback) {
    Counters.findByIdAndUpdate(name,{ $inc: { seq: 1 }},function(err, obj) {
            if (err) {
                return console.error(err);
            }
            callback(null,obj.seq);
        }
    );
}

countersSchema.statics.IDS = {
    PROJECT_ID:'pid',// 资产主键
    GROUP_ID:'gid',// 分组主键
    REQUESTS_ID:'rid',// API主键
    MONITOR_ID:'mid'
};

var Counters = mongoose.model('counters', countersSchema);

function countersinit(id){
    Counters.find({_id:id},function(err,objs){
        if(objs&&objs.length>0){
        }else{
            var c = new Counters();
            c._id = id;
            c.seq = 1;
            c.save(function (err, ret) {
                if (err){
                    console.error(err);
                }
            });
        }
    })
}

//项目初始化时初始化数据库脚本
var ids = Counters.IDS;
for(key in ids){
    var id = ids[key];
    countersinit(id);
}

module.exports = Counters;
