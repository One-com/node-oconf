/*
 * Test the loader
 */

var _ = require('underscore'),
    vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    loader = require('../lib/loader');

// Helper - resolve files relative to this dir, not vows's CWD.
function resolve(filename) {
    return path.resolve(__dirname, filename);
}

vows.describe('Loader').addBatch({
    'base.cjson': {
        topic: function () {
            return loader(resolve('./files/base.cjson'));
        },
        'foo = "overwrite this"': function (err, res) {
            assert.deepEqual(res.foo, 'overwrite this');
        },
        'what = "this is from default.cjson."': function (res) {
            assert.deepEqual(res.what, 'this is from default.cjson.');
        },
        'only has "foo" and "what"-keys': function (err, res) {
            assert.deepEqual(_(res).keys(), ['foo', 'what']);
        }
    }
}).addBatch({
    'extend-base.cjson': {
        topic: function () {
            return loader(resolve('./files/extend-base.cjson'));
        },
        'foo = "bar" (== is overwritten)': function (res) {
            assert.deepEqual(res.foo, 'bar');
        },
        'what = "this is from default.cjson."': function (res) {
            assert.deepEqual(res.what, 'this is from default.cjson.');
        },
        'only has "foo" and "what"-keys': function (res) {
            assert.deepEqual(_(res).keys(), ['foo', 'what']);
        }
    }
}).addBatch({
    'extend-in-subobject.cjson': {
        topic: function () {
            return loader(resolve('./files/extend-in-subobject.cjson'));
        },
        'subobject = `contents of extend-base.cjson`': function (res) {
            assert.deepEqual(
                res.subobject,
                {
                    foo: "bar",
                    what: "this is from default.cjson."
                }
            );
        }
    }
}).addBatch({
    'loop{1,2}.cjson (files including eachother)': {
        "throws Error on load": function (res) {
            assert.throws(
                function () {
                    loader(resolve('./files/loop1.cjson'))
                },
                Error
            );
        }
    }
})['export'](module);
