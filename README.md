OConf
=====

This is currently a experiment with putting some semi-random ideas about how
configuration can be done in a convenient manner into code.

The basic idea is to experiment with applying `#include`-statements recusively
inside JSON/cJSON documents:

    // default-settings.cjson
    {
		"some-setting": "default value",
		"value": 100
	}

	// my-config.cjson
	{
		"#include": "./default-settings.json",
		"value": 50
	}

Will result in a config with:

	{
		"some-setting": "default-value",
		"value": 50
	}

Tests
-----

Download/clone, run `npm install --dev` and then either `vows --spec` or `npm test`.

License
-------

The software is provided under the Modified BSD License; See LICENSE for
further details.

