/*
 * Load cJSON files recursively.
 */

var path = require('path'),
    cjson = require('cjson');

function load(filename) {
    var base = cjson.load(filename),
        fullname = path.normalize(filename),
        dirname = path.dirname(fullname);

    if ('#include' in base) {
        // Extend load the #included file and overwrite duplicates with base.
        base = cjson.extend(
            true, {}, load(path.resolve(dirname, base['#include'])), base
        );
        delete base['#include'];
    }

    return base;
}

module.exports = load;
