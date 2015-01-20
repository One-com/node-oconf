/*global describe, it, before*/
/*
 * Test the loader
 */

var expect = require('expect.js'),
    oconf = require('../lib/index'),
    path = require('path');

// Helper - resolve files relative to this dir, not vows's CWD.
function resolve(filename) {
    return path.resolve(__dirname, filename);
}

// The tests!
describe('Basic tests', function () {

    describe('base.cjson', function () {
        var data;

        before(function () {
            data = oconf.load(resolve('./files/base.cjson'));
        });

        it('Has foo = "overwrite this"', function () {
            expect(data).to.have.property('foo', 'overwrite this');
        });

        it('Has what = "this is from default.cjson."', function () {
            expect(data).to.have.property('what', 'this is from default.cjson.');
        });

        it('Only has "foo" and "what"-keys', function () {
            expect(data).to.only.have.keys(['foo', 'what']);
        });

    });

    describe('extend-base.cjson', function () {
        var data;

        before(function () {
            data = oconf.load(resolve('./files/extend-base.cjson'));
        });

        it('Has foo = "bar" (i.e. overwritten)', function () {
            expect(data).to.have.property('foo', 'bar');
        });

        it('Has what = "this is from default.cjson."', function () {
            expect(data).to.have.property('what', 'this is from default.cjson.');
        });

        it('Only has "foo" and "what"-keys', function () {
            expect(data).to.only.have.keys(['foo', 'what']);
        });

    });

    /*
}).addBatch({
    'extend-in-subobject.cjson': {
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
     */

    describe('extend-in-subobject.cjson', function () {
        var data;

        before(function () {
            data = oconf.load(resolve('./files/extend-in-subobject.cjson'));
        });

        it('Has subobject = contents of extend-base.cjson', function () {
            expect(data)
                .to.have.property('subobject')
                .eql({ foo: 'bar', what: 'this is from default.cjson.' });
        });
    });

    describe('loop1.cjson / loop2.cjson', function () {

        it('Loading loop1.cjson throws error', function () {
            expect(function () { loader(resolve('./files/loop1.cjson')); })
                .to.throwError();
        });

        it('Loading loop2.cjson throws error', function () {
            expect(function () { loader(resolve('./files/loop2.cjson')); })
                .to.throwError();
        });
    });

    describe('includeNonExistentFile.cjson', function () {
        it('should throw an error when nonExistentFile.cjson is not ignored', function () {
            expect(function () {
                oconf.load(resolve('./files/includeNonExistentFile.cjson'));
            }).to.throwError();
        });

        it('should not throw an error when nonExistentFile.cjson is ignored', function () {
            expect(function () {
                oconf.load(resolve('./files/includeNonExistentFile.cjson'), {ignore: resolve('./files/nonExistentFile.cjson')});
            }).not.to.throwError();
        });
    });
});
