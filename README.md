OConf
=====

[![Build Status](https://travis-ci.org/One-com/node-oconf.svg)](https://travis-ci.org/One-com/node-oconf)

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

Tests
-----

Download/clone, run `npm install` and then `npm test`.

License
-------

The software is provided under the Modified BSD License; See LICENSE for
further details.
