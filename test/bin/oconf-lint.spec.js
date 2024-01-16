/* global describe, it */
var exec = require('child_process').exec;
var expect = require('unexpected');

var pathToBin = require('path').resolve(__dirname, '../../bin/', 'oconf-lint');

expect.addAssertion('when oconf-linted', function (expect, subject) {
    this.errorMode = 'nested';
    var that = this;
    return expect.promise(function (resolve, reject) {
        var args;
        if (typeof subject === 'string') {
            args = subject;
        } else {
            if (Array.isArray(subject)) {
                args = subject.join(' ');
            } else {
                return reject(new Error('arguments must be supplied as string or array'));
            }
        }

        exec(pathToBin + ' ' + args, function (err, stdout, stderr) {
            resolve({
                err: err,
                code: err && err.code || 0,
                stdout: stdout,
                stderr: stderr
            });
        });
    }).then(function (value) {
        return that.shift(value, 0);
    });
});

function testFile(fileName) {
    if (!(/\.cjson$/.test(fileName))) {
        fileName += '.cjson';
    }
    return require('path').resolve(__dirname, '..', 'files', fileName);
}

describe('bin/oconf-lint', function () {
    it('should exit with no errors if valid', function () {
        return expect(testFile('lint/valid'), 'when oconf-linted', 'to satisfy', {
            err: null,
            code: 0,
            stdout: '',
            stderr: 'No linting errors found.\n'
        });
    });
    it('should report the errors if invalid', function () {
        var filePath = testFile('lint/invalid');
        return expect(filePath, 'when oconf-linted', 'to satisfy', {
            err: expect.it('to be an', Error),
            code: 1,
            stdout: '',
            stderr: [
                'Error: Unexpected token \'}\' at 2:17',
                '    "foo": "bar',
                '               ^',
                'File: "' + filePath + '"',
                ''
            ].join('\n')
        });
    });
});
