/* global describe, it */
var exec = require('child_process').exec;
var expect = require('unexpected');

var pathToBin = require('path').resolve(__dirname, '../../bin/', 'oconf-lint');

describe('bin/oconf-lint', function () {
    it('should exit with no errors if valid', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'lint', 'valid.cjson');
        exec(pathToBin + ' ' + testFile, function (err, stdout, stderr) {
            expect(err, 'to be null');
            expect(stdout, 'to equal', '');
            expect(stderr, 'to equal', 'No linting errors found.\n');
            done();
        });
    });
    it('should report the errors if invalid', function (done) {
        var testFile = require('path').resolve(__dirname, '..', 'files', 'lint', 'invalid.cjson');
        exec(pathToBin + ' ' + testFile, function (err, stdout, stderr) {
            expect(err, 'to be an', Error);
            expect(err, 'to have property', 'code', 1);
            expect(stdout, 'to equal', '');
            expect(stderr, 'to equal', [
                testFile,
                '',
                'Parse error on line 2:',
                '{    "foo": "bar}',
                '------------^',
                "Expecting 'STRING', 'NUMBER', 'NULL', 'TRUE', 'FALSE', '{', '[', got 'undefined'",
                ''
            ].join('\n'));
            done();
        });
    });
});
