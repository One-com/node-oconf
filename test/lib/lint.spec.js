/* global describe, it */
var Path = require('path');
var lint = require('../../lib/lint');
var expect = require('unexpected')
    .clone()
    .addAssertion('to be an error', function (expect, subject, value) {
        expect(subject, 'to be an', Error);
        expect(subject, 'to satisfy', {
            message: value
        });
    });

function testData(filename) {
    return Path.resolve(__dirname, '..', 'files', 'lint', filename);
}


describe('lib/lint', function () {
    it('should export a function', function () {
        expect(lint, 'to be a function');
    });
    it('should throw an error if path does not exist', function (done) {
        lint(testData('nonExistant.cjson'), function (err) {
            expect(err, 'to be an error', /^ENOENT/);
            done();
        });
    });
    it('should not complain when given a valid file', function (done) {
        lint(testData('valid.cjson'), function (err) {
            expect(err, 'to be undefined');
            done();
        });
    });
    it('should complain when given an invalid file', function (done) {
        lint(testData('invalid.cjson'), function (err) {
            expect(err, 'to be an error', /^Unexpected token '.' at 2:/);
            done();
        });
    });
    describe('should be able to lint a directory', function () {
        it('should not complain if no invalid files are found', function (done) {
            lint(testData('validDirectory'), function (err) {
                expect(err, 'to be undefined');
                done();
            });
        });
        it('should complain if at least one file is invalid', function (done) {
            lint(testData('invalidDirectory'), function (err) {
                expect(err, 'to satisfy', {
                    message: /^Unexpected token '.' at 2:/,
                    file: /invalidDirectory\/2.cjson$/
                });
                done();
            });
        });
    });
});
