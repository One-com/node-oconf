/*
 * Load cJSON files recursively.
 */

var path = require('path'),
    util = require('util'),
    cjson = require('cjson');

function i(data) {
    return util.inspect(data, 99, false);
}

/*
 * Recursively go through the given data-structure and sort out any
 * `#include`-statements.
 */
function includeRecursively(obj, currentFile, loadedFiles) {
    //console.warn("→ includeRecursively(" + i(obj) + ", " + currentFile + ", " + loadedFiles + ")");

    if (Array.isArray(obj)) {
        return obj.map(function (element) {
            return includeRecursively(element, currentFile, loadedFiles);
        });
    } else if (typeof obj === 'object' && obj !== null) {
        // If there's any data to mix in, we do that.
        if (obj['#include'] !== undefined) {
            (Array.isArray(obj['#include']) ? obj['#include'].reverse() : [obj['#include']]).forEach(function (include) {
                // Figure out the target filename.
                var dirname = path.dirname(currentFile),
                    newFilename = path.resolve(dirname, include);
                obj = cjson.extend(
                    true,
                    loadFile(newFilename, loadedFiles),
                    obj
                );
            });
            delete obj['#include'];
        }
        Object.keys(obj).forEach(function (key) {
            obj[key] = includeRecursively(obj[key], currentFile, loadedFiles);
        });
    }
    return obj;
}

/*
 * Load `filename` and then have `includeRecursively` go through the file and
 * resolve any nested include-statements.
 *
 * Also checks if the given file has been loaded previously (to identify include-loops).
 */
function loadFile(filename, loadedFiles) {
    //console.warn("→ loadFile(" + filename + ", " + loadedFiles + ")");

    var fullname = path.normalize(filename),
        base = cjson.load(fullname);

    // Have we loaded this file before?
    if (loadedFiles.indexOf(fullname) !== -1) {
        throw new Error("Loop in loaded files: \n\t→ " + loadedFiles.join("\n\t→ "));
    }

    // We've also loaded this file
    var newLoadedFiles = [].concat(loadedFiles, [fullname]);

    base = includeRecursively(base, fullname, newLoadedFiles);

    return base;
}

function load(filename) {
    return loadFile(path.resolve(filename), []);
}

module.exports.load = load;
