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
    var publicOnly = options.public ? true : false;
    var isIgnored = (typeof options.ignore !== 'undefined' ? _.flatten([options.ignore]) : []).map(function (ignoreString) {
        return function (string) {
            return minimatch(string, Path.resolve(cwd, ignoreString));
        };
    }).reduce(function (previousValue, currentValue) {
        return function (string) { return currentValue(string) || previousValue(string); };
    }, function () { return false; });

    var loadedAbsoluteFileNames = []; // Do some housekeeping to avoid cycles

    function resolvePublic(obj) {
        if (Array.isArray(obj)) {
            // An array that should be resolved into an array
            return obj.map(resolvePublic);
        } else if (typeof obj === 'object' && obj !== null) {
            var publicObj = {};
            if (typeof obj['#public'] !== 'undefined') {
                if (!(typeof obj['#public'] === 'object' && obj['#public'] !== null)) {
                    throw new Error('#public must always be an object');
                }

                Object.keys(obj['#public']).forEach(function (key) {
                    if (key in obj) {
                        throw new Error('Overwriting property with public property not allowed');
                    }

                    if (obj['#public'][key] !== 'undefined') {
                        publicObj[key] = obj['#public'][key];
                    }
                });

                delete obj['#public'];
            }

            Object.keys(obj).forEach(function (key) {
                obj[key] = resolvePublic(obj[key]);

                if (typeof obj[key] !== 'undefined') {
                    publicObj[key] = obj[key];
                }
            });

            if (Object.keys(publicObj).length === 0) {
                publicObj = undefined;
            }

            if (publicOnly) {
                return publicObj;
            } else {
                return cjson.extend(true, obj, publicObj);
            }
        }

        return obj;
    }

    return resolvePublic(function readFileAndResolve(fileName) {
        var absoluteFileName = Path.resolve(cwd, fileName);

        if (loadedAbsoluteFileNames.indexOf(absoluteFileName) !== -1) {
            throw new Error("Loop in loaded files: \n\t→ " + loadedAbsoluteFileNames.join("\n\t→ "));
        }

        loadedAbsoluteFileNames.push(absoluteFileName);

        // Have to always keep public keys separate, also in result from resolveIncludes
        // If a private key is overwritten by a public key, it's an error, and vice-versa. Name your config keys something else!

        return (function resolveIncludes (obj) {
            if (Array.isArray(obj)) {
                // An array that should be resolved into an array
                return obj.map(resolveIncludes);
            } else if (typeof obj === 'object' && obj !== null) {
                if (typeof obj['#include'] !== 'undefined') {
                    _.flatten([obj['#include']]).reverse().forEach(function (fileNameToInclude) {
                        // Have to resolve from location of current file, not from cwd
                        var absoluteFileNameToInclude = Path.resolve(Path.dirname(fileName), fileNameToInclude);
                        if (!isIgnored(absoluteFileNameToInclude)) {
                            obj = cjson.extend(true, readFileAndResolve(absoluteFileNameToInclude), obj);
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
