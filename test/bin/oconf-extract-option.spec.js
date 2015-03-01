/* global describe, it */
var exec = require('child_process').exec;
var expect = require('unexpected');

var pathToBin = require('path').resolve(__dirname, '../../bin/', 'oconf-extract-option');

describe('bin/oconf-extract-option', function () {
    it('should return the option value', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'base.cjson');
        exec(pathToBin + ' ' + testFile + ' foo', function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', 'overwrite this\n');
            expect(stderr, 'to equal', '');
            done();
        });
    });
    it('should return the option value as json when passed --json', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'base.cjson');
        exec(pathToBin + ' --json ' + testFile + ' foo', function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', '"overwrite this"\n');
            expect(stderr, 'to equal', '');
            done();
        });
    });
    it('should fail when no such option exists', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'base.cjson');
        exec(pathToBin + ' ' + testFile + ' bar', function (err, stdout, stderr) {
            expect(err, 'to be an', Error);
            expect(err, 'to have property', 'code', 1);
            expect(stdout, 'to equal', '');
            expect(stderr, 'to match', /Key bar not found/);
            done();
        });
    });
    it('should not fail when no such option exists when --allowmissing passed', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'base.cjson');
        exec(pathToBin + ' --allowmissing ' + testFile + ' bar', function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', '');
            expect(stderr, 'to match', '');
            done();
        });
    });
    it('should support dotting out properties (foo.bar)', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'deep.cjson');
        exec(pathToBin + ' ' + testFile + ' foo.bar', function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', 'qux\n');
            expect(stderr, 'to match', '');
            done();
        });
    });
});
