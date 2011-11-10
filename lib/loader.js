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
        base = cjson.extend(true, base, load(path.resolve(dirname, base['#include'])));
        delete base['#include'];
    }

    return base;
}

module.exports = load;
