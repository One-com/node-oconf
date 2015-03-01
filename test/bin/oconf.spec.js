/* global describe, it */
var exec = require('child_process').exec;
var expect = require('unexpected');

var pathToBin = require('path').resolve(__dirname, '../../bin/', 'oconf');

describe('bin/oconf', function () {
    it('should print the resolved json structure to stdout', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'base.cjson');
        exec(pathToBin + ' ' + testFile, function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', [
                '{',
                '    "foo": "overwrite this",',
                '    "what": "this is from default.cjson."',
                '}',
                ''
            ].join('\n'));
            expect(stderr, 'to equal', '');
            done();
        });
    });
    it('should fail when asked for nonexistant file', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'nonExistent.cjson');
        exec(pathToBin + ' ' + testFile, function (err, stdout) {
            expect(err, 'to be an', Error);
            expect(err, 'to satisfy', {
                message: /Error: ENOENT, no such file or directory/
            });
            done();
        });
    });
    it('should fail when resolved file includes non existing file', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'includeNonExistentFile.cjson');
        exec(pathToBin + ' ' + testFile, function (err, stdout) {
            expect(err, 'to be an', Error);
            expect(err, 'to have property', 'message');
            expect(err.message, 'to match', /Error: ENOENT, no such file or directory/);
            expect(err.message, 'not to match', /includeNonExistentFile.cjson/);
            done();
        });
    });
    it('should not fail when resolved file includes non existing file when passed --ignore', function (done) {
        var ignoreFile = require('path').resolve(__dirname, '..', 'files', 'nonExistentFile.cjson');
        var testFile = require('path').resolve(__dirname, '..', 'files', 'includeNonExistentFile.cjson');
        exec(pathToBin + ' --ignore ' + ignoreFile + ' ' + testFile, function (err, stdout) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', '{\n    "foo": 123\n}\n');
            done();
        });
    });
});
