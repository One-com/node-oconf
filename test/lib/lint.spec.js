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
            expect(err, 'to be an error', /^Parse error on line 2:/);
            done();
        });
    });
});
