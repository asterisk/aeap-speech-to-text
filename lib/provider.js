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

const { Writable } = require('stream');
const speech = require('@google-cloud/speech');

/*
 * For speech provider implementer.
 *
 * Basic Provider public interface:
 *
 * function setConfig(config) - sets configuration used by recognize stream
 * function start(config) - starts the recognize stream
 * function restart(config) - restarts the recognize stream
 * function end() - stops recognize and writable stream
 * function write(data) - writes data to the writable stream
 * event result(result) - triggered when a result is received from provider
 * field results[] - cache of received results (oldest to newest)
 *
 * Basic result object public interface:
 *
 *   result = {
 *     text: <the recognized string value>
 *     score: <percent based accuracy/confidence score>
 *   };
 */

/*
 * Google Speech API:
 *     https://googleapis.dev/nodejs/speech/latest/
 *
 * Google infinite streaming speech example:
 *    https://cloud.google.com/speech-to-text/docs/samples/speech-transcribe-infinite-streaming
 *
 * Nodejs stream API:
 *    https://nodejs.org/api/stream.html
 */
// const encoding = 'Encoding of the audio file, e.g. LINEAR16';
// const sampleRateHertz = 16000;
// const languageCode = 'BCP-47 language code with regional subtags, e.g. en-US';
// const limit = 10000; // ms - set to low number for demo purposes

const DEFAULT_ENCODING = "MULAW";
const DEFAULT_SAMPLE_RATE = 8000;
const DEFAULT_LANGUAGE = "en-US";
const DEFAULT_RESTART_TIME = 10; // in seconds
const DEFAULT_MAX_RESULTS = 100;

/**
 * @class GoogleProvider.
 *
 * Start, restart, and stop Google speech to text recognition. Results are
 * emitted via a "result" event that is passed the following object:
 *
 * result = {
 *   text: <the recognized string value>
 *   score: <percent based accuracy/confidence score>
 * };
 *
 * @extends Writable
 */
class GoogleProvider extends Writable {

	/* Mapped encodings supported by Google */
	static encodings = {
		ulaw: "MULAW",
		slin16: "LINEAR16",
		opus: "OGG Opus",
	};

	/* Languages this provider supports  */
	static languages = [
		"en-US",
	];

	/**
	 * Creates an instance of a Google provider stream.
	 *
	 * @param {Object} [options] - provider specific options
	 * @param {Object} [options.restartTime=10] - If specified auto-restart
	 *     recognition stream after a given interval (in seconds)
	 * @param {Object} [options.maxResults=100] - The maximum number of results
	 *     to cache before results are dropped (oldest dropped first)
	 */
	constructor(options) {
		super();

		this.config = {
			encoding: DEFAULT_ENCODING,
			sampleRateHertz: DEFAULT_SAMPLE_RATE,
			languageCode: DEFAULT_LANGUAGE,
		};

		this.restartTimer = null;
		this.restartTimeout = options && options.restartTime || DEFAULT_RESTART_TIME;
		this.maxResults = options && options.maxResults || DEFAULT_MAX_RESULTS;

		this.results = [];
		this.recognizeStream = null;
	}

	_construct(callback) {
		this.client = new speech.SpeechClient();

		callback();
	}

	_write(chunk, encoding, callback) {
		if (this.recognizeStream) {
			this.recognizeStream.write(chunk);
		}

		callback();
	}

	_writev(chunks, callback) {
		for (let chunk in chunks) {
			this._write(chunk, null, callback);
		}

		callback();
	}

	_final(callback) {
		this.stop();
		this.client.close();

		callback();
	}

	/**
	 * Sets the configuration to use on the recognition stream.
	 *
	 * @param {Object} [config] - configuration to set
	 * @param {Object} [config.codec] - the codec to map to an encoding
	 * @param {string} [config.language] - the language to use
	 */
	setConfig(config) {
		if (!config) {
			return;
		}

		let update = {};

		if (config.codec) {
			if (!(config.codec.name in GoogleProvider.encodings)) {
				throw new Error("Codec '" + config.codec.name + " 'not supported");
			}

			update.encodingencoding = GoogleProvider.encodings[config.codec.name];
			update.sampleRateHertz = config.codec.sampleRate;
		}

		if (config.language) {
			if (!GoogleProvider.languages.includes(config.language)) {
				throw new Error("Language '" + config.language + " 'not supported");
			}

			update.languageCode = config.language;
		}

		this.config = {...this.config, ...update};
	}

	/**
	 * Starts the recognition stream.
	 *
	 * @param {Object} [config] - configuration to use
	 * @param {Object} [config.codec] - the codec to map to an encoding
	 * @param {string} [config.language] - the language to use
	 */
	start(config) {
		if (this.recognizeStream) {
			return; // Already started
		}

		this.setConfig(config);
		config = this.config;

		const request = {
			config,
			interimResults: true,
		};

		this.recognizeStream = this.client
			.streamingRecognize(request)
			.on('error', (e) => {
				console.error("GoogleProvider: " + e + " - ending stream");
				this.end();
			})
			.on('data', (response) => {
				if (response.results[0] && response.results[0].alternatives[0]) {
					if (response.results[0].alternatives[0].confidence == 0) {
						return;
					}

					let result = {
						text: response.results[0].alternatives[0].transcript,
						score: Math.round(response.results[0].alternatives[0].confidence * 100),
					};

					console.debug("GoogleProvider: result: " + JSON.stringify(result));
					this.emit('result', result);

					if (this.results.length == this.maxResults) {
						this.results.shift();
					}

					this.results.push(result);
				} else {
					// stream limit reached restart?
					console.debug("GoogleProvider: received response, but no result");
				}
			});

		if (this.restartTimeout) {
			/*
			 * Google's speech engine may stop transcribing after a while,
			 * so restart the recognize stream after a specified interval.
			 */
			this.restartTimer = setTimeout(() => this.restart(), this.restartTimeout * 1000);
		}

		while (this.writableCorked) {
			this.uncork();
		}
	}

	/**
	 * Stops the recognition stream.
	 */
	stop() {
		if (this.restartTimer) {
			clearInterval(this.restartTimer);
			this.restartTimer = null;
		}

		if (!this.recognizeStream) {
			return;
		}

		this.cork(); // Buffer any incoming data

		this.recognizeStream.end();
		this.recognizeStream = null;
	}

	/**
	 * Restarts the recognition stream.
	 *
	 * @param {Object} [config] - configuration to use
	 * @param {Object} [config.codec] - the codec to map to an encoding
	 * @param {string} [config.language] - the language to use
	 */
	restart(config) {
		this.stop();
		this.start(config);
	}
}

/**
 * Gets a speech provider
 *
 * @param {string} name - A speech provider name
 * @param {Object} options - Provider specific options
 * @return A speech provider.
 */
function getProvider(name, options) {
	if (name == "google") {
		return new GoogleProvider(options);
	}

	throw new Error("Unsupported speech provider '" + name + "'");
}

module.exports = {
	getProvider,
}
