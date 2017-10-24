var crypto = require('crypto');
function StrUtils(){

}

StrUtils.sha1Hash = function (str, addSalt) {
    var salt = (addSalt) ?  '': new Date().getTime();
    return crypto.createHmac('md5', salt + '').update(str + '').digest('hex');
};

module.exports = StrUtils;

