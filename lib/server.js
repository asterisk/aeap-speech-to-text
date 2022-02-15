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

const EventEmitter = require("events");
const { WebSocketServer } = require("ws");

/*
 * For server accepting clients implementer.
 *
 * Basic server public interface:
 *
 * function close() - shutdowns the server
 * event connection(client) - triggered when a client connects
 *
 * Basic client public interface:
 *
 * function send(data, { binary: <boolean> }) - sends data to client
 * event close() - triggered when a client closes
 * event message(data, isBinary) - triggered when data is received
 */

const DEFAULT_PORT = 9099;

/**
 * @class WSServer.
 *
 * Wrapper around a websocket server. Starts listening on a given port, and
 * emits a "connection" event when a client connects.
 *
 * @extends EventEmitter
 */
class WSServer extends EventEmitter {
	/**
	 * Creates an instance of a Websocket server.
	 *
	 * @param {Object} [options] - websocket server specific options
	 * @param {Object} [options.port=9099] - Port to listen on
	 */
	constructor(options) {
		super();

		this.port = options && options.port || DEFAULT_PORT;

		this.ws = new WebSocketServer({
			port: this.port,
			clientTracking: true,
		});

		this.ws.on("listening", () => {
			console.info("Server on port '" + this.port + "': started listening");
		});

		this.ws.on("close", () => {
			console.info("Server on port '" + this.port + "': stopped listening");
		});

		this.ws.on("error", (error) => {
			console.error(error);
		});

		this.ws.on("connection", (client) => {
			console.info("Server on port '" + this.port + "': client connected");
			/**
			 * Client connect event.
			 *
			 * @event WSServer#connection
			 * @type {object}
			 */
			this.emit("connection", client);
		});
	}

	/**
	 * Close/Stop the server disconnecting all clients
	 */
	close() {
		for (let client of this.ws.clients) {
			console.log("WSServer: close client");
			client.close();
		}

		this.ws.close((error) => {
			console.log("error " + error);
		});
	}
}

/**
 * Gets a server.
 *
 * @param {string} name - A server type name
 * @param {Object} options - Server specific options
 * @return A server.
 */
function getServer(name, options) {
	if (name == "ws") {
		return new WSServer(options);
	}

	throw new Error("Unsupported server type '" + name + "'");
}

module.exports = {
	getServer,
}
