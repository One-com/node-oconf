/*
 * Load cJSON files recursively.
 */

var path = require('path'),
    sys = require('sys'),
    cjson = require('cjson');

function i(data) {
    return sys.inspect(data, 99, false);
}

/*
 * Recursively go through the given data-structure and sort out any
 * `#include`-statements.
 */
function includeRecursively(base, currentFile, loadedFiles) {
    //console.warn("→ includeRecursively(" + i(base) + ", " + currentFile + ", " + loadedFiles + ")");

    // If there's any data to mix in, we do that.
    if (base['#include'] !== undefined) {
        // Figure out the target filename.
        var dirname = path.dirname(currentFile),
            newFilename = path.resolve(dirname, base['#include']);
        base = cjson.extend(
            true,
            loadFile(newFilename, loadedFiles),
            base
        );
        delete base['#include'];
    }

    // Don't iterate over strings
    if (typeof base === 'string') {
        return base;
    }

    for(key in base) {
        if (typeof base !== 'string') {
            base[key] = includeRecursively(base[key], currentFile, loadedFiles);
        }
    }

    return base;
}

/*
 * Load `filename` and then have `includeRecursively` go through the file and
 * resolve any nested include-statements.
 *
 * Also checks of the given file has been loaded previously (to include-loops).
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
