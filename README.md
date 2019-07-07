# OConf

[![NPM version](https://badge.fury.io/js/oconf.svg)](https://npmjs.com/package/oconf)
[![Build Status](https://travis-ci.org/One-com/node-oconf.svg)](https://travis-ci.org/One-com/node-oconf)
[![Coverage Status](https://coveralls.io/repos/One-com/node-oconf/badge.svg)](https://coveralls.io/r/One-com/node-oconf)
[![Dependency Status](https://david-dm.org/One-com/node-oconf.png)](https://david-dm.org/One-com/node-oconf)

Load cjson (JSON + c-style) commentaries, with inheritance-sugar on top:

    > var oconf = require('oconf');
    > oconf.load('config/my-config.cjson');
    {
         "some-setting": "default-value",
         "value": 50
    }

## The `#include` directive

Anywhere in your cjson file, you can `#include` another cjson file. The file containing the `#include` directive overrides any values from the file being included, in case of conflicts.

### Format

The basic idea is to experiment with applying `#include`-directives recusively
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

### Structure

There are no restrictions in how includes work (except no loops). Usually a
structure like this is used:

 * `project/config/default.cjson` has project-wide defaults.
 * `project/config/{dev,test,staging,production}.cjson` inherits the default
   and set keys relevant to respective environments
 * `project/config/$HOSTNAME.cjson` (optinal) machine-specifics that inherit
   from the relevant environment-file.
 * `/etc/$WORKNAME/$PROJECTNAME-secrets.cjson` inherits the machine-specific
   things and typically adds production secrets.

## The `#public` directive

With this directive, you can generate a json blob that can be safely exposed to client-side code. This is useful when some properties on the same object are safe to expose to client code, while others are not.

### Restrictions

In case of conflicts between a `#public` and a non-public key on the same object, an error is thrown - it is usually a sign that a new key needs to be introduced if the same key contains different values for client and server code.

The `#include` directives are processed before `#public`.

### Format

Anywhere in your cjson file, you can add a `#public` property to an object, denoting some keys on that property you want grouped together on the `#public` property of the root of your config. 

```javascript
// some-public-settings.cjson
{
  "some-setting": "default value",
  "value": 100,
  "fancy-list": {
    "expose-foo": true,
    "#public": {
      "scroll-timeout": 100
    }
  }
}
```

Will result in a config with:

```javascript
{
  "some-setting": "default-value",
  "value": 100,
  "fancy-list": {
    "expose-foo": true,
    "scroll-timeout": 100
  },
  "#public": {
    "fancy-list": {
      "scroll-timeout": 100
    }
  }
}
```

### Returning only configuration marked as `#public`

You can instruct `oconf.load` to only return configuration properties marked with `#public`:

    > var oconf = require('oconf');
    > oconf.load('config/some-public-settings.cjson', { public: true });
    {
        "fancy-list": {
            "scroll-timeout": 100
        }
    }

Of course you can also just grab the `#public` property from the result of `oconf.load`:

    > var oconf = require('oconf');
    > oconf.load('config/some-public-settings.cjson')['#public'];
    {
        "fancy-list": {
            "scroll-timeout": 100
        }
    }

## Binary

To help resolve configuration on the command line oconf exports a CLI
tool called oconf. It takes a path to an cjson file, and outputs the
resolved JSON object.

```
 $ oconf config.cjson
{
  "someConfig": "someValue",
  "obj": {
    "foo": "bar"
  }
}
```

You can lint your configuration files by using the `--lint` flag. It
will not output any of the resolved configuration, but only exit with
an error in case of any formatting errors in the files.

```
 $ oconf --lint config.cjson
```

By using the `--extract-option` flag you can supply a path to a value
as well:

```
 $ oconf --extract-option obj.foo config.cjson
bar
```

The output from the above is the raw data. That is useful when you
need to pass the configuration to other CLI tools. If you need the
JSON formatted data, you can pass the `--option-as-json` option.

```
 $ oconf --extract-option obj.foo --json config.cjson
"bar"
```

If the key is missing `oconf --extract-option` will exit with status
code 1. If you need to overwrite that behaviour you can pass the
`--allow-missing-option` flag to oconf which will make it exit with
status code 0 if no value is found at the given path.

You can also filter out values in the `#public` blob with the `--public` flag.

```
 $ oconf --public some-public-settings.cjson
{
  "fancy-list": {
    "scroll-timeout": 100
  }
}
```

## Support for relaxed JSON format
**Reference:** https://www.npmjs.com/package/relaxed-json

```js
// Contents of config.rjson
{
  someConfig: 'someValue'
}
```

### In terminal:
```sh
 $ oconf --relaxed config.rjson
{
    "someConfig": "someValue"
}
```

In Node JS:
```js
var oconf = require('oconf');
var data = oconf.load('config.rjson', { relaxed: true });
console.log(JSON.stringify(data));

// Output:
{"someConfig": "someValue"}
```

## Tests

Download/clone, run `npm install` and then `npm test`.

## License

The software is provided under the Modified BSD License; See
[LICENSE](LICENSE) for further details.
