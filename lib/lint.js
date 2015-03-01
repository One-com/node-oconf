var fs = require('fs');
var cjson = require('cjson');

module.exports = function oconfLint(path, callback) {
    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) {
            return callback(err);
        }

        try {
            cjson.parse(data);
        } catch (e) {
            return callback(e);
        }
        callback();
    });
};
