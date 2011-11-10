/*
 * Load cJSON files recursively.
 */

var cjson = require('cjson');

function load(filename) {
    var base = cjson.load(filename);

    if ('#include' in base) {
        base = cjson.extend(true, base, load(base['#include']));
        delete base['#include'];
    }

    return base;
}

module.exports = load;
