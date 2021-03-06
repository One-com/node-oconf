/*
 * Load cJSON files recursively.
 */

var Path = require('path'),
    fs = require('fs'),
    minimatch = require('minimatch'),
    _ = require('underscore'),
    rjson = require('relaxed-json'),
    cjson = require('cjson');

module.exports.load = function load(rootFileName, options) {
    options = options || {};

    var relaxed = options.relaxed || false;

    var cwd = options.cwd || process.cwd();
    var isIgnored = (typeof options.ignore !== 'undefined' ? _.flatten([options.ignore]) : []).map(function (ignoreString) {
        return function (string) {
            return minimatch(string, Path.resolve(cwd, ignoreString));
        };
    }).reduce(function (previousValue, currentValue) {
        return function (string) { return currentValue(string) || previousValue(string); };
    }, function () { return false; });

    var stack = []; // Do some housekeeping to avoid cycles

    if (Array.isArray(rootFileName)) {
        var config = {};
        rootFileName.forEach(function (configFileName) {
            config = cjson.extend(true, config, load(configFileName, options));
        });

        return config;
    }

    // Have to always keep public keys separate within resolvePublic
    // If a private key is overwritten by a public key, it's an error, and vice-versa. Name your config keys something else!
    // Empty object leaves and non-public keys are filtered out when requesting with public:true

    function resolvePublic(obj, isToplevel, publicOnly) {
        if (typeof obj === 'object' && obj !== null) {
            var publicObj = Array.isArray(obj) ? [] : {};

            var hashPublicSuffixedKeys = [];
            Object.keys(obj).forEach(function (key) {
                if (/.+#public$/.test(key)) {
                    hashPublicSuffixedKeys.push(key);
                } else if (key !== '#public') {
                    // Have to extract public and non-public keys separately, otherwise we lose information
                    var resolvedPublic = resolvePublic(obj[key], false, true);
                    if (typeof resolvedPublic === 'object' && resolvedPublic !== null && Object.keys(resolvedPublic).length > 0) {
                        publicObj[key] = resolvedPublic;
                    }

                    obj[key] = resolvePublic(obj[key], false, false);
                }
            });
            if (hashPublicSuffixedKeys.length > 0) {
                obj['#public'] = obj['#public'] || {};
                hashPublicSuffixedKeys.forEach(function (hashPublicSuffixedKey) {
                    var keyWithoutSuffix = hashPublicSuffixedKey.replace(/#public$/, '');
                    if (keyWithoutSuffix in obj['#public']) {
                        throw new Error(hashPublicSuffixedKey + ' clashes with ' + keyWithoutSuffix + ' inside #public block');
                    }
                    obj['#public'][keyWithoutSuffix] = obj[hashPublicSuffixedKey];
                    delete obj[hashPublicSuffixedKey];
                });
            }

            if (typeof obj['#public'] !== 'undefined') {
                if (!(typeof obj['#public'] === 'object' && obj['#public'] !== null && !Array.isArray(obj['#public']))) {
                    throw new Error('#public must always be an object');
                }

                Object.keys(obj['#public']).forEach(function (key) {
                    if (key in obj) {
                        throw new Error('Unsupported combination of public and non-public properties for key "' + key + '", check your tree structure: ' + JSON.stringify(obj));
                    }

                    if (obj['#public'][key] !== 'undefined') {
                        publicObj[key] = obj['#public'][key];
                    }
                });

                delete obj['#public'];
            }

            if (isToplevel && typeof publicObj === 'object' && publicObj !== null && Object.keys(publicObj).length > 0) {
                obj['#public'] = publicObj;
            }

            if (publicOnly) {
                return publicObj;
            } else {
                return cjson.extend(true, obj, publicObj);
            }
        }

        return obj;
    }

    return resolvePublic((function readFileAndResolveIncludes(fileName) {
        var absoluteFileName = Path.resolve(cwd, fileName);

        if (stack.indexOf(absoluteFileName) !== -1) {
            throw new Error('Loop in loaded files: \n\t→ ' + stack.join('\n\t→ '));
        }

        stack.push(absoluteFileName);

        var loadedData = null;
        if (relaxed) {
            loadedData = rjson.parse(fs.readFileSync(absoluteFileName, 'utf8'));
        } else {
            loadedData = cjson.load(absoluteFileName);
        }

        return (function resolveIncludes(obj) {
            if (Array.isArray(obj)) {
                // An array that should be resolved into an array
                return obj.map(resolveIncludes);
            } else if (typeof obj === 'object' && obj !== null) {
                if (typeof obj['#include'] !== 'undefined') {
                    _.flatten([obj['#include']]).reverse().forEach(function (fileNameToInclude) {
                        // Have to resolve from location of current file, not from cwd
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
            stack.pop();
            return obj;

        }(loadedData));
    }(rootFileName)), true, options.public);
};
