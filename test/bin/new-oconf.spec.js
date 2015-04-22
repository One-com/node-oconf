/* global describe, it */
var exec = require('child_process').exec;
var expect = require('unexpected');

var pathToBin = require('path').resolve(__dirname, '../../bin/', 'new-oconf');

function formattedJson(obj) {
    return JSON.stringify(obj, null, 4) + '\n';
}

function testFile(fileName) {
    if (!(/\.cjson$/.test(fileName))) {
        fileName += '.cjson';
    }
    return require('path').resolve(__dirname, '..', 'files', fileName);
}

expect.addAssertion('when passed as arguments to oconf', function (expect, subject, value) {
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

describe('bin/new-oconf', function () {
    describe('basic functionality', function () {
        it('should print the resolved json structure to stdout', function () {
            return expect(testFile('base'), 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: formattedJson({
                    foo: "overwrite this",
                    what: "this is from default.cjson."
                }),
                stderr: ''
            });
        });
        it('should fail when asked for nonexistant file', function () {
            return expect(testFile('nonExistent'), 'when passed as arguments to oconf', 'to satisfy', {
                err: expect.it('to be an', Error),
                stderr: expect.it('to match', /Error: ENOENT, no such file or directory/)
            });
        });
        it('should fail when resolved file includes non existing file', function () {
            return expect(testFile('includeNonExistentFile'), 'when passed as arguments to oconf', 'to satisfy', {
                err: expect.it('to be an', Error),
                stderr: expect.it('to match', /Error: ENOENT, no such file or directory/)
                    .and('to match', /nonExistentFile.cjson/)
            });
        });
        it('should not fail when resolved file includes non existing file when passed --ignore', function () {
            return expect([
                testFile('includeNonExistentFile'),
                '--ignore',
                testFile('nonExistentFile.cjson')

            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: formattedJson({
                    foo: 123
                })
            });
        });
    });
    describe('--help', function () {
        it('should exit with no errors and show the help', function () {
            return expect('--help', 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                code: 0,
                stdout: '',
                stderr: expect.it('to match', /Options:/)
            });
        });
    });
    describe('--lint', function () {
        it('should exit with no errors if valid', function () {
            return expect([
                testFile('lint/valid.cjson'),
                '--lint'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: '',
                stderr: 'No linting errors found.\n'
            });
        });
        it('should report the errors if invalid', function () {
            var filePath = testFile('lint/invalid.cjson');
            return expect([
                filePath,
                '--lint'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: expect.it('to be an', Error),
                stdout: '',
                stderr: [
                    'Error: Parse error on line 2:',
                    '{    "foo": "bar}',
                    '------------^',
                    // XXX: The appended + '"' on the next line is a
                    // result of bad formatting in the module cjson's
                    // error handler. It should be removed once
                    // https://github.com/kof/node-cjson/pull/13 is merged
                    // or the problem is other wise fixed.
                    "Expecting 'STRING', 'NUMBER', 'NULL', 'TRUE', 'FALSE', '{', '[', got 'undefined'" + '"',
                    'File: "' + filePath + '"',
                    ''
                ].join('\n')
            });
        });
    });
    describe('--extract-option', function () {
        it('should return the option value', function () {
            return expect([
                testFile('base'),
                '--extract-option',
                'foo'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: 'overwrite this\n',
                stderr: ''
            });
        });
        it('should return the option value as json when passed --option-as-json', function () {
            return expect([
                testFile('base'),
                '--extract-option',
                'foo',
                '--option-as-json'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: formattedJson('overwrite this'),
                stderr: ''
            });
        });
        it('should fail when no such option exists', function () {
            return expect([
                testFile('base'),
                '--extract-option',
                'bar'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: expect.it('to be an', Error),
                code: 1,
                stdout: '',
                stderr: expect.it('to match', /Key bar not found/)
            });
        });
        it('should not fail when no such option exists when --allow-missing-option passed', function () {
            return expect([
                testFile('base'),
                '--extract-option',
                'bar',
                '--allow-missing-option'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                code: 0,
                stdout: '',
                stderr: ''
            });
        });
        it('should support dotting out properties (foo.bar)', function () {
            return expect([
                testFile('deep'),
                '--extract-option',
                'foo.bar'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                stdout: 'qux\n',
                stderr: ''
            });
        });
    });
    describe('--ignore flag', function () {
        it('should work with no other options', function () {
            return expect([
                testFile('includeNonExistentFile'),
                '--ignore',
                testFile('nonExistentFile.cjson')

            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                code: 0,
                stdout: formattedJson({
                    foo: 123
                })
            });
        });
        it('should work with --extract-option', function () {
            return expect([
                testFile('includeNonExistentFile'),
                '--ignore',
                testFile('nonExistentFile.cjson'),
                '--extract-option foo'

            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                code: 0,
                stdout: formattedJson(123)
            });
        });
        it('should work with --lint', function () {
            return expect([
                testFile('includeNonExistentFile'),
                '--ignore',
                testFile('nonExistentFile.cjson'),
                '--lint'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                err: null,
                code: 0,
                stdout: '',
                stderr: 'No linting errors found.\n'
            });
        });
    });
    describe('should complain about nonsensical flag combinations', function () {
        it('should not allow --allow-option-missing with --lint', function () {
            return expect([
                'foo.cjson',
                '--lint',
                '--allow-missing-option'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                code: 1,
                stderr: /^The flag --allow-missing-option does not make sense/
            });
        });
        it('should not allow --option-as-json with --lint', function () {
            return expect([
                'foo.cjson',
                '--lint',
                '--option-as-json'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                code: 1,
                stderr: /^The flag --option-as-json does not make sense/
            });
        });
        it('should not allow --option-as-json with no other flags', function () {
            return expect([
                'foo.cjson',
                '--option-as-json'
            ], 'when passed as arguments to oconf', 'to satisfy', {
                code: 1,
                stderr: /^The flag --option-as-json does not make sense/
            });
        });
    });
});
