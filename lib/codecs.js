/*
 *  Copyright 2022 Sangoma Technologies Corporation
 *  Kevin Harwell <kharwell@sangoma.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const utils = require("./utils");

/**
 * Supported codecs
 */
const supported = [
	{
		"name": "ulaw",
		"sampleRate": 8000,
		"attributes" : [],
	},
	{
		"name": "slin16",
		"sampleRate": 16000,
		"attributes" : [],
	},
	{
		"name": "opus",
		"sampleRate": 48000,
		"attributes" : [],
	},
];

/**
 * Checks if given codecs match.
 *
 * @param {Object} obj1 - A codec object
 * @param {Object} obj2 - A codec object
 * @return {boolean} true if codecs match otherwise false.
 */
function equal(obj1, obj2) {
	return obj1.name === obj2.name;
}

/**
 * Converts codecs to a comma separated string of codec names.
 *
 * @param {Object|Object[]} objs - Codecs to convert
 * @return {string} A comma separated string of codec names.
 */
function toString(objs) {
	if (!Array.isArray(objs)) {
		objs = [objs];
	}

	return objs.map(o => o.name).join(", ");
}

/** @class Codecs. */
class Codecs {
	/**
	 * Creates an instance of Codecs.
	 *
	 * @param {Object} options - Codec options
	 */
	constructor(options) {
		this.codecs = options.codecs ?
			utils.intersect(supported, options.codecs, equal) : supported;

		this.selected = this.codecs[0]; // Default to first in list
	}

	/**
	 * Selects the first matching codec between supported and given codecs
	 *
	 * @param {Object|Object[]} codecs - Codecs to intersect with supported
	 * @return The first selected codec
	 */
	first(codecs) {
		try {
			let res = utils.first(this.codecs, codecs, equal);

			if (res) {
				return res;
			}
		} catch (e) {
		}

		throw new Error("Codec " + toString(codecs) + " not supported");
	}
};

module.exports = {
	Codecs,
}
