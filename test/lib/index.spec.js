/*global describe, it, before*/
var expect = require('unexpected');
var oconf = require('../../lib/index');

function testFile(filename) {
    return require('path').resolve(__dirname, '..', 'files', filename);
}

describe('Basic tests', function () {
    describe('base.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('base.cjson'));
        });
        it('Has foo = "overwrite this"', function () {
            expect(data, 'to have property', 'foo', 'overwrite this');
        });
        it('Has what = "this is from default.cjson."', function () {
            expect(data, 'to have property', 'what', 'this is from default.cjson.');
        });
        it('Only has "foo" and "what"-keys', function () {
            expect(data, 'to only have keys', ['foo', 'what']);
        });
    });
});

describe('#include behaviour', function () {
    describe('extend-base.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('extend-base.cjson'));
        });
        it('Has foo = "bar" (i.e. overwritten)', function () {
            expect(data, 'to have property', 'foo', 'bar');
        });
        it('Has what = "this is from default.cjson."', function () {
            expect(data, 'to have property', 'what', 'this is from default.cjson.');
        });
        it('Only has "foo" and "what"-keys', function () {
            expect(data, 'to only have keys', ['foo', 'what']);
        });
    });
    describe('extend-in-subobject.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('extend-in-subobject.cjson'));
        });
        it('Has subobject = contents of extend-base.cjson', function () {
            expect(data, 'to equal', {
                'subobject': {
                    'foo': 'bar',
                    'what': 'this is from default.cjson.'
                }
            });
        });
    });
    describe('extend-multiple.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('extend-multiple.cjson'));
        });
        it('should have properties from both extended files', function () {
            expect(data, 'to equal', {
                foo: 'bar',
                bar: 'foo'
            });
        });
    });
    describe('extend-nested.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('extend-nested.cjson'));
        });
        it('should have properties from both extended files', function () {
            expect(data, 'to equal', {
                foo: 'foo',
                bar: 'bar',
                baz: 'baz'
            });
        });
    });
    describe('list-of-includes.cjson', function () {
        var data;
        before(function () {
            data = oconf.load(testFile('list-of-includes.cjson'));
        });
        it('should resolve includes in the list', function () {
            expect(data, 'to equal', [
                { foo: 'bar' }, { bar: 'foo' }
            ]);
        });
    });
    describe('loop1.cjson / loop2.cjson', function () {
        it('Loading loop1.cjson throws error', function () {
            expect(function () {
                oconf.load(testFile('loop1.cjson'));
            }, 'to throw', /^Loop in loaded files/);
        });
        it('Loading loop2.cjson throws error', function () {
            expect(function () {
                oconf.load(testFile('loop2.cjson'));
            }, 'to throw', /^Loop in loaded files/);
        });
    });
    describe('includeNonExistentFile.cjson', function () {
        it('should throw an error when nonExistentFile.cjson is not ignored', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'));
            }, 'to throw', /^ENOENT, no such file or directory/);
        });
        it('should not throw an error when nonExistentFile.cjson is ignored', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), {ignore: testFile('nonExistentFile.cjson')});
            }, 'not to throw');
        });
    });
    describe('ignore included files with globbing', function () {
        it('should not throw an error when ignoring by glob #1', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), { ignore: '**/*.cjson' });
            }, 'not to throw');
        });
        it('should not throw an error when ignoring by glob #2', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), { ignore: testFile('./**') });
            }, 'not to throw');
        });
        it('should not throw an error when ignoring by glob #3', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), { ignore: testFile('../files/*') });
            }, 'not to throw');
        });
        it('should not throw an error when ignoring by glob #4', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), { ignore: '../files/*.cjson', cwd: __dirname });
            }, 'not to throw');
        });
        it('should throw an error when ignoring by glob but including file not matched by glob', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'), { ignore: testFile('foo/*cjson') });
            }, 'to throw', /^ENOENT, no such file or directory/);
        });
    });
});

describe('#public behaviour', function () {
    describe('when loading with public:false (the default)', function () {
        describe('where the root object contains a #public property', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-base.cjson'));
            });
            it('should fold the #public properties down into the base structure', function () {
                expect(data, 'to equal', {
                    foo: 'do not expose to public',
                    what: 'what is public'
                });
            });
        });

        describe('where a child object contains some #public properties', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-deep.cjson'));
            });
            it('should fold the #public properties down into the base structure', function () {
                expect(data, 'to equal', {
                    foo: "do not expose to public",
                    bar: {
                        quux: "super secret"
                    },
                    hello: {
                        earth: "mostly harmless",
                        answer: 42
                    }
                });
            });
        });
    });

    describe('when loading with public:true', function () {
        describe('where the root object contains a #public property', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-base.cjson'), { public: true });
            });
            it('should fold the #public properties down into the base structure, and omit secret properties and leaves', function () {
                expect(data, 'to equal', {
                    what: 'what is public'
                });
            });
        });

        describe('where a child object contains some #public properties', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-deep.cjson'), { public: true });
            });
            it('should fold the #public properties down into the base structure', function () {
                expect(data, 'to equal', {
                    hello: {
                        answer: 42
                    }
                });
            });
        });
    });
});
