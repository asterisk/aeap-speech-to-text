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

/**
 * Checks to see if given objects are equal.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @param {requestCallback} [eq] - Object equality callback
 * @return {string} A comma separated string of language names.
 */
function equals(obj1, obj2, eq) {
	if (obj1 == undefined || obj1 == null ||
		obj2 == undefined || obj2 == null) {
		return false;
	}

	return obj1 == obj2 || (eq && eq(obj1, obj2));
}

/**
 * Creates a list of objects that contains only those objects that are equal between
 * the given lists of objects.
 *
 * @param {Object[]} objs1
 * @param {Object[]} objs2
 * @param {requestCallback} [eq] - Object equality callback
 * @return {Object[]} An intersected list of objects.
 */
function intersect(objs1, objs2, eq) {
	let res = [];

	for (let obj1 of objs1) {
		for (let obj2 of objs2) {
			if (equals(obj1, obj2, eq)) {
				res.push(obj1);
			}
		}
	}

	return res;
}

/**
 * Finds and returns the first matching object within two given lists.
 *
 * @param {Object[]} objs1
 * @param {Object[]} objs2
 * @param {requestCallback} [eq] - Object equality callback
 * @return {Object} The first matching object.
 */
function first(objs1, objs2, eq) {
	if (!Array.isArray(objs1)) {
		objs1 = [objs1];
	}

	if (!Array.isArray(objs2)) {
		objs2 = [objs2];
	}

	return intersect(objs1, objs2, eq)[0];
}

module.exports = {
	first,
	intersect,
}
