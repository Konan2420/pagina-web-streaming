import { o as __toESM } from "../_runtime.mjs";
import { t as require_lib } from "../_libs/@supabase/node-fetch+[...].mjs";
import { t as PostgrestClient } from "../_libs/supabase__postgrest-js.mjs";
import { t as RealtimeClient } from "../_libs/supabase__realtime-js.mjs";
import { t as StorageClient } from "../_libs/supabase__storage-js.mjs";
import { t as AuthClient } from "../_libs/supabase__auth-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/module-C38Djw8N.js
var import_lib = /* @__PURE__ */ __toESM(require_lib());
var resolveFetch$1 = (customFetch) => {
	let _fetch;
	if (customFetch) _fetch = customFetch;
	else if (typeof fetch === "undefined") _fetch = (...args) => import("../_libs/@supabase/node-fetch+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then(({ default: fetch }) => fetch(...args));
	else _fetch = fetch;
	return (...args) => _fetch(...args);
};
var FunctionsError = class extends Error {
	constructor(message, name = "FunctionsError", context) {
		super(message);
		this.name = name;
		this.context = context;
	}
};
var FunctionsFetchError = class extends FunctionsError {
	constructor(context) {
		super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
	}
};
var FunctionsRelayError = class extends FunctionsError {
	constructor(context) {
		super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
	}
};
var FunctionsHttpError = class extends FunctionsError {
	constructor(context) {
		super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
	}
};
var FunctionRegion;
(function(FunctionRegion) {
	FunctionRegion["Any"] = "any";
	FunctionRegion["ApNortheast1"] = "ap-northeast-1";
	FunctionRegion["ApNortheast2"] = "ap-northeast-2";
	FunctionRegion["ApSouth1"] = "ap-south-1";
	FunctionRegion["ApSoutheast1"] = "ap-southeast-1";
	FunctionRegion["ApSoutheast2"] = "ap-southeast-2";
	FunctionRegion["CaCentral1"] = "ca-central-1";
	FunctionRegion["EuCentral1"] = "eu-central-1";
	FunctionRegion["EuWest1"] = "eu-west-1";
	FunctionRegion["EuWest2"] = "eu-west-2";
	FunctionRegion["EuWest3"] = "eu-west-3";
	FunctionRegion["SaEast1"] = "sa-east-1";
	FunctionRegion["UsEast1"] = "us-east-1";
	FunctionRegion["UsWest1"] = "us-west-1";
	FunctionRegion["UsWest2"] = "us-west-2";
})(FunctionRegion || (FunctionRegion = {}));
var __awaiter$3 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var FunctionsClient = class {
	constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
		this.url = url;
		this.headers = headers;
		this.region = region;
		this.fetch = resolveFetch$1(customFetch);
	}
	/**
	* Updates the authorization header
	* @param token - the new jwt token sent in the authorisation header
	*/
	setAuth(token) {
		this.headers.Authorization = `Bearer ${token}`;
	}
	/**
	* Invokes a function
	* @param functionName - The name of the Function to invoke.
	* @param options - Options for invoking the Function.
	*/
	invoke(functionName_1) {
		return __awaiter$3(this, arguments, void 0, function* (functionName, options = {}) {
			var _a;
			try {
				const { headers, method, body: functionArgs, signal } = options;
				let _headers = {};
				let { region } = options;
				if (!region) region = this.region;
				const url = new URL(`${this.url}/${functionName}`);
				if (region && region !== "any") {
					_headers["x-region"] = region;
					url.searchParams.set("forceFunctionRegion", region);
				}
				let body;
				if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
					if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
						_headers["Content-Type"] = "application/octet-stream";
						body = functionArgs;
					} else if (typeof functionArgs === "string") {
						_headers["Content-Type"] = "text/plain";
						body = functionArgs;
					} else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) body = functionArgs;
					else {
						_headers["Content-Type"] = "application/json";
						body = JSON.stringify(functionArgs);
					}
				}
				const response = yield this.fetch(url.toString(), {
					method: method || "POST",
					headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
					body,
					signal
				}).catch((fetchError) => {
					if (fetchError.name === "AbortError") throw fetchError;
					throw new FunctionsFetchError(fetchError);
				});
				const isRelayError = response.headers.get("x-relay-error");
				if (isRelayError && isRelayError === "true") throw new FunctionsRelayError(response);
				if (!response.ok) throw new FunctionsHttpError(response);
				let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim();
				let data;
				if (responseType === "application/json") data = yield response.json();
				else if (responseType === "application/octet-stream") data = yield response.blob();
				else if (responseType === "text/event-stream") data = response;
				else if (responseType === "multipart/form-data") data = yield response.formData();
				else data = yield response.text();
				return {
					data,
					error: null,
					response
				};
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return {
					data: null,
					error: new FunctionsFetchError(error)
				};
				return {
					data: null,
					error,
					response: error instanceof FunctionsHttpError || error instanceof FunctionsRelayError ? error.context : void 0
				};
			}
		});
	}
};
var version = "2.75.1";
var JS_ENV = "";
if (typeof Deno !== "undefined") JS_ENV = "deno";
else if (typeof document !== "undefined") JS_ENV = "web";
else if (typeof navigator !== "undefined" && navigator.product === "ReactNative") JS_ENV = "react-native";
else JS_ENV = "node";
var DEFAULT_GLOBAL_OPTIONS = { headers: { "X-Client-Info": `supabase-js-${JS_ENV}/${version}` } };
var DEFAULT_DB_OPTIONS = { schema: "public" };
var DEFAULT_AUTH_OPTIONS = {
	autoRefreshToken: true,
	persistSession: true,
	detectSessionInUrl: true,
	flowType: "implicit"
};
var DEFAULT_REALTIME_OPTIONS = {};
var __awaiter$2 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var resolveFetch = (customFetch) => {
	let _fetch;
	if (customFetch) _fetch = customFetch;
	else if (typeof fetch === "undefined") _fetch = import_lib.default;
	else _fetch = fetch;
	return (...args) => _fetch(...args);
};
var resolveHeadersConstructor = () => {
	if (typeof Headers === "undefined") return import_lib.Headers;
	return Headers;
};
var fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
	const fetch = resolveFetch(customFetch);
	const HeadersConstructor = resolveHeadersConstructor();
	return (input, init) => __awaiter$2(void 0, void 0, void 0, function* () {
		var _a;
		const accessToken = (_a = yield getAccessToken()) !== null && _a !== void 0 ? _a : supabaseKey;
		let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
		if (!headers.has("apikey")) headers.set("apikey", supabaseKey);
		if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
		return fetch(input, Object.assign(Object.assign({}, init), { headers }));
	});
};
var __awaiter$1 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
function ensureTrailingSlash(url) {
	return url.endsWith("/") ? url : url + "/";
}
function applySettingDefaults(options, defaults) {
	var _a, _b;
	const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
	const { db: DEFAULT_DB_OPTIONS, auth: DEFAULT_AUTH_OPTIONS, realtime: DEFAULT_REALTIME_OPTIONS, global: DEFAULT_GLOBAL_OPTIONS } = defaults;
	const result = {
		db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS), dbOptions),
		auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), authOptions),
		realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS), realtimeOptions),
		storage: {},
		global: Object.assign(Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS), globalOptions), { headers: Object.assign(Object.assign({}, (_a = DEFAULT_GLOBAL_OPTIONS === null || DEFAULT_GLOBAL_OPTIONS === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS.headers) !== null && _a !== void 0 ? _a : {}), (_b = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _b !== void 0 ? _b : {}) }),
		accessToken: () => __awaiter$1(this, void 0, void 0, function* () {
			return "";
		})
	};
	if (options.accessToken) result.accessToken = options.accessToken;
	else delete result.accessToken;
	return result;
}
/**
* Validates a Supabase client URL
*
* @param {string} supabaseUrl - The Supabase client URL string.
* @returns {URL} - The validated base URL.
* @throws {Error}
*/
function validateSupabaseUrl(supabaseUrl) {
	const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
	if (!trimmedUrl) throw new Error("supabaseUrl is required.");
	if (!trimmedUrl.match(/^https?:\/\//i)) throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
	try {
		return new URL(ensureTrailingSlash(trimmedUrl));
	} catch (_a) {
		throw Error("Invalid supabaseUrl: Provided URL is malformed.");
	}
}
var SupabaseAuthClient = class extends AuthClient {
	constructor(options) {
		super(options);
	}
};
var __awaiter = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
/**
* Supabase Client.
*
* An isomorphic Javascript client for interacting with Postgres.
*/
var SupabaseClient = class {
	/**
	* Create a new client for use in the browser.
	* @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
	* @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
	* @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
	* @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
	* @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
	* @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
	* @param options.realtime Options passed along to realtime-js constructor.
	* @param options.storage Options passed along to the storage-js constructor.
	* @param options.global.fetch A custom fetch implementation.
	* @param options.global.headers Any additional headers to send with each network request.
	*/
	constructor(supabaseUrl, supabaseKey, options) {
		var _a, _b, _c;
		this.supabaseUrl = supabaseUrl;
		this.supabaseKey = supabaseKey;
		const baseUrl = validateSupabaseUrl(supabaseUrl);
		if (!supabaseKey) throw new Error("supabaseKey is required.");
		this.realtimeUrl = new URL("realtime/v1", baseUrl);
		this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
		this.authUrl = new URL("auth/v1", baseUrl);
		this.storageUrl = new URL("storage/v1", baseUrl);
		this.functionsUrl = new URL("functions/v1", baseUrl);
		const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
		const DEFAULTS = {
			db: DEFAULT_DB_OPTIONS,
			realtime: DEFAULT_REALTIME_OPTIONS,
			auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
			global: DEFAULT_GLOBAL_OPTIONS
		};
		const settings = applySettingDefaults(options !== null && options !== void 0 ? options : {}, DEFAULTS);
		this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : "";
		this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
		if (!settings.accessToken) this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
		else {
			this.accessToken = settings.accessToken;
			this.auth = new Proxy({}, { get: (_, prop) => {
				throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
			} });
		}
		this.fetch = fetchWithAuth(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
		this.realtime = this._initRealtimeClient(Object.assign({
			headers: this.headers,
			accessToken: this._getAccessToken.bind(this)
		}, settings.realtime));
		this.rest = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
			headers: this.headers,
			schema: settings.db.schema,
			fetch: this.fetch
		});
		this.storage = new StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
		if (!settings.accessToken) this._listenForAuthEvents();
	}
	/**
	* Supabase Functions allows you to deploy and invoke edge functions.
	*/
	get functions() {
		return new FunctionsClient(this.functionsUrl.href, {
			headers: this.headers,
			customFetch: this.fetch
		});
	}
	/**
	* Perform a query on a table or a view.
	*
	* @param relation - The table or view name to query
	*/
	from(relation) {
		return this.rest.from(relation);
	}
	/**
	* Select a schema to query or perform an function (rpc) call.
	*
	* The schema needs to be on the list of exposed schemas inside Supabase.
	*
	* @param schema - The schema to query
	*/
	schema(schema) {
		return this.rest.schema(schema);
	}
	/**
	* Perform a function call.
	*
	* @param fn - The function name to call
	* @param args - The arguments to pass to the function call
	* @param options - Named parameters
	* @param options.head - When set to `true`, `data` will not be returned.
	* Useful if you only need the count.
	* @param options.get - When set to `true`, the function will be called with
	* read-only access mode.
	* @param options.count - Count algorithm to use to count rows returned by the
	* function. Only applicable for [set-returning
	* functions](https://www.postgresql.org/docs/current/functions-srf.html).
	*
	* `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
	* hood.
	*
	* `"planned"`: Approximated but fast count algorithm. Uses the Postgres
	* statistics under the hood.
	*
	* `"estimated"`: Uses exact count for low numbers and planned count for high
	* numbers.
	*/
	rpc(fn, args = {}, options = {
		head: false,
		get: false,
		count: void 0
	}) {
		return this.rest.rpc(fn, args, options);
	}
	/**
	* Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
	*
	* @param {string} name - The name of the Realtime channel.
	* @param {Object} opts - The options to pass to the Realtime channel.
	*
	*/
	channel(name, opts = { config: {} }) {
		return this.realtime.channel(name, opts);
	}
	/**
	* Returns all Realtime channels.
	*/
	getChannels() {
		return this.realtime.getChannels();
	}
	/**
	* Unsubscribes and removes Realtime channel from Realtime client.
	*
	* @param {RealtimeChannel} channel - The name of the Realtime channel.
	*
	*/
	removeChannel(channel) {
		return this.realtime.removeChannel(channel);
	}
	/**
	* Unsubscribes and removes all Realtime channels from Realtime client.
	*/
	removeAllChannels() {
		return this.realtime.removeAllChannels();
	}
	_getAccessToken() {
		return __awaiter(this, void 0, void 0, function* () {
			var _a, _b;
			if (this.accessToken) return yield this.accessToken();
			const { data } = yield this.auth.getSession();
			return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
		});
	}
	_initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug }, headers, fetch) {
		const authHeaders = {
			Authorization: `Bearer ${this.supabaseKey}`,
			apikey: `${this.supabaseKey}`
		};
		return new SupabaseAuthClient({
			url: this.authUrl.href,
			headers: Object.assign(Object.assign({}, authHeaders), headers),
			storageKey,
			autoRefreshToken,
			persistSession,
			detectSessionInUrl,
			storage,
			userStorage,
			flowType,
			lock,
			debug,
			fetch,
			hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
		});
	}
	_initRealtimeClient(options) {
		return new RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
	}
	_listenForAuthEvents() {
		return this.auth.onAuthStateChange((event, session) => {
			this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
		});
	}
	_handleTokenChanged(event, source, token) {
		if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
			this.changedAccessToken = token;
			this.realtime.setAuth(token);
		} else if (event === "SIGNED_OUT") {
			this.realtime.setAuth();
			if (source == "STORAGE") this.auth.signOut();
			this.changedAccessToken = void 0;
		}
	}
};
/**
* Creates a new Supabase Client.
*/
var createClient = (supabaseUrl, supabaseKey, options) => {
	return new SupabaseClient(supabaseUrl, supabaseKey, options);
};
function shouldShowDeprecationWarning() {
	if (typeof window !== "undefined") return false;
	if (typeof process === "undefined") return false;
	const processVersion = process["version"];
	if (processVersion === void 0 || processVersion === null) return false;
	const versionMatch = processVersion.match(/^v(\d+)\./);
	if (!versionMatch) return false;
	return parseInt(versionMatch[1], 10) <= 18;
}
if (shouldShowDeprecationWarning()) console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
//#endregion
export { createClient as t };
