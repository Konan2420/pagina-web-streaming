import { o as __toESM } from "../_runtime.mjs";
//#region node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
var WebSocketFactory = class {
	static detectEnvironment() {
		var _a;
		if (typeof WebSocket !== "undefined") return {
			type: "native",
			constructor: WebSocket
		};
		if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") return {
			type: "native",
			constructor: globalThis.WebSocket
		};
		if (typeof global !== "undefined" && typeof global.WebSocket !== "undefined") return {
			type: "native",
			constructor: global.WebSocket
		};
		if (typeof globalThis !== "undefined" && typeof globalThis.WebSocketPair !== "undefined" && typeof globalThis.WebSocket === "undefined") return {
			type: "cloudflare",
			error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
			workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
		};
		if (typeof globalThis !== "undefined" && globalThis.EdgeRuntime || typeof navigator !== "undefined" && ((_a = navigator.userAgent) === null || _a === void 0 ? void 0 : _a.includes("Vercel-Edge"))) return {
			type: "unsupported",
			error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
			workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
		};
		if (typeof process !== "undefined") {
			const processVersions = process["versions"];
			if (processVersions && processVersions["node"]) {
				const versionString = processVersions["node"];
				const nodeVersion = parseInt(versionString.replace(/^v/, "").split(".")[0]);
				if (nodeVersion >= 22) {
					if (typeof globalThis.WebSocket !== "undefined") return {
						type: "native",
						constructor: globalThis.WebSocket
					};
					return {
						type: "unsupported",
						error: `Node.js ${nodeVersion} detected but native WebSocket not found.`,
						workaround: "Provide a WebSocket implementation via the transport option."
					};
				}
				return {
					type: "unsupported",
					error: `Node.js ${nodeVersion} detected without native WebSocket support.`,
					workaround: "For Node.js < 22, install \"ws\" package and provide it via the transport option:\nimport ws from \"ws\"\nnew RealtimeClient(url, { transport: ws })"
				};
			}
		}
		return {
			type: "unsupported",
			error: "Unknown JavaScript runtime without WebSocket support.",
			workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
		};
	}
	static getWebSocketConstructor() {
		const env = this.detectEnvironment();
		if (env.constructor) return env.constructor;
		let errorMessage = env.error || "WebSocket not supported in this environment.";
		if (env.workaround) errorMessage += `\n\nSuggested solution: ${env.workaround}`;
		throw new Error(errorMessage);
	}
	static createWebSocket(url, protocols) {
		return new (this.getWebSocketConstructor())(url, protocols);
	}
	static isWebSocketSupported() {
		try {
			const env = this.detectEnvironment();
			return env.type === "native" || env.type === "ws";
		} catch (_a) {
			return false;
		}
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/lib/constants.js
var DEFAULT_VERSION = `realtime-js/2.75.1`;
var VSN = "1.0.0";
var DEFAULT_TIMEOUT = 1e4;
var SOCKET_STATES;
(function(SOCKET_STATES) {
	SOCKET_STATES[SOCKET_STATES["connecting"] = 0] = "connecting";
	SOCKET_STATES[SOCKET_STATES["open"] = 1] = "open";
	SOCKET_STATES[SOCKET_STATES["closing"] = 2] = "closing";
	SOCKET_STATES[SOCKET_STATES["closed"] = 3] = "closed";
})(SOCKET_STATES || (SOCKET_STATES = {}));
var CHANNEL_STATES;
(function(CHANNEL_STATES) {
	CHANNEL_STATES["closed"] = "closed";
	CHANNEL_STATES["errored"] = "errored";
	CHANNEL_STATES["joined"] = "joined";
	CHANNEL_STATES["joining"] = "joining";
	CHANNEL_STATES["leaving"] = "leaving";
})(CHANNEL_STATES || (CHANNEL_STATES = {}));
var CHANNEL_EVENTS;
(function(CHANNEL_EVENTS) {
	CHANNEL_EVENTS["close"] = "phx_close";
	CHANNEL_EVENTS["error"] = "phx_error";
	CHANNEL_EVENTS["join"] = "phx_join";
	CHANNEL_EVENTS["reply"] = "phx_reply";
	CHANNEL_EVENTS["leave"] = "phx_leave";
	CHANNEL_EVENTS["access_token"] = "access_token";
})(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
var TRANSPORTS;
(function(TRANSPORTS) {
	TRANSPORTS["websocket"] = "websocket";
})(TRANSPORTS || (TRANSPORTS = {}));
var CONNECTION_STATE;
(function(CONNECTION_STATE) {
	CONNECTION_STATE["Connecting"] = "connecting";
	CONNECTION_STATE["Open"] = "open";
	CONNECTION_STATE["Closing"] = "closing";
	CONNECTION_STATE["Closed"] = "closed";
})(CONNECTION_STATE || (CONNECTION_STATE = {}));
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
var Serializer = class {
	constructor() {
		this.HEADER_LENGTH = 1;
	}
	decode(rawPayload, callback) {
		if (rawPayload.constructor === ArrayBuffer) return callback(this._binaryDecode(rawPayload));
		if (typeof rawPayload === "string") return callback(JSON.parse(rawPayload));
		return callback({});
	}
	_binaryDecode(buffer) {
		const view = new DataView(buffer);
		const decoder = new TextDecoder();
		return this._decodeBroadcast(buffer, view, decoder);
	}
	_decodeBroadcast(buffer, view, decoder) {
		const topicSize = view.getUint8(1);
		const eventSize = view.getUint8(2);
		let offset = this.HEADER_LENGTH + 2;
		const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
		offset = offset + topicSize;
		const event = decoder.decode(buffer.slice(offset, offset + eventSize));
		offset = offset + eventSize;
		return {
			ref: null,
			topic,
			event,
			payload: JSON.parse(decoder.decode(buffer.slice(offset, buffer.byteLength)))
		};
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/lib/timer.js
/**
* Creates a timer that accepts a `timerCalc` function to perform calculated timeout retries, such as exponential backoff.
*
* @example
*    let reconnectTimer = new Timer(() => this.connect(), function(tries){
*      return [1000, 5000, 10000][tries - 1] || 10000
*    })
*    reconnectTimer.scheduleTimeout() // fires after 1000
*    reconnectTimer.scheduleTimeout() // fires after 5000
*    reconnectTimer.reset()
*    reconnectTimer.scheduleTimeout() // fires after 1000
*/
var Timer = class {
	constructor(callback, timerCalc) {
		this.callback = callback;
		this.timerCalc = timerCalc;
		this.timer = void 0;
		this.tries = 0;
		this.callback = callback;
		this.timerCalc = timerCalc;
	}
	reset() {
		this.tries = 0;
		clearTimeout(this.timer);
		this.timer = void 0;
	}
	scheduleTimeout() {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			this.tries = this.tries + 1;
			this.callback();
		}, this.timerCalc(this.tries + 1));
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
/**
* Helpers to convert the change Payload into native JS types.
*/
var PostgresTypes;
(function(PostgresTypes) {
	PostgresTypes["abstime"] = "abstime";
	PostgresTypes["bool"] = "bool";
	PostgresTypes["date"] = "date";
	PostgresTypes["daterange"] = "daterange";
	PostgresTypes["float4"] = "float4";
	PostgresTypes["float8"] = "float8";
	PostgresTypes["int2"] = "int2";
	PostgresTypes["int4"] = "int4";
	PostgresTypes["int4range"] = "int4range";
	PostgresTypes["int8"] = "int8";
	PostgresTypes["int8range"] = "int8range";
	PostgresTypes["json"] = "json";
	PostgresTypes["jsonb"] = "jsonb";
	PostgresTypes["money"] = "money";
	PostgresTypes["numeric"] = "numeric";
	PostgresTypes["oid"] = "oid";
	PostgresTypes["reltime"] = "reltime";
	PostgresTypes["text"] = "text";
	PostgresTypes["time"] = "time";
	PostgresTypes["timestamp"] = "timestamp";
	PostgresTypes["timestamptz"] = "timestamptz";
	PostgresTypes["timetz"] = "timetz";
	PostgresTypes["tsrange"] = "tsrange";
	PostgresTypes["tstzrange"] = "tstzrange";
})(PostgresTypes || (PostgresTypes = {}));
/**
* Takes an array of columns and an object of string values then converts each string value
* to its mapped type.
*
* @param {{name: String, type: String}[]} columns
* @param {Object} record
* @param {Object} options The map of various options that can be applied to the mapper
* @param {Array} options.skipTypes The array of types that should not be converted
*
* @example convertChangeData([{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], {first_name: 'Paul', age:'33'}, {})
* //=>{ first_name: 'Paul', age: 33 }
*/
var convertChangeData = (columns, record, options = {}) => {
	var _a;
	const skipTypes = (_a = options.skipTypes) !== null && _a !== void 0 ? _a : [];
	if (!record) return {};
	return Object.keys(record).reduce((acc, rec_key) => {
		acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
		return acc;
	}, {});
};
/**
* Converts the value of an individual column.
*
* @param {String} columnName The column that you want to convert
* @param {{name: String, type: String}[]} columns All of the columns
* @param {Object} record The map of string values
* @param {Array} skipTypes An array of types that should not be converted
* @return {object} Useless information
*
* @example convertColumn('age', [{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], {first_name: 'Paul', age: '33'}, [])
* //=> 33
* @example convertColumn('age', [{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], {first_name: 'Paul', age: '33'}, ['int4'])
* //=> "33"
*/
var convertColumn = (columnName, columns, record, skipTypes) => {
	const column = columns.find((x) => x.name === columnName);
	const colType = column === null || column === void 0 ? void 0 : column.type;
	const value = record[columnName];
	if (colType && !skipTypes.includes(colType)) return convertCell(colType, value);
	return noop$1(value);
};
/**
* If the value of the cell is `null`, returns null.
* Otherwise converts the string value to the correct type.
* @param {String} type A postgres column type
* @param {String} value The cell value
*
* @example convertCell('bool', 't')
* //=> true
* @example convertCell('int8', '10')
* //=> 10
* @example convertCell('_int4', '{1,2,3,4}')
* //=> [1,2,3,4]
*/
var convertCell = (type, value) => {
	if (type.charAt(0) === "_") return toArray(value, type.slice(1, type.length));
	switch (type) {
		case PostgresTypes.bool: return toBoolean(value);
		case PostgresTypes.float4:
		case PostgresTypes.float8:
		case PostgresTypes.int2:
		case PostgresTypes.int4:
		case PostgresTypes.int8:
		case PostgresTypes.numeric:
		case PostgresTypes.oid: return toNumber(value);
		case PostgresTypes.json:
		case PostgresTypes.jsonb: return toJson(value);
		case PostgresTypes.timestamp: return toTimestampString(value);
		case PostgresTypes.abstime:
		case PostgresTypes.date:
		case PostgresTypes.daterange:
		case PostgresTypes.int4range:
		case PostgresTypes.int8range:
		case PostgresTypes.money:
		case PostgresTypes.reltime:
		case PostgresTypes.text:
		case PostgresTypes.time:
		case PostgresTypes.timestamptz:
		case PostgresTypes.timetz:
		case PostgresTypes.tsrange:
		case PostgresTypes.tstzrange: return noop$1(value);
		default: return noop$1(value);
	}
};
var noop$1 = (value) => {
	return value;
};
var toBoolean = (value) => {
	switch (value) {
		case "t": return true;
		case "f": return false;
		default: return value;
	}
};
var toNumber = (value) => {
	if (typeof value === "string") {
		const parsedValue = parseFloat(value);
		if (!Number.isNaN(parsedValue)) return parsedValue;
	}
	return value;
};
var toJson = (value) => {
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch (error) {
		console.log(`JSON parse error: ${error}`);
		return value;
	}
	return value;
};
/**
* Converts a Postgres Array into a native JS array
*
* @example toArray('{}', 'int4')
* //=> []
* @example toArray('{"[2021-01-01,2021-12-31)","(2021-01-01,2021-12-32]"}', 'daterange')
* //=> ['[2021-01-01,2021-12-31)', '(2021-01-01,2021-12-32]']
* @example toArray([1,2,3,4], 'int4')
* //=> [1,2,3,4]
*/
var toArray = (value, type) => {
	if (typeof value !== "string") return value;
	const lastIdx = value.length - 1;
	const closeBrace = value[lastIdx];
	if (value[0] === "{" && closeBrace === "}") {
		let arr;
		const valTrim = value.slice(1, lastIdx);
		try {
			arr = JSON.parse("[" + valTrim + "]");
		} catch (_) {
			arr = valTrim ? valTrim.split(",") : [];
		}
		return arr.map((val) => convertCell(type, val));
	}
	return value;
};
/**
* Fixes timestamp to be ISO-8601. Swaps the space between the date and time for a 'T'
* See https://github.com/supabase/supabase/issues/18
*
* @example toTimestampString('2019-09-10 00:00:00')
* //=> '2019-09-10T00:00:00'
*/
var toTimestampString = (value) => {
	if (typeof value === "string") return value.replace(" ", "T");
	return value;
};
var httpEndpointURL = (socketUrl) => {
	let url = socketUrl;
	url = url.replace(/^ws/i, "http");
	url = url.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, "");
	return url.replace(/\/+$/, "") + "/api/broadcast";
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/lib/push.js
var Push = class {
	/**
	* Initializes the Push
	*
	* @param channel The Channel
	* @param event The event, for example `"phx_join"`
	* @param payload The payload, for example `{user_id: 123}`
	* @param timeout The push timeout in milliseconds
	*/
	constructor(channel, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
		this.channel = channel;
		this.event = event;
		this.payload = payload;
		this.timeout = timeout;
		this.sent = false;
		this.timeoutTimer = void 0;
		this.ref = "";
		this.receivedResp = null;
		this.recHooks = [];
		this.refEvent = null;
	}
	resend(timeout) {
		this.timeout = timeout;
		this._cancelRefEvent();
		this.ref = "";
		this.refEvent = null;
		this.receivedResp = null;
		this.sent = false;
		this.send();
	}
	send() {
		if (this._hasReceived("timeout")) return;
		this.startTimeout();
		this.sent = true;
		this.channel.socket.push({
			topic: this.channel.topic,
			event: this.event,
			payload: this.payload,
			ref: this.ref,
			join_ref: this.channel._joinRef()
		});
	}
	updatePayload(payload) {
		this.payload = Object.assign(Object.assign({}, this.payload), payload);
	}
	receive(status, callback) {
		var _a;
		if (this._hasReceived(status)) callback((_a = this.receivedResp) === null || _a === void 0 ? void 0 : _a.response);
		this.recHooks.push({
			status,
			callback
		});
		return this;
	}
	startTimeout() {
		if (this.timeoutTimer) return;
		this.ref = this.channel.socket._makeRef();
		this.refEvent = this.channel._replyEventName(this.ref);
		const callback = (payload) => {
			this._cancelRefEvent();
			this._cancelTimeout();
			this.receivedResp = payload;
			this._matchReceive(payload);
		};
		this.channel._on(this.refEvent, {}, callback);
		this.timeoutTimer = setTimeout(() => {
			this.trigger("timeout", {});
		}, this.timeout);
	}
	trigger(status, response) {
		if (this.refEvent) this.channel._trigger(this.refEvent, {
			status,
			response
		});
	}
	destroy() {
		this._cancelRefEvent();
		this._cancelTimeout();
	}
	_cancelRefEvent() {
		if (!this.refEvent) return;
		this.channel._off(this.refEvent, {});
	}
	_cancelTimeout() {
		clearTimeout(this.timeoutTimer);
		this.timeoutTimer = void 0;
	}
	_matchReceive({ status, response }) {
		this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
	}
	_hasReceived(status) {
		return this.receivedResp && this.receivedResp.status === status;
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
var REALTIME_PRESENCE_LISTEN_EVENTS;
(function(REALTIME_PRESENCE_LISTEN_EVENTS) {
	REALTIME_PRESENCE_LISTEN_EVENTS["SYNC"] = "sync";
	REALTIME_PRESENCE_LISTEN_EVENTS["JOIN"] = "join";
	REALTIME_PRESENCE_LISTEN_EVENTS["LEAVE"] = "leave";
})(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
var RealtimePresence = class RealtimePresence {
	/**
	* Initializes the Presence.
	*
	* @param channel - The RealtimeChannel
	* @param opts - The options,
	*        for example `{events: {state: 'state', diff: 'diff'}}`
	*/
	constructor(channel, opts) {
		this.channel = channel;
		this.state = {};
		this.pendingDiffs = [];
		this.joinRef = null;
		this.enabled = false;
		this.caller = {
			onJoin: () => {},
			onLeave: () => {},
			onSync: () => {}
		};
		const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
			state: "presence_state",
			diff: "presence_diff"
		};
		this.channel._on(events.state, {}, (newState) => {
			const { onJoin, onLeave, onSync } = this.caller;
			this.joinRef = this.channel._joinRef();
			this.state = RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
			this.pendingDiffs.forEach((diff) => {
				this.state = RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
			});
			this.pendingDiffs = [];
			onSync();
		});
		this.channel._on(events.diff, {}, (diff) => {
			const { onJoin, onLeave, onSync } = this.caller;
			if (this.inPendingSyncState()) this.pendingDiffs.push(diff);
			else {
				this.state = RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
				onSync();
			}
		});
		this.onJoin((key, currentPresences, newPresences) => {
			this.channel._trigger("presence", {
				event: "join",
				key,
				currentPresences,
				newPresences
			});
		});
		this.onLeave((key, currentPresences, leftPresences) => {
			this.channel._trigger("presence", {
				event: "leave",
				key,
				currentPresences,
				leftPresences
			});
		});
		this.onSync(() => {
			this.channel._trigger("presence", { event: "sync" });
		});
	}
	/**
	* Used to sync the list of presences on the server with the
	* client's state.
	*
	* An optional `onJoin` and `onLeave` callback can be provided to
	* react to changes in the client's local presences across
	* disconnects and reconnects with the server.
	*
	* @internal
	*/
	static syncState(currentState, newState, onJoin, onLeave) {
		const state = this.cloneDeep(currentState);
		const transformedState = this.transformState(newState);
		const joins = {};
		const leaves = {};
		this.map(state, (key, presences) => {
			if (!transformedState[key]) leaves[key] = presences;
		});
		this.map(transformedState, (key, newPresences) => {
			const currentPresences = state[key];
			if (currentPresences) {
				const newPresenceRefs = newPresences.map((m) => m.presence_ref);
				const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
				const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
				const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
				if (joinedPresences.length > 0) joins[key] = joinedPresences;
				if (leftPresences.length > 0) leaves[key] = leftPresences;
			} else joins[key] = newPresences;
		});
		return this.syncDiff(state, {
			joins,
			leaves
		}, onJoin, onLeave);
	}
	/**
	* Used to sync a diff of presence join and leave events from the
	* server, as they happen.
	*
	* Like `syncState`, `syncDiff` accepts optional `onJoin` and
	* `onLeave` callbacks to react to a user joining or leaving from a
	* device.
	*
	* @internal
	*/
	static syncDiff(state, diff, onJoin, onLeave) {
		const { joins, leaves } = {
			joins: this.transformState(diff.joins),
			leaves: this.transformState(diff.leaves)
		};
		if (!onJoin) onJoin = () => {};
		if (!onLeave) onLeave = () => {};
		this.map(joins, (key, newPresences) => {
			var _a;
			const currentPresences = (_a = state[key]) !== null && _a !== void 0 ? _a : [];
			state[key] = this.cloneDeep(newPresences);
			if (currentPresences.length > 0) {
				const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
				const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
				state[key].unshift(...curPresences);
			}
			onJoin(key, currentPresences, newPresences);
		});
		this.map(leaves, (key, leftPresences) => {
			let currentPresences = state[key];
			if (!currentPresences) return;
			const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
			currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
			state[key] = currentPresences;
			onLeave(key, currentPresences, leftPresences);
			if (currentPresences.length === 0) delete state[key];
		});
		return state;
	}
	/** @internal */
	static map(obj, func) {
		return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
	}
	/**
	* Remove 'metas' key
	* Change 'phx_ref' to 'presence_ref'
	* Remove 'phx_ref' and 'phx_ref_prev'
	*
	* @example
	* // returns {
	*  abc123: [
	*    { presence_ref: '2', user_id: 1 },
	*    { presence_ref: '3', user_id: 2 }
	*  ]
	* }
	* RealtimePresence.transformState({
	*  abc123: {
	*    metas: [
	*      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
	*      { phx_ref: '3', user_id: 2 }
	*    ]
	*  }
	* })
	*
	* @internal
	*/
	static transformState(state) {
		state = this.cloneDeep(state);
		return Object.getOwnPropertyNames(state).reduce((newState, key) => {
			const presences = state[key];
			if ("metas" in presences) newState[key] = presences.metas.map((presence) => {
				presence["presence_ref"] = presence["phx_ref"];
				delete presence["phx_ref"];
				delete presence["phx_ref_prev"];
				return presence;
			});
			else newState[key] = presences;
			return newState;
		}, {});
	}
	/** @internal */
	static cloneDeep(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	/** @internal */
	onJoin(callback) {
		this.caller.onJoin = callback;
	}
	/** @internal */
	onLeave(callback) {
		this.caller.onLeave = callback;
	}
	/** @internal */
	onSync(callback) {
		this.caller.onSync = callback;
	}
	/** @internal */
	inPendingSyncState() {
		return !this.joinRef || this.joinRef !== this.channel._joinRef();
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js
var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
(function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT) {
	REALTIME_POSTGRES_CHANGES_LISTEN_EVENT["ALL"] = "*";
	REALTIME_POSTGRES_CHANGES_LISTEN_EVENT["INSERT"] = "INSERT";
	REALTIME_POSTGRES_CHANGES_LISTEN_EVENT["UPDATE"] = "UPDATE";
	REALTIME_POSTGRES_CHANGES_LISTEN_EVENT["DELETE"] = "DELETE";
})(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
var REALTIME_LISTEN_TYPES;
(function(REALTIME_LISTEN_TYPES) {
	REALTIME_LISTEN_TYPES["BROADCAST"] = "broadcast";
	REALTIME_LISTEN_TYPES["PRESENCE"] = "presence";
	REALTIME_LISTEN_TYPES["POSTGRES_CHANGES"] = "postgres_changes";
	REALTIME_LISTEN_TYPES["SYSTEM"] = "system";
})(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
var REALTIME_SUBSCRIBE_STATES;
(function(REALTIME_SUBSCRIBE_STATES) {
	REALTIME_SUBSCRIBE_STATES["SUBSCRIBED"] = "SUBSCRIBED";
	REALTIME_SUBSCRIBE_STATES["TIMED_OUT"] = "TIMED_OUT";
	REALTIME_SUBSCRIBE_STATES["CLOSED"] = "CLOSED";
	REALTIME_SUBSCRIBE_STATES["CHANNEL_ERROR"] = "CHANNEL_ERROR";
})(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
/** A channel is the basic building block of Realtime
* and narrows the scope of data flow to subscribed clients.
* You can think of a channel as a chatroom where participants are able to see who's online
* and send and receive messages.
*/
var RealtimeChannel = class RealtimeChannel {
	constructor(topic, params = { config: {} }, socket) {
		var _a, _b;
		this.topic = topic;
		this.params = params;
		this.socket = socket;
		this.bindings = {};
		this.state = CHANNEL_STATES.closed;
		this.joinedOnce = false;
		this.pushBuffer = [];
		this.subTopic = topic.replace(/^realtime:/i, "");
		this.params.config = Object.assign({
			broadcast: {
				ack: false,
				self: false
			},
			presence: {
				key: "",
				enabled: false
			},
			private: false
		}, params.config);
		this.timeout = this.socket.timeout;
		this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
		this.rejoinTimer = new Timer(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs);
		this.joinPush.receive("ok", () => {
			this.state = CHANNEL_STATES.joined;
			this.rejoinTimer.reset();
			this.pushBuffer.forEach((pushEvent) => pushEvent.send());
			this.pushBuffer = [];
		});
		this._onClose(() => {
			this.rejoinTimer.reset();
			this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`);
			this.state = CHANNEL_STATES.closed;
			this.socket._remove(this);
		});
		this._onError((reason) => {
			if (this._isLeaving() || this._isClosed()) return;
			this.socket.log("channel", `error ${this.topic}`, reason);
			this.state = CHANNEL_STATES.errored;
			this.rejoinTimer.scheduleTimeout();
		});
		this.joinPush.receive("timeout", () => {
			if (!this._isJoining()) return;
			this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
			this.state = CHANNEL_STATES.errored;
			this.rejoinTimer.scheduleTimeout();
		});
		this.joinPush.receive("error", (reason) => {
			if (this._isLeaving() || this._isClosed()) return;
			this.socket.log("channel", `error ${this.topic}`, reason);
			this.state = CHANNEL_STATES.errored;
			this.rejoinTimer.scheduleTimeout();
		});
		this._on(CHANNEL_EVENTS.reply, {}, (payload, ref) => {
			this._trigger(this._replyEventName(ref), payload);
		});
		this.presence = new RealtimePresence(this);
		this.broadcastEndpointURL = httpEndpointURL(this.socket.endPoint);
		this.private = this.params.config.private || false;
		if (!this.private && ((_b = (_a = this.params.config) === null || _a === void 0 ? void 0 : _a.broadcast) === null || _b === void 0 ? void 0 : _b.replay)) throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
	}
	/** Subscribe registers your client with the server */
	subscribe(callback, timeout = this.timeout) {
		var _a, _b, _c;
		if (!this.socket.isConnected()) this.socket.connect();
		if (this.state == CHANNEL_STATES.closed) {
			const { config: { broadcast, presence, private: isPrivate } } = this.params;
			const postgres_changes = (_b = (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [];
			const presence_enabled = !!this.bindings[REALTIME_LISTEN_TYPES.PRESENCE] && this.bindings[REALTIME_LISTEN_TYPES.PRESENCE].length > 0 || ((_c = this.params.config.presence) === null || _c === void 0 ? void 0 : _c.enabled) === true;
			const accessTokenPayload = {};
			const config = {
				broadcast,
				presence: Object.assign(Object.assign({}, presence), { enabled: presence_enabled }),
				postgres_changes,
				private: isPrivate
			};
			if (this.socket.accessTokenValue) accessTokenPayload.access_token = this.socket.accessTokenValue;
			this._onError((e) => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, e));
			this._onClose(() => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CLOSED));
			this.updateJoinPayload(Object.assign({ config }, accessTokenPayload));
			this.joinedOnce = true;
			this._rejoin(timeout);
			this.joinPush.receive("ok", async ({ postgres_changes }) => {
				var _a;
				this.socket.setAuth();
				if (postgres_changes === void 0) {
					callback === null || callback === void 0 || callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
					return;
				} else {
					const clientPostgresBindings = this.bindings.postgres_changes;
					const bindingsLen = (_a = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a !== void 0 ? _a : 0;
					const newPostgresBindings = [];
					for (let i = 0; i < bindingsLen; i++) {
						const clientPostgresBinding = clientPostgresBindings[i];
						const { filter: { event, schema, table, filter } } = clientPostgresBinding;
						const serverPostgresFilter = postgres_changes && postgres_changes[i];
						if (serverPostgresFilter && serverPostgresFilter.event === event && serverPostgresFilter.schema === schema && serverPostgresFilter.table === table && serverPostgresFilter.filter === filter) newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
						else {
							this.unsubscribe();
							this.state = CHANNEL_STATES.errored;
							callback === null || callback === void 0 || callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, /* @__PURE__ */ new Error("mismatch between server and client bindings for postgres changes"));
							return;
						}
					}
					this.bindings.postgres_changes = newPostgresBindings;
					callback && callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
					return;
				}
			}).receive("error", (error) => {
				this.state = CHANNEL_STATES.errored;
				callback === null || callback === void 0 || callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(error).join(", ") || "error")));
			}).receive("timeout", () => {
				callback === null || callback === void 0 || callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
			});
		}
		return this;
	}
	presenceState() {
		return this.presence.state;
	}
	async track(payload, opts = {}) {
		return await this.send({
			type: "presence",
			event: "track",
			payload
		}, opts.timeout || this.timeout);
	}
	async untrack(opts = {}) {
		return await this.send({
			type: "presence",
			event: "untrack"
		}, opts);
	}
	on(type, filter, callback) {
		if (this.state === CHANNEL_STATES.joined && type === REALTIME_LISTEN_TYPES.PRESENCE) {
			this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`);
			this.unsubscribe().then(() => this.subscribe());
		}
		return this._on(type, filter, callback);
	}
	/**
	* Sends a message into the channel.
	*
	* @param args Arguments to send to channel
	* @param args.type The type of event to send
	* @param args.event The name of the event being sent
	* @param args.payload Payload to be sent
	* @param opts Options to be used during the send process
	*/
	async send(args, opts = {}) {
		var _a, _b;
		if (!this._canPush() && args.type === "broadcast") {
			const { event, payload: endpoint_payload } = args;
			const options = {
				method: "POST",
				headers: {
					Authorization: this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "",
					apikey: this.socket.apiKey ? this.socket.apiKey : "",
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ messages: [{
					topic: this.subTopic,
					event,
					payload: endpoint_payload,
					private: this.private
				}] })
			};
			try {
				const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
				await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
				return response.ok ? "ok" : "error";
			} catch (error) {
				if (error.name === "AbortError") return "timed out";
				else return "error";
			}
		} else return new Promise((resolve) => {
			var _a, _b, _c;
			const push = this._push(args.type, args, opts.timeout || this.timeout);
			if (args.type === "broadcast" && !((_c = (_b = (_a = this.params) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) resolve("ok");
			push.receive("ok", () => resolve("ok"));
			push.receive("error", () => resolve("error"));
			push.receive("timeout", () => resolve("timed out"));
		});
	}
	updateJoinPayload(payload) {
		this.joinPush.updatePayload(payload);
	}
	/**
	* Leaves the channel.
	*
	* Unsubscribes from server events, and instructs channel to terminate on server.
	* Triggers onClose() hooks.
	*
	* To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
	* channel.unsubscribe().receive("ok", () => alert("left!") )
	*/
	unsubscribe(timeout = this.timeout) {
		this.state = CHANNEL_STATES.leaving;
		const onClose = () => {
			this.socket.log("channel", `leave ${this.topic}`);
			this._trigger(CHANNEL_EVENTS.close, "leave", this._joinRef());
		};
		this.joinPush.destroy();
		let leavePush = null;
		return new Promise((resolve) => {
			leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
			leavePush.receive("ok", () => {
				onClose();
				resolve("ok");
			}).receive("timeout", () => {
				onClose();
				resolve("timed out");
			}).receive("error", () => {
				resolve("error");
			});
			leavePush.send();
			if (!this._canPush()) leavePush.trigger("ok", {});
		}).finally(() => {
			leavePush === null || leavePush === void 0 || leavePush.destroy();
		});
	}
	/**
	* Teardown the channel.
	*
	* Destroys and stops related timers.
	*/
	teardown() {
		this.pushBuffer.forEach((push) => push.destroy());
		this.pushBuffer = [];
		this.rejoinTimer.reset();
		this.joinPush.destroy();
		this.state = CHANNEL_STATES.closed;
		this.bindings = {};
	}
	/** @internal */
	async _fetchWithTimeout(url, options, timeout) {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);
		const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
		clearTimeout(id);
		return response;
	}
	/** @internal */
	_push(event, payload, timeout = this.timeout) {
		if (!this.joinedOnce) throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
		let pushEvent = new Push(this, event, payload, timeout);
		if (this._canPush()) pushEvent.send();
		else this._addToPushBuffer(pushEvent);
		return pushEvent;
	}
	/** @internal */
	_addToPushBuffer(pushEvent) {
		pushEvent.startTimeout();
		this.pushBuffer.push(pushEvent);
		if (this.pushBuffer.length > 100) {
			const removedPush = this.pushBuffer.shift();
			if (removedPush) {
				removedPush.destroy();
				this.socket.log("channel", `discarded push due to buffer overflow: ${removedPush.event}`, removedPush.payload);
			}
		}
	}
	/**
	* Overridable message hook
	*
	* Receives all events for specialized message handling before dispatching to the channel callbacks.
	* Must return the payload, modified or unmodified.
	*
	* @internal
	*/
	_onMessage(_event, payload, _ref) {
		return payload;
	}
	/** @internal */
	_isMember(topic) {
		return this.topic === topic;
	}
	/** @internal */
	_joinRef() {
		return this.joinPush.ref;
	}
	/** @internal */
	_trigger(type, payload, ref) {
		var _a, _b;
		const typeLower = type.toLocaleLowerCase();
		const { close, error, leave, join } = CHANNEL_EVENTS;
		if (ref && [
			close,
			error,
			leave,
			join
		].indexOf(typeLower) >= 0 && ref !== this._joinRef()) return;
		let handledPayload = this._onMessage(typeLower, payload, ref);
		if (payload && !handledPayload) throw "channel onMessage callbacks must return the payload, modified or unmodified";
		if ([
			"insert",
			"update",
			"delete"
		].includes(typeLower)) (_a = this.bindings.postgres_changes) === null || _a === void 0 || _a.filter((bind) => {
			var _a, _b, _c;
			return ((_a = bind.filter) === null || _a === void 0 ? void 0 : _a.event) === "*" || ((_c = (_b = bind.filter) === null || _b === void 0 ? void 0 : _b.event) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase()) === typeLower;
		}).map((bind) => bind.callback(handledPayload, ref));
		else (_b = this.bindings[typeLower]) === null || _b === void 0 || _b.filter((bind) => {
			var _a, _b, _c, _d, _e, _f;
			if ([
				"broadcast",
				"presence",
				"postgres_changes"
			].includes(typeLower)) {
				if ("id" in bind) {
					const bindId = bind.id;
					const bindEvent = (_a = bind.filter) === null || _a === void 0 ? void 0 : _a.event;
					return bindId && ((_b = payload.ids) === null || _b === void 0 ? void 0 : _b.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_c = payload.data) === null || _c === void 0 ? void 0 : _c.type.toLocaleLowerCase()));
				} else {
					const bindEvent = (_e = (_d = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _d === void 0 ? void 0 : _d.event) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase();
					return bindEvent === "*" || bindEvent === ((_f = payload === null || payload === void 0 ? void 0 : payload.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase());
				}
			} else return bind.type.toLocaleLowerCase() === typeLower;
		}).map((bind) => {
			if (typeof handledPayload === "object" && "ids" in handledPayload) {
				const postgresChanges = handledPayload.data;
				const { schema, table, commit_timestamp, type, errors } = postgresChanges;
				handledPayload = Object.assign(Object.assign({}, {
					schema,
					table,
					commit_timestamp,
					eventType: type,
					new: {},
					old: {},
					errors
				}), this._getPayloadRecords(postgresChanges));
			}
			bind.callback(handledPayload, ref);
		});
	}
	/** @internal */
	_isClosed() {
		return this.state === CHANNEL_STATES.closed;
	}
	/** @internal */
	_isJoined() {
		return this.state === CHANNEL_STATES.joined;
	}
	/** @internal */
	_isJoining() {
		return this.state === CHANNEL_STATES.joining;
	}
	/** @internal */
	_isLeaving() {
		return this.state === CHANNEL_STATES.leaving;
	}
	/** @internal */
	_replyEventName(ref) {
		return `chan_reply_${ref}`;
	}
	/** @internal */
	_on(type, filter, callback) {
		const typeLower = type.toLocaleLowerCase();
		const binding = {
			type: typeLower,
			filter,
			callback
		};
		if (this.bindings[typeLower]) this.bindings[typeLower].push(binding);
		else this.bindings[typeLower] = [binding];
		return this;
	}
	/** @internal */
	_off(type, filter) {
		const typeLower = type.toLocaleLowerCase();
		if (this.bindings[typeLower]) this.bindings[typeLower] = this.bindings[typeLower].filter((bind) => {
			var _a;
			return !(((_a = bind.type) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === typeLower && RealtimeChannel.isEqual(bind.filter, filter));
		});
		return this;
	}
	/** @internal */
	static isEqual(obj1, obj2) {
		if (Object.keys(obj1).length !== Object.keys(obj2).length) return false;
		for (const k in obj1) if (obj1[k] !== obj2[k]) return false;
		return true;
	}
	/** @internal */
	_rejoinUntilConnected() {
		this.rejoinTimer.scheduleTimeout();
		if (this.socket.isConnected()) this._rejoin();
	}
	/**
	* Registers a callback that will be executed when the channel closes.
	*
	* @internal
	*/
	_onClose(callback) {
		this._on(CHANNEL_EVENTS.close, {}, callback);
	}
	/**
	* Registers a callback that will be executed when the channel encounteres an error.
	*
	* @internal
	*/
	_onError(callback) {
		this._on(CHANNEL_EVENTS.error, {}, (reason) => callback(reason));
	}
	/**
	* Returns `true` if the socket is connected and the channel has been joined.
	*
	* @internal
	*/
	_canPush() {
		return this.socket.isConnected() && this._isJoined();
	}
	/** @internal */
	_rejoin(timeout = this.timeout) {
		if (this._isLeaving()) return;
		this.socket._leaveOpenTopic(this.topic);
		this.state = CHANNEL_STATES.joining;
		this.joinPush.resend(timeout);
	}
	/** @internal */
	_getPayloadRecords(payload) {
		const records = {
			new: {},
			old: {}
		};
		if (payload.type === "INSERT" || payload.type === "UPDATE") records.new = convertChangeData(payload.columns, payload.record);
		if (payload.type === "UPDATE" || payload.type === "DELETE") records.old = convertChangeData(payload.columns, payload.old_record);
		return records;
	}
};
//#endregion
//#region node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js
var noop = () => {};
var CONNECTION_TIMEOUTS = {
	HEARTBEAT_INTERVAL: 25e3,
	RECONNECT_DELAY: 10,
	HEARTBEAT_TIMEOUT_FALLBACK: 100
};
var RECONNECT_INTERVALS = [
	1e3,
	2e3,
	5e3,
	1e4
];
var DEFAULT_RECONNECT_FALLBACK = 1e4;
var WORKER_SCRIPT = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
var RealtimeClient = class {
	/**
	* Initializes the Socket.
	*
	* @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
	* @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
	* @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
	* @param options.timeout The default timeout in milliseconds to trigger push timeouts.
	* @param options.params The optional params to pass when connecting.
	* @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
	* @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
	* @param options.heartbeatCallback The optional function to handle heartbeat status.
	* @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
	* @param options.logLevel Sets the log level for Realtime
	* @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
	* @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
	* @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
	* @param options.worker Use Web Worker to set a side flow. Defaults to false.
	* @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
	*/
	constructor(endPoint, options) {
		var _a;
		this.accessTokenValue = null;
		this.apiKey = null;
		this.channels = new Array();
		this.endPoint = "";
		this.httpEndpoint = "";
		/** @deprecated headers cannot be set on websocket connections */
		this.headers = {};
		this.params = {};
		this.timeout = DEFAULT_TIMEOUT;
		this.transport = null;
		this.heartbeatIntervalMs = CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
		this.heartbeatTimer = void 0;
		this.pendingHeartbeatRef = null;
		this.heartbeatCallback = noop;
		this.ref = 0;
		this.reconnectTimer = null;
		this.logger = noop;
		this.conn = null;
		this.sendBuffer = [];
		this.serializer = new Serializer();
		this.stateChangeCallbacks = {
			open: [],
			close: [],
			error: [],
			message: []
		};
		this.accessToken = null;
		this._connectionState = "disconnected";
		this._wasManualDisconnect = false;
		this._authPromise = null;
		/**
		* Use either custom fetch, if provided, or default fetch to make HTTP requests
		*
		* @internal
		*/
		this._resolveFetch = (customFetch) => {
			let _fetch;
			if (customFetch) _fetch = customFetch;
			else if (typeof fetch === "undefined") _fetch = (...args) => import("./@supabase/node-fetch+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then(({ default: fetch }) => fetch(...args)).catch((error) => {
				throw new Error(`Failed to load @supabase/node-fetch: ${error.message}. This is required for HTTP requests in Node.js environments without native fetch.`);
			});
			else _fetch = fetch;
			return (...args) => _fetch(...args);
		};
		if (!((_a = options === null || options === void 0 ? void 0 : options.params) === null || _a === void 0 ? void 0 : _a.apikey)) throw new Error("API key is required to connect to Realtime");
		this.apiKey = options.params.apikey;
		this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
		this.httpEndpoint = httpEndpointURL(endPoint);
		this._initializeOptions(options);
		this._setupReconnectionTimer();
		this.fetch = this._resolveFetch(options === null || options === void 0 ? void 0 : options.fetch);
	}
	/**
	* Connects the socket, unless already connected.
	*/
	connect() {
		if (this.isConnecting() || this.isDisconnecting() || this.conn !== null && this.isConnected()) return;
		this._setConnectionState("connecting");
		this._setAuthSafely("connect");
		if (this.transport) this.conn = new this.transport(this.endpointURL());
		else try {
			this.conn = WebSocketFactory.createWebSocket(this.endpointURL());
		} catch (error) {
			this._setConnectionState("disconnected");
			const errorMessage = error.message;
			if (errorMessage.includes("Node.js")) throw new Error(`${errorMessage}\n\nTo use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
			throw new Error(`WebSocket not available: ${errorMessage}`);
		}
		this._setupConnectionHandlers();
	}
	/**
	* Returns the URL of the websocket.
	* @returns string The URL of the websocket.
	*/
	endpointURL() {
		return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: VSN }));
	}
	/**
	* Disconnects the socket.
	*
	* @param code A numeric status code to send on disconnect.
	* @param reason A custom reason for the disconnect.
	*/
	disconnect(code, reason) {
		if (this.isDisconnecting()) return;
		this._setConnectionState("disconnecting", true);
		if (this.conn) {
			const fallbackTimer = setTimeout(() => {
				this._setConnectionState("disconnected");
			}, 100);
			this.conn.onclose = () => {
				clearTimeout(fallbackTimer);
				this._setConnectionState("disconnected");
			};
			if (code) this.conn.close(code, reason !== null && reason !== void 0 ? reason : "");
			else this.conn.close();
			this._teardownConnection();
		} else this._setConnectionState("disconnected");
	}
	/**
	* Returns all created channels
	*/
	getChannels() {
		return this.channels;
	}
	/**
	* Unsubscribes and removes a single channel
	* @param channel A RealtimeChannel instance
	*/
	async removeChannel(channel) {
		const status = await channel.unsubscribe();
		if (this.channels.length === 0) this.disconnect();
		return status;
	}
	/**
	* Unsubscribes and removes all channels
	*/
	async removeAllChannels() {
		const values_1 = await Promise.all(this.channels.map((channel) => channel.unsubscribe()));
		this.channels = [];
		this.disconnect();
		return values_1;
	}
	/**
	* Logs the message.
	*
	* For customized logging, `this.logger` can be overridden.
	*/
	log(kind, msg, data) {
		this.logger(kind, msg, data);
	}
	/**
	* Returns the current state of the socket.
	*/
	connectionState() {
		switch (this.conn && this.conn.readyState) {
			case SOCKET_STATES.connecting: return CONNECTION_STATE.Connecting;
			case SOCKET_STATES.open: return CONNECTION_STATE.Open;
			case SOCKET_STATES.closing: return CONNECTION_STATE.Closing;
			default: return CONNECTION_STATE.Closed;
		}
	}
	/**
	* Returns `true` is the connection is open.
	*/
	isConnected() {
		return this.connectionState() === CONNECTION_STATE.Open;
	}
	/**
	* Returns `true` if the connection is currently connecting.
	*/
	isConnecting() {
		return this._connectionState === "connecting";
	}
	/**
	* Returns `true` if the connection is currently disconnecting.
	*/
	isDisconnecting() {
		return this._connectionState === "disconnecting";
	}
	channel(topic, params = { config: {} }) {
		const realtimeTopic = `realtime:${topic}`;
		const exists = this.getChannels().find((c) => c.topic === realtimeTopic);
		if (!exists) {
			const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
			this.channels.push(chan);
			return chan;
		} else return exists;
	}
	/**
	* Push out a message if the socket is connected.
	*
	* If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
	*/
	push(data) {
		const { topic, event, payload, ref } = data;
		const callback = () => {
			this.encode(data, (result) => {
				var _a;
				(_a = this.conn) === null || _a === void 0 || _a.send(result);
			});
		};
		this.log("push", `${topic} ${event} (${ref})`, payload);
		if (this.isConnected()) callback();
		else this.sendBuffer.push(callback);
	}
	/**
	* Sets the JWT access token used for channel subscription authorization and Realtime RLS.
	*
	* If param is null it will use the `accessToken` callback function or the token set on the client.
	*
	* On callback used, it will set the value of the token internal to the client.
	*
	* @param token A JWT string to override the token set on the client.
	*/
	async setAuth(token = null) {
		this._authPromise = this._performAuth(token);
		try {
			await this._authPromise;
		} finally {
			this._authPromise = null;
		}
	}
	/**
	* Sends a heartbeat message if the socket is connected.
	*/
	async sendHeartbeat() {
		var _a;
		if (!this.isConnected()) {
			try {
				this.heartbeatCallback("disconnected");
			} catch (e) {
				this.log("error", "error in heartbeat callback", e);
			}
			return;
		}
		if (this.pendingHeartbeatRef) {
			this.pendingHeartbeatRef = null;
			this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
			try {
				this.heartbeatCallback("timeout");
			} catch (e) {
				this.log("error", "error in heartbeat callback", e);
			}
			this._wasManualDisconnect = false;
			(_a = this.conn) === null || _a === void 0 || _a.close(1e3, "heartbeat timeout");
			setTimeout(() => {
				var _a;
				if (!this.isConnected()) (_a = this.reconnectTimer) === null || _a === void 0 || _a.scheduleTimeout();
			}, CONNECTION_TIMEOUTS.HEARTBEAT_TIMEOUT_FALLBACK);
			return;
		}
		this.pendingHeartbeatRef = this._makeRef();
		this.push({
			topic: "phoenix",
			event: "heartbeat",
			payload: {},
			ref: this.pendingHeartbeatRef
		});
		try {
			this.heartbeatCallback("sent");
		} catch (e) {
			this.log("error", "error in heartbeat callback", e);
		}
		this._setAuthSafely("heartbeat");
	}
	onHeartbeat(callback) {
		this.heartbeatCallback = callback;
	}
	/**
	* Flushes send buffer
	*/
	flushSendBuffer() {
		if (this.isConnected() && this.sendBuffer.length > 0) {
			this.sendBuffer.forEach((callback) => callback());
			this.sendBuffer = [];
		}
	}
	/**
	* Return the next message ref, accounting for overflows
	*
	* @internal
	*/
	_makeRef() {
		let newRef = this.ref + 1;
		if (newRef === this.ref) this.ref = 0;
		else this.ref = newRef;
		return this.ref.toString();
	}
	/**
	* Unsubscribe from channels with the specified topic.
	*
	* @internal
	*/
	_leaveOpenTopic(topic) {
		let dupChannel = this.channels.find((c) => c.topic === topic && (c._isJoined() || c._isJoining()));
		if (dupChannel) {
			this.log("transport", `leaving duplicate topic "${topic}"`);
			dupChannel.unsubscribe();
		}
	}
	/**
	* Removes a subscription from the socket.
	*
	* @param channel An open subscription.
	*
	* @internal
	*/
	_remove(channel) {
		this.channels = this.channels.filter((c) => c.topic !== channel.topic);
	}
	/** @internal */
	_onConnMessage(rawMessage) {
		this.decode(rawMessage.data, (msg) => {
			if (msg.topic === "phoenix" && msg.event === "phx_reply") try {
				this.heartbeatCallback(msg.payload.status === "ok" ? "ok" : "error");
			} catch (e) {
				this.log("error", "error in heartbeat callback", e);
			}
			if (msg.ref && msg.ref === this.pendingHeartbeatRef) this.pendingHeartbeatRef = null;
			const { topic, event, payload, ref } = msg;
			const refString = ref ? `(${ref})` : "";
			const status = payload.status || "";
			this.log("receive", `${status} ${topic} ${event} ${refString}`.trim(), payload);
			this.channels.filter((channel) => channel._isMember(topic)).forEach((channel) => channel._trigger(event, payload, ref));
			this._triggerStateCallbacks("message", msg);
		});
	}
	/**
	* Clear specific timer
	* @internal
	*/
	_clearTimer(timer) {
		var _a;
		if (timer === "heartbeat" && this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = void 0;
		} else if (timer === "reconnect") (_a = this.reconnectTimer) === null || _a === void 0 || _a.reset();
	}
	/**
	* Clear all timers
	* @internal
	*/
	_clearAllTimers() {
		this._clearTimer("heartbeat");
		this._clearTimer("reconnect");
	}
	/**
	* Setup connection handlers for WebSocket events
	* @internal
	*/
	_setupConnectionHandlers() {
		if (!this.conn) return;
		if ("binaryType" in this.conn) this.conn.binaryType = "arraybuffer";
		this.conn.onopen = () => this._onConnOpen();
		this.conn.onerror = (error) => this._onConnError(error);
		this.conn.onmessage = (event) => this._onConnMessage(event);
		this.conn.onclose = (event) => this._onConnClose(event);
	}
	/**
	* Teardown connection and cleanup resources
	* @internal
	*/
	_teardownConnection() {
		if (this.conn) {
			this.conn.onopen = null;
			this.conn.onerror = null;
			this.conn.onmessage = null;
			this.conn.onclose = null;
			this.conn = null;
		}
		this._clearAllTimers();
		this.channels.forEach((channel) => channel.teardown());
	}
	/** @internal */
	_onConnOpen() {
		this._setConnectionState("connected");
		this.log("transport", `connected to ${this.endpointURL()}`);
		this.flushSendBuffer();
		this._clearTimer("reconnect");
		if (!this.worker) this._startHeartbeat();
		else if (!this.workerRef) this._startWorkerHeartbeat();
		this._triggerStateCallbacks("open");
	}
	/** @internal */
	_startHeartbeat() {
		this.heartbeatTimer && clearInterval(this.heartbeatTimer);
		this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
	}
	/** @internal */
	_startWorkerHeartbeat() {
		if (this.workerUrl) this.log("worker", `starting worker for from ${this.workerUrl}`);
		else this.log("worker", `starting default worker`);
		const objectUrl = this._workerObjectUrl(this.workerUrl);
		this.workerRef = new Worker(objectUrl);
		this.workerRef.onerror = (error) => {
			this.log("worker", "worker error", error.message);
			this.workerRef.terminate();
		};
		this.workerRef.onmessage = (event) => {
			if (event.data.event === "keepAlive") this.sendHeartbeat();
		};
		this.workerRef.postMessage({
			event: "start",
			interval: this.heartbeatIntervalMs
		});
	}
	/** @internal */
	_onConnClose(event) {
		var _a;
		this._setConnectionState("disconnected");
		this.log("transport", "close", event);
		this._triggerChanError();
		this._clearTimer("heartbeat");
		if (!this._wasManualDisconnect) (_a = this.reconnectTimer) === null || _a === void 0 || _a.scheduleTimeout();
		this._triggerStateCallbacks("close", event);
	}
	/** @internal */
	_onConnError(error) {
		this._setConnectionState("disconnected");
		this.log("transport", `${error}`);
		this._triggerChanError();
		this._triggerStateCallbacks("error", error);
	}
	/** @internal */
	_triggerChanError() {
		this.channels.forEach((channel) => channel._trigger(CHANNEL_EVENTS.error));
	}
	/** @internal */
	_appendParams(url, params) {
		if (Object.keys(params).length === 0) return url;
		return `${url}${url.match(/\?/) ? "&" : "?"}${new URLSearchParams(params)}`;
	}
	_workerObjectUrl(url) {
		let result_url;
		if (url) result_url = url;
		else {
			const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
			result_url = URL.createObjectURL(blob);
		}
		return result_url;
	}
	/**
	* Set connection state with proper state management
	* @internal
	*/
	_setConnectionState(state, manual = false) {
		this._connectionState = state;
		if (state === "connecting") this._wasManualDisconnect = false;
		else if (state === "disconnecting") this._wasManualDisconnect = manual;
	}
	/**
	* Perform the actual auth operation
	* @internal
	*/
	async _performAuth(token = null) {
		let tokenToSend;
		if (token) tokenToSend = token;
		else if (this.accessToken) tokenToSend = await this.accessToken();
		else tokenToSend = this.accessTokenValue;
		if (this.accessTokenValue != tokenToSend) {
			this.accessTokenValue = tokenToSend;
			this.channels.forEach((channel) => {
				const payload = {
					access_token: tokenToSend,
					version: DEFAULT_VERSION
				};
				tokenToSend && channel.updateJoinPayload(payload);
				if (channel.joinedOnce && channel._isJoined()) channel._push(CHANNEL_EVENTS.access_token, { access_token: tokenToSend });
			});
		}
	}
	/**
	* Wait for any in-flight auth operations to complete
	* @internal
	*/
	async _waitForAuthIfNeeded() {
		if (this._authPromise) await this._authPromise;
	}
	/**
	* Safely call setAuth with standardized error handling
	* @internal
	*/
	_setAuthSafely(context = "general") {
		this.setAuth().catch((e) => {
			this.log("error", `error setting auth in ${context}`, e);
		});
	}
	/**
	* Trigger state change callbacks with proper error handling
	* @internal
	*/
	_triggerStateCallbacks(event, data) {
		try {
			this.stateChangeCallbacks[event].forEach((callback) => {
				try {
					callback(data);
				} catch (e) {
					this.log("error", `error in ${event} callback`, e);
				}
			});
		} catch (e) {
			this.log("error", `error triggering ${event} callbacks`, e);
		}
	}
	/**
	* Setup reconnection timer with proper configuration
	* @internal
	*/
	_setupReconnectionTimer() {
		this.reconnectTimer = new Timer(async () => {
			setTimeout(async () => {
				await this._waitForAuthIfNeeded();
				if (!this.isConnected()) this.connect();
			}, CONNECTION_TIMEOUTS.RECONNECT_DELAY);
		}, this.reconnectAfterMs);
	}
	/**
	* Initialize client options with defaults
	* @internal
	*/
	_initializeOptions(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j;
		this.transport = (_a = options === null || options === void 0 ? void 0 : options.transport) !== null && _a !== void 0 ? _a : null;
		this.timeout = (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : DEFAULT_TIMEOUT;
		this.heartbeatIntervalMs = (_c = options === null || options === void 0 ? void 0 : options.heartbeatIntervalMs) !== null && _c !== void 0 ? _c : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
		this.worker = (_d = options === null || options === void 0 ? void 0 : options.worker) !== null && _d !== void 0 ? _d : false;
		this.accessToken = (_e = options === null || options === void 0 ? void 0 : options.accessToken) !== null && _e !== void 0 ? _e : null;
		this.heartbeatCallback = (_f = options === null || options === void 0 ? void 0 : options.heartbeatCallback) !== null && _f !== void 0 ? _f : noop;
		if (options === null || options === void 0 ? void 0 : options.params) this.params = options.params;
		if (options === null || options === void 0 ? void 0 : options.logger) this.logger = options.logger;
		if ((options === null || options === void 0 ? void 0 : options.logLevel) || (options === null || options === void 0 ? void 0 : options.log_level)) {
			this.logLevel = options.logLevel || options.log_level;
			this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel });
		}
		this.reconnectAfterMs = (_g = options === null || options === void 0 ? void 0 : options.reconnectAfterMs) !== null && _g !== void 0 ? _g : ((tries) => {
			return RECONNECT_INTERVALS[tries - 1] || DEFAULT_RECONNECT_FALLBACK;
		});
		this.encode = (_h = options === null || options === void 0 ? void 0 : options.encode) !== null && _h !== void 0 ? _h : ((payload, callback) => {
			return callback(JSON.stringify(payload));
		});
		this.decode = (_j = options === null || options === void 0 ? void 0 : options.decode) !== null && _j !== void 0 ? _j : this.serializer.decode.bind(this.serializer);
		if (this.worker) {
			if (typeof window !== "undefined" && !window.Worker) throw new Error("Web Worker is not supported");
			this.workerUrl = options === null || options === void 0 ? void 0 : options.workerUrl;
		}
	}
};
//#endregion
export { RealtimeClient as t };
