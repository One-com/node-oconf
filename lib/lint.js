var fs = require('fs');
var cjson = require('cjson');
var passError = require('passerror');
var glob = require('glob');
var async = require('async');
var Path = require('path');

function lintFile(path, cb) {
    fs.readFile(path, 'utf-8', passError(cb, function (data) {
        try {
            cjson.parse(data);
        } catch (e) {
            e.file = path;
            return cb(e);
        }
        cb();
    }));
}


module.exports = function oconfLint(path, callback) {
    fs.stat(path, passError(callback, function (stat) {
        if (stat.isDirectory()) {
            glob('**/*.cjson', { cwd: path }, passError(callback, function (files) {
                var resolvedFiles = files.map(function (partialPath) {
                    return Path.resolve(path, partialPath);
                });
                async.eachSeries(resolvedFiles, lintFile, callback);
            }));
        } else {
            return lintFile(path, callback);
        }
    }));
};
