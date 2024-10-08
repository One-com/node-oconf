/*global describe, it, before*/
var pathModule = require('path');
var expect = require('unexpected').clone();
var oconf = require('../../lib/index');

function testFile(filename) {
    return pathModule.resolve(__dirname, '..', 'files', filename);
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

    describe('calling load method with an array of config file names', function () {
        var data, dataInclude;
        before(function () {
            data = oconf.load([testFile('extend-base.cjson'), testFile('deep.cjson')]);
            dataInclude = oconf.load(testFile('extend-wrap.cjson'));
        });
        it('functions like calling #include with an array of filenames in the same order', function () {
            expect(data, 'to equal', dataInclude);
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

    it('should support the same file being included multiple times when there are no loops', function () {
        expect(
            oconf.load(
                pathModule.resolve(
                    __dirname,
                    '../fixtures/include-non-loopy.cjson'
                )
            ),
            'to equal',
            {
                foo: {
                    abc: 123
                },
                bar: {
                    abc: 123
                }
            }
        );
    });

    describe('includeNonExistentFile.cjson', function () {
        it('should throw an error when nonExistentFile.cjson is not ignored', function () {
            expect(function () {
                oconf.load(testFile('includeNonExistentFile.cjson'));
            }, 'to throw', /^ENOENT/);
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
            }, 'to throw', /^ENOENT/);
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
                    what: 'what is public',
                    '#public': {
                        what: 'what is public'
                    }
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
                    foo: 'do not expose to public',
                    bar: {
                        quux: 'super secret'
                    },
                    hello: {
                        earth: 'mostly harmless',
                        answer: 42
                    },
                    '#public': {
                        hello: {
                            answer: 42
                        }
                    }
                });
            });
        });

        describe('where a child object in a child array contains some #public properties', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('array-with-object-with-public.cjson'));
            });
            it('should fold the #public properties down into the base structure', function () {
                expect(data, 'to equal', {
                    foo: [
                        {
                            bar: 'quux'
                        }
                    ],
                    '#public': {
                        foo: [
                            {
                                bar: 'quux'
                            }
                        ]
                    }
                });
            });
        });

        describe('where a child object in a child array contains some #public properties', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('array-with-object-with-array-with-object-with-public.cjson'));
            });
            it('should fold the #public properties down into the base structure', function () {
                expect(data, 'to exhaustively satisfy', {
                    0: {
                        foo: [
                            {
                                bar: 'quux'
                            }
                        ]
                    },
                    '#public': [{
                        foo: [
                            {
                                bar: 'quux'
                            }
                        ]
                    }]
                }).and('to be an array');
            });
        });

        describe('when trying to overwrite a public property with a property that was declared public at another level', function () {
            it('should throw an error', function () {
                expect(function () {
                    oconf.load(testFile('public-conflict.cjson'));
                }, 'to throw', /^Unsupported combination of public and non/);
            });
        });

        describe('where trying to overwrite a non-public property with a #public one', function () {
            it('should throw an error', function () {
                expect(function () {
                    oconf.load(testFile('public-deep-with-include.cjson'));
                }, 'to throw', /^Unsupported combination of public and non/);
            });
        });

        describe('where trying to overwrite a #public property with a non-public one', function () {
            it('should throw an error', function () {
                expect(function () {
                    oconf.load(testFile('public-deep-with-include.cjson'));
                }, 'to throw', /^Unsupported combination of public and non/);
            });
        });

        describe('where including a file that already has a #public property which we try to overwrite', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-deep-with-public-include.cjson'));
            });
            it('should overwrite the included #public property with our value', function () {
                expect(data, 'to equal', {
                    foo: 'do not expose to public',
                    bar: {
                        quux: 'super secret'
                    },
                    hello: {
                        earth: 'mostly harmless',
                        answer: 'Insufficient data for meaningful answer'
                    },
                    '#public': {
                        hello: {
                            answer: 'Insufficient data for meaningful answer'
                        }
                    }
                });
            });
        });

        describe('when calling load method with an array of config file names containing public properties', function () {
            var data, dataInclude;
            before(function () {
                data = oconf.load([testFile('public-left.cjson'), testFile('public-right.cjson')]);
                dataInclude = oconf.load(testFile('public-left-right-wrap.cjson'));
            });
            it('functions like calling #include with an array of filenames in the same order', function () {
                expect(data, 'to equal', dataInclude);
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
            it('should fold the #public properties down into the base structure, and omit secret properties and leaves', function () {
                expect(data, 'to equal', {
                    hello: {
                        answer: 42
                    }
                });
            });
        });

        describe('where trying to overwrite a non-public property with a #public one', function () {
            it('should throw an error', function () {
                expect(function () {
                    oconf.load(testFile('public-deep-with-include.cjson'), { public: true });
                }, 'to throw', /^Unsupported combination of public and non/);
            });
        });

        describe('where trying to overwrite a #public property with a non-public one', function () {
            it('should throw an error', function () {
                expect(function () {
                    oconf.load(testFile('public-deep-with-include.cjson'), { public: true });
                }, 'to throw', /^Unsupported combination of public and non/);
            });
        });

        describe('where including a file that overwrites a #public property with another public one', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('public-deep-with-public-include.cjson'), { public: true });
            });
            it('should overwrite the included #public property with our value, and omit secret properties and leaves', function () {
                expect(data, 'to equal', {
                    hello: {
                        answer: 'Insufficient data for meaningful answer'
                    }
                });
            });
        });

        describe('when there are no #public properties at all', function () {
            var data;
            before(function () {
                data = oconf.load(testFile('base.cjson'), { public: true });
            });
            it('should return an empty object', function () {
                expect(data, 'to equal', {});
            });
        });
    });

    describe('with public-array.cjson', function () {
        it('throws an error', function () {
            expect(function () {
                oconf.load(testFile('public-array.cjson'));
            }, 'to throw', /^#public must always be an object/);
        });
    });

    describe('with public-non-object.cjson', function () {
        it('throws an error', function () {
            expect(function () {
                oconf.load(testFile('public-non-object.cjson'));
            }, 'to throw', /^#public must always be an object/);
        });
    });

    describe('with a #public-suffixed key', function () {
        it('treats the key as if contained inside a #public block', function () {
            expect(
                oconf.load(
                    pathModule.resolve(
                        __dirname,
                        '../fixtures/valid-public.cjson'
                    )
                ),
                'to equal',
                {
                    foo: {
                        bar: 123,
                        quux: 456
                    },
                    '#public': {
                        foo: {
                            bar: 123
                        }
                    }
                }
            );
        });

        it('complains if a #public-suffixed key shadows an entry inside a #public block', function () {
            expect(
                function () {
                    oconf.load(
                        pathModule.resolve(
                            __dirname,
                            '../fixtures/invalid-public.cjson'
                        )
                    );
                },
                'to throw',
                new Error('foo#public clashes with foo inside #public block')
            );
        });

        it.skip('should allow overwriting a key inside a #public block with a #public-suffixed key of the same name', function () {
            expect(
                oconf.load(
                    pathModule.resolve(
                        __dirname,
                        '../fixtures/public-key-include-public-block.cjson'
                    )
                ),
                'to equal',
                {
                    foo: {
                        abc: 123
                    },
                    '#public': {
                        foo: {
                            abc: 123
                        }
                    }
                }
            );
        });

        it.skip('should allow overwriting a #public-suffixed key with a key of the same name inside a #public block', function () {
            expect(
                oconf.load(
                    pathModule.resolve(
                        __dirname,
                        '../fixtures/public-block-include-public-key.cjson'
                    )
                ),
                'to equal',
                {
                    foo: {
                        abc: 123
                    },
                    '#public': {
                        foo: {
                            abc: 123
                        }
                    }
                }
            );
        });
    });
});
