/*
 * Load cJSON files recursively.
 */

var Path = require('path'),
    minimatch = require('minimatch'),
    _ = require('underscore'),
    cjson = require('cjson');

module.exports.load = function load(rootFileName, options) {
    options = options || {};

    var cwd = options.cwd || process.cwd();
    var isIgnored = (typeof options.ignore !== 'undefined' ? _.flatten([options.ignore]) : []).map(function (ignoreString) {
        return function (string) {
            return minimatch(string, Path.resolve(cwd, ignoreString));
        };
    }).reduce(function (previousValue, currentValue) {
        return function (string) { return currentValue(string) || previousValue(string); };
    }, function () { return false; });

    var loadedAbsoluteFileNames = []; // Do some housekeeping to avoid cycles

    return (function readFileAndResolveIncludes(fileName) {
        var absoluteFileName = Path.resolve(cwd, fileName);

        if (loadedAbsoluteFileNames.indexOf(absoluteFileName) !== -1) {
            throw new Error("Loop in loaded files: \n\t→ " + loadedAbsoluteFileNames.join("\n\t→ "));
        }

        loadedAbsoluteFileNames.push(absoluteFileName);

        return (function resolveIncludes(obj) {
            if (Array.isArray(obj)) {
                return obj.map(resolveIncludes);
            } else if (typeof obj === 'object' && obj !== null) {
                if (typeof obj['#include'] !== 'undefined') {
                    _.flatten([obj['#include']]).reverse().forEach(function (fileNameToInclude) {
                        var absoluteFileNameToInclude = Path.resolve(Path.dirname(fileName), fileNameToInclude);
                        if (!isIgnored(absoluteFileNameToInclude)) {
                            obj = cjson.extend(true, readFileAndResolveIncludes(absoluteFileNameToInclude), obj);
                        }
                    });
                    delete obj['#include'];
                }
                Object.keys(obj).forEach(function (key) {
                    obj[key] = resolveIncludes(obj[key]);
                });
            }
            return obj;
        }(cjson.load(absoluteFileName)));
    }(rootFileName));
};
