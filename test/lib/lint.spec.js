/* global describe, it */
var lint = require('../../lib/lint');
var expect = require('unexpected');
var Path = require('path');

function testFile(filename) {
    return Path.resolve(__dirname, '..', 'files', 'lint', filename);
}


describe('lib/lint', function () {
    it('should export a function', function () {
        expect(lint, 'to be a function');
    });
    it('should not complain when given a valid file', function (done) {
        lint(testFile('valid.cjson'), function (err) {
            expect(err, 'to be undefined');
            done();
        });
    });
    it('should complain when given an invalid file', function (done) {
        lint(testFile('invalid.cjson'), function (err) {
            expect(err, 'to be an', Error);
            expect(err, 'to satisfy', {
                message: /^Parse error on line 2:/
            });
            done();
        });
    });
});
