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
 * Supported languages
 */
const supported = [
	"en-US",
];

/**
 * Converts languages to a comma separated string of language names.
 *
 * @param {Object|Object[]} objs - Languages to convert
 * @return {string} A comma separated string of language names.
 */
function toString(objs) {
	if (!Array.isArray(objs)) {
		objs = [objs];
	}

	return objs.join(", ");
}

/** @class Languages. */
class Languages {

	/**
	 * Creates an instance of Languages.
	 *
	 * @param {Object} options - Language options
	 */
	constructor(options) {
		this.languages = options.languages ?
			utils.intersect(supported, options.languages) : supported;

		this.selected = this.languages[0]; // Default to first in list
	}

	/**
	 * Selects the first matching language between supported and given languages
	 *
	 * @param {Object|Object[]} languages - Languages to intersect with supported
	 * @return The first selected language
	 */
	first(languages) {
		try {
			let res = utils.first(this.languages, languages);

			if (res) {
				return res;
			}
		} catch (e) {
		}

		throw new Error("Language " + toString(languages) + " not supported");
	}
};

module.exports = {
	Languages,
}
