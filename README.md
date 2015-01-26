OConf
=====

[[![NPM version](https://badge.fury.io/js/oconf.svg)](http://badge.fury.io/js/oconf)
![Build Status](https://travis-ci.org/One-com/node-oconf.svg)](https://travis-ci.org/One-com/node-oconf)
[![Coverage Status](https://coveralls.io/repos/One-com/node-oconf/badge.svg)](https://coveralls.io/r/One-com/node-oconf)
[![Dependency Status](https://david-dm.org/One-com/node-oconf.png)](https://david-dm.org/One-com/node-oconf)

Load cjson (JSON + c-style) commentaries, with inheritance-sugar on top:

    > var oconf = require('oconf');
    > oconf.load('config/my-config.cjson');
    {
         "some-setting": "default-value",
         "value": 50
    }

Format
------

The basic idea is to experiment with applying `#include`-statements recusively
inside JSON/cJSON documents:

```javascript
// default-settings.cjson
{
	"some-setting": "default value",
	"value": 100
}
```

```javascript
// my-config.cjson
{
	"#include": "./default-settings.json",
	"value": 50
}
```

Will result in a config with:

```javascript
{
	"some-setting": "default-value",
	"value": 50
}
```

The extension of objects also work recursively, so setting a single sub-key
somewhere doesn't override the entire thing.

Structure
---------

There are no restrictions in how includes work (except no loops). Usually a
structure like this is used:

 * `project/config/default.cjson` has project-wide defaults.
 * `project/config/{dev,test,staging,production}.cjson` inherits the default
   and set keys relevant to respective environments
 * `project/config/$HOSTNAME.cjson` (optinal) machine-specifics that inherit
   from the relevant environment-file.
 * `/etc/$WORKNAME/$PROJECTNAME-secrets.cjson` inherits the machine-specific
   things and typically adds production secrets.

Binary
------

To help resolve configuration on the command line oconf exports a CLI
tool called oconf. In it's simplest form it takes a path to an cjson
file, and outputs the resolved JSON object.

```
 $ oconf config.cjson
{
  "someConfig": "someValue",
  "obj": {
    "foo": "bar"
  }
}
```

Oconf also takes a `--lint` option. It will make oconf not output any
of the resolved configuration, but only exit with an error in case of
any formatting errors in the files.

```
 $ oconf --lint config.cjson
```

You can supply a path to a value as well:

```
 $ oconf config.cjson obj.foo
"bar"
```

The output from the above is the JSON.stringified format. If you need
to pass it into another cli program, you'd most likely want it as a
string literal and not quoted. That can be achieved like this:

```
 $ oconf --bare config.cjson obj.foo
bar
```

If the key is missing oconf will exit with exit code 1. If you need to
overwrite that behaviour you can pass the `--allowmissing` flag to
oconf which will make it exit with status code 0 if no value is found
at the given path.

Tests
-----

Download/clone, run `npm install` and then `npm test`.

License
-------

The software is provided under the Modified BSD License; See LICENSE for
further details.
