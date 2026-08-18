import { o as __toESM } from "../_runtime.mjs";
//#region node_modules/@supabase/storage-js/dist/module/lib/errors.js
var StorageError = class extends Error {
	constructor(message) {
		super(message);
		this.__isStorageError = true;
		this.name = "StorageError";
	}
};
function isStorageError(error) {
	return typeof error === "object" && error !== null && "__isStorageError" in error;
}
var StorageApiError = class extends StorageError {
	constructor(message, status, statusCode) {
		super(message);
		this.name = "StorageApiError";
		this.status = status;
		this.statusCode = statusCode;
	}
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			status: this.status,
			statusCode: this.statusCode
		};
	}
};
var StorageUnknownError = class extends StorageError {
	constructor(message, originalError) {
		super(message);
		this.name = "StorageUnknownError";
		this.originalError = originalError;
	}
};
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/helpers.js
var __awaiter$5 = function(thisArg, _arguments, P, generator) {
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
	else if (typeof fetch === "undefined") _fetch = (...args) => import("./@supabase/node-fetch+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then(({ default: fetch }) => fetch(...args));
	else _fetch = fetch;
	return (...args) => _fetch(...args);
};
var resolveResponse = () => __awaiter$5(void 0, void 0, void 0, function* () {
	if (typeof Response === "undefined") return (yield import("./@supabase/node-fetch+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()))).Response;
	return Response;
});
var recursiveToCamel = (item) => {
	if (Array.isArray(item)) return item.map((el) => recursiveToCamel(el));
	else if (typeof item === "function" || item !== Object(item)) return item;
	const result = {};
	Object.entries(item).forEach(([key, value]) => {
		const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
		result[newKey] = recursiveToCamel(value);
	});
	return result;
};
/**
* Determine if input is a plain object
* An object is plain if it's created by either {}, new Object(), or Object.create(null)
* source: https://github.com/sindresorhus/is-plain-obj
*/
var isPlainObject = (value) => {
	if (typeof value !== "object" || value === null) return false;
	const prototype = Object.getPrototypeOf(value);
	return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
};
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/fetch.js
var __awaiter$4 = function(thisArg, _arguments, P, generator) {
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
var _getErrorMessage = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
var handleError = (error, reject, options) => __awaiter$4(void 0, void 0, void 0, function* () {
	if (error instanceof (yield resolveResponse()) && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) error.json().then((err) => {
		const status = error.status || 500;
		const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || status + "";
		reject(new StorageApiError(_getErrorMessage(err), status, statusCode));
	}).catch((err) => {
		reject(new StorageUnknownError(_getErrorMessage(err), err));
	});
	else reject(new StorageUnknownError(_getErrorMessage(error), error));
});
var _getRequestParams = (method, options, parameters, body) => {
	const params = {
		method,
		headers: (options === null || options === void 0 ? void 0 : options.headers) || {}
	};
	if (method === "GET" || !body) return params;
	if (isPlainObject(body)) {
		params.headers = Object.assign({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
		params.body = JSON.stringify(body);
	} else params.body = body;
	if (options === null || options === void 0 ? void 0 : options.duplex) params.duplex = options.duplex;
	return Object.assign(Object.assign({}, params), parameters);
};
function _handleRequest(fetcher, method, url, options, parameters, body) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return new Promise((resolve, reject) => {
			fetcher(url, _getRequestParams(method, options, parameters, body)).then((result) => {
				if (!result.ok) throw result;
				if (options === null || options === void 0 ? void 0 : options.noResolveJson) return result;
				return result.json();
			}).then((data) => resolve(data)).catch((error) => handleError(error, reject, options));
		});
	});
}
function get(fetcher, url, options, parameters) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "GET", url, options, parameters);
	});
}
function post(fetcher, url, body, options, parameters) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "POST", url, options, parameters, body);
	});
}
function put(fetcher, url, body, options, parameters) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "PUT", url, options, parameters, body);
	});
}
function head(fetcher, url, options, parameters) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "HEAD", url, Object.assign(Object.assign({}, options), { noResolveJson: true }), parameters);
	});
}
function remove(fetcher, url, body, options, parameters) {
	return __awaiter$4(this, void 0, void 0, function* () {
		return _handleRequest(fetcher, "DELETE", url, options, parameters, body);
	});
}
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StreamDownloadBuilder.js
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
var StreamDownloadBuilder = class {
	constructor(downloadFn, shouldThrowOnError) {
		this.downloadFn = downloadFn;
		this.shouldThrowOnError = shouldThrowOnError;
	}
	then(onfulfilled, onrejected) {
		return this.execute().then(onfulfilled, onrejected);
	}
	execute() {
		return __awaiter$3(this, void 0, void 0, function* () {
			try {
				return {
					data: (yield this.downloadFn()).body,
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
};
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/BlobDownloadBuilder.js
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
var _a;
var BlobDownloadBuilder = class {
	constructor(downloadFn, shouldThrowOnError) {
		this.downloadFn = downloadFn;
		this.shouldThrowOnError = shouldThrowOnError;
		this[_a] = "BlobDownloadBuilder";
		this.promise = null;
	}
	asStream() {
		return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
	}
	then(onfulfilled, onrejected) {
		return this.getPromise().then(onfulfilled, onrejected);
	}
	catch(onrejected) {
		return this.getPromise().catch(onrejected);
	}
	finally(onfinally) {
		return this.getPromise().finally(onfinally);
	}
	getPromise() {
		if (!this.promise) this.promise = this.execute();
		return this.promise;
	}
	execute() {
		return __awaiter$2(this, void 0, void 0, function* () {
			try {
				return {
					data: yield (yield this.downloadFn()).blob(),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
};
_a = Symbol.toStringTag;
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StorageFileApi.js
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
var DEFAULT_SEARCH_OPTIONS = {
	limit: 100,
	offset: 0,
	sortBy: {
		column: "name",
		order: "asc"
	}
};
var DEFAULT_FILE_OPTIONS = {
	cacheControl: "3600",
	contentType: "text/plain;charset=UTF-8",
	upsert: false
};
var StorageFileApi = class {
	constructor(url, headers = {}, bucketId, fetch) {
		this.shouldThrowOnError = false;
		this.url = url;
		this.headers = headers;
		this.bucketId = bucketId;
		this.fetch = resolveFetch(fetch);
	}
	/**
	* Enable throwing errors instead of returning them.
	*/
	throwOnError() {
		this.shouldThrowOnError = true;
		return this;
	}
	/**
	* Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
	*
	* @param method HTTP method.
	* @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
	* @param fileBody The body of the file to be stored in the bucket.
	*/
	uploadOrUpdate(method, path, fileBody, fileOptions) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				let body;
				const options = Object.assign(Object.assign({}, DEFAULT_FILE_OPTIONS), fileOptions);
				let headers = Object.assign(Object.assign({}, this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
				const metadata = options.metadata;
				if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
					body = new FormData();
					body.append("cacheControl", options.cacheControl);
					if (metadata) body.append("metadata", this.encodeMetadata(metadata));
					body.append("", fileBody);
				} else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
					body = fileBody;
					body.append("cacheControl", options.cacheControl);
					if (metadata) body.append("metadata", this.encodeMetadata(metadata));
				} else {
					body = fileBody;
					headers["cache-control"] = `max-age=${options.cacheControl}`;
					headers["content-type"] = options.contentType;
					if (metadata) headers["x-metadata"] = this.toBase64(this.encodeMetadata(metadata));
				}
				if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) headers = Object.assign(Object.assign({}, headers), fileOptions.headers);
				const cleanPath = this._removeEmptyFolders(path);
				const _path = this._getFinalPath(cleanPath);
				const data = yield (method == "PUT" ? put : post)(this.fetch, `${this.url}/object/${_path}`, body, Object.assign({ headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
				return {
					data: {
						path: cleanPath,
						id: data.Id,
						fullPath: data.Key
					},
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Uploads a file to an existing bucket.
	*
	* @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
	* @param fileBody The body of the file to be stored in the bucket.
	*/
	upload(path, fileBody, fileOptions) {
		return __awaiter$1(this, void 0, void 0, function* () {
			return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
		});
	}
	/**
	* Upload a file with a token generated from `createSignedUploadUrl`.
	* @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
	* @param token The token generated from `createSignedUploadUrl`
	* @param fileBody The body of the file to be stored in the bucket.
	*/
	uploadToSignedUrl(path, token, fileBody, fileOptions) {
		return __awaiter$1(this, void 0, void 0, function* () {
			const cleanPath = this._removeEmptyFolders(path);
			const _path = this._getFinalPath(cleanPath);
			const url = new URL(this.url + `/object/upload/sign/${_path}`);
			url.searchParams.set("token", token);
			try {
				let body;
				const options = Object.assign({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
				const headers = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(options.upsert) });
				if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
					body = new FormData();
					body.append("cacheControl", options.cacheControl);
					body.append("", fileBody);
				} else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
					body = fileBody;
					body.append("cacheControl", options.cacheControl);
				} else {
					body = fileBody;
					headers["cache-control"] = `max-age=${options.cacheControl}`;
					headers["content-type"] = options.contentType;
				}
				return {
					data: {
						path: cleanPath,
						fullPath: (yield put(this.fetch, url.toString(), body, { headers })).Key
					},
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Creates a signed upload URL.
	* Signed upload URLs can be used to upload files to the bucket without further authentication.
	* They are valid for 2 hours.
	* @param path The file path, including the current file name. For example `folder/image.png`.
	* @param options.upsert If set to true, allows the file to be overwritten if it already exists.
	*/
	createSignedUploadUrl(path, options) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				let _path = this._getFinalPath(path);
				const headers = Object.assign({}, this.headers);
				if (options === null || options === void 0 ? void 0 : options.upsert) headers["x-upsert"] = "true";
				const data = yield post(this.fetch, `${this.url}/object/upload/sign/${_path}`, {}, { headers });
				const url = new URL(this.url + data.url);
				const token = url.searchParams.get("token");
				if (!token) throw new StorageError("No token returned by API");
				return {
					data: {
						signedUrl: url.toString(),
						path,
						token
					},
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Replaces an existing file at the specified path with a new one.
	*
	* @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
	* @param fileBody The body of the file to be stored in the bucket.
	*/
	update(path, fileBody, fileOptions) {
		return __awaiter$1(this, void 0, void 0, function* () {
			return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
		});
	}
	/**
	* Moves an existing file to a new path in the same bucket.
	*
	* @param fromPath The original file path, including the current file name. For example `folder/image.png`.
	* @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
	* @param options The destination options.
	*/
	move(fromPath, toPath, options) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				return {
					data: yield post(this.fetch, `${this.url}/object/move`, {
						bucketId: this.bucketId,
						sourceKey: fromPath,
						destinationKey: toPath,
						destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
					}, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Copies an existing file to a new path in the same bucket.
	*
	* @param fromPath The original file path, including the current file name. For example `folder/image.png`.
	* @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
	* @param options The destination options.
	*/
	copy(fromPath, toPath, options) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				return {
					data: { path: (yield post(this.fetch, `${this.url}/object/copy`, {
						bucketId: this.bucketId,
						sourceKey: fromPath,
						destinationKey: toPath,
						destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
					}, { headers: this.headers })).Key },
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
	*
	* @param path The file path, including the current file name. For example `folder/image.png`.
	* @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
	* @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
	* @param options.transform Transform the asset before serving it to the client.
	*/
	createSignedUrl(path, expiresIn, options) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				let _path = this._getFinalPath(path);
				let data = yield post(this.fetch, `${this.url}/object/sign/${_path}`, Object.assign({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: this.headers });
				const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
				data = { signedUrl: encodeURI(`${this.url}${data.signedURL}${downloadQueryParam}`) };
				return {
					data,
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
	*
	* @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
	* @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
	* @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
	*/
	createSignedUrls(paths, expiresIn, options) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				const data = yield post(this.fetch, `${this.url}/object/sign/${this.bucketId}`, {
					expiresIn,
					paths
				}, { headers: this.headers });
				const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
				return {
					data: data.map((datum) => Object.assign(Object.assign({}, datum), { signedUrl: datum.signedURL ? encodeURI(`${this.url}${datum.signedURL}${downloadQueryParam}`) : null })),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
	*
	* @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
	* @param options.transform Transform the asset before serving it to the client.
	*/
	download(path, options) {
		const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image/authenticated" : "object";
		const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
		const queryString = transformationQuery ? `?${transformationQuery}` : "";
		const _path = this._getFinalPath(path);
		const downloadFn = () => get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
			headers: this.headers,
			noResolveJson: true
		});
		return new BlobDownloadBuilder(downloadFn, this.shouldThrowOnError);
	}
	/**
	* Retrieves the details of an existing file.
	* @param path
	*/
	info(path) {
		return __awaiter$1(this, void 0, void 0, function* () {
			const _path = this._getFinalPath(path);
			try {
				return {
					data: recursiveToCamel(yield get(this.fetch, `${this.url}/object/info/${_path}`, { headers: this.headers })),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Checks the existence of a file.
	* @param path
	*/
	exists(path) {
		return __awaiter$1(this, void 0, void 0, function* () {
			const _path = this._getFinalPath(path);
			try {
				yield head(this.fetch, `${this.url}/object/${_path}`, { headers: this.headers });
				return {
					data: true,
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error) && error instanceof StorageUnknownError) {
					const originalError = error.originalError;
					if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status)) return {
						data: false,
						error
					};
				}
				throw error;
			}
		});
	}
	/**
	* A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
	* This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
	*
	* @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
	* @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
	* @param options.transform Transform the asset before serving it to the client.
	*/
	getPublicUrl(path, options) {
		const _path = this._getFinalPath(path);
		const _queryString = [];
		const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
		if (downloadQueryParam !== "") _queryString.push(downloadQueryParam);
		const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image" : "object";
		const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
		if (transformationQuery !== "") _queryString.push(transformationQuery);
		let queryString = _queryString.join("&");
		if (queryString !== "") queryString = `?${queryString}`;
		return { data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) } };
	}
	/**
	* Deletes files within the same bucket
	*
	* @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
	*/
	remove(paths) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				return {
					data: yield remove(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: paths }, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Get file metadata
	* @param id the file id to retrieve metadata
	*/
	/**
	* Update file metadata
	* @param id the file id to update metadata
	* @param meta the new file metadata
	*/
	/**
	* Lists all the files and folders within a path of the bucket.
	* @param path The folder path.
	* @param options Search options including limit (defaults to 100), offset, sortBy, and search
	*/
	list(path, options, parameters) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				const body = Object.assign(Object.assign(Object.assign({}, DEFAULT_SEARCH_OPTIONS), options), { prefix: path || "" });
				return {
					data: yield post(this.fetch, `${this.url}/object/list/${this.bucketId}`, body, { headers: this.headers }, parameters),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* @experimental this method signature might change in the future
	* @param options search options
	* @param parameters
	*/
	listV2(options, parameters) {
		return __awaiter$1(this, void 0, void 0, function* () {
			try {
				const body = Object.assign({}, options);
				return {
					data: yield post(this.fetch, `${this.url}/object/list-v2/${this.bucketId}`, body, { headers: this.headers }, parameters),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	encodeMetadata(metadata) {
		return JSON.stringify(metadata);
	}
	toBase64(data) {
		if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64");
		return btoa(data);
	}
	_getFinalPath(path) {
		return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
	}
	_removeEmptyFolders(path) {
		return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
	}
	transformOptsToQueryString(transform) {
		const params = [];
		if (transform.width) params.push(`width=${transform.width}`);
		if (transform.height) params.push(`height=${transform.height}`);
		if (transform.resize) params.push(`resize=${transform.resize}`);
		if (transform.format) params.push(`format=${transform.format}`);
		if (transform.quality) params.push(`quality=${transform.quality}`);
		return params.join("&");
	}
};
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/lib/constants.js
var DEFAULT_HEADERS = { "X-Client-Info": `storage-js/2.75.1` };
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/packages/StorageBucketApi.js
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
var StorageBucketApi = class {
	constructor(url, headers = {}, fetch, opts) {
		this.shouldThrowOnError = false;
		const baseUrl = new URL(url);
		if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
			if (/supabase\.(co|in|red)$/.test(baseUrl.hostname) && !baseUrl.hostname.includes("storage.supabase.")) baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
		}
		this.url = baseUrl.href.replace(/\/$/, "");
		this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
		this.fetch = resolveFetch(fetch);
	}
	/**
	* Enable throwing errors instead of returning them.
	*/
	throwOnError() {
		this.shouldThrowOnError = true;
		return this;
	}
	/**
	* Retrieves the details of all Storage buckets within an existing project.
	*/
	listBuckets() {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				return {
					data: yield get(this.fetch, `${this.url}/bucket`, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Retrieves the details of an existing Storage bucket.
	*
	* @param id The unique identifier of the bucket you would like to retrieve.
	*/
	getBucket(id) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				return {
					data: yield get(this.fetch, `${this.url}/bucket/${id}`, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Creates a new Storage bucket
	*
	* @param id A unique identifier for the bucket you are creating.
	* @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
	* @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
	* The global file size limit takes precedence over this value.
	* The default value is null, which doesn't set a per bucket file size limit.
	* @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
	* The default value is null, which allows files with all mime types to be uploaded.
	* Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
	* @returns newly created bucket id
	* @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
	*   - default bucket type is `STANDARD`
	*/
	createBucket(id_1) {
		return __awaiter(this, arguments, void 0, function* (id, options = { public: false }) {
			try {
				return {
					data: yield post(this.fetch, `${this.url}/bucket`, {
						id,
						name: id,
						type: options.type,
						public: options.public,
						file_size_limit: options.fileSizeLimit,
						allowed_mime_types: options.allowedMimeTypes
					}, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Updates a Storage bucket
	*
	* @param id A unique identifier for the bucket you are updating.
	* @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
	* @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
	* The global file size limit takes precedence over this value.
	* The default value is null, which doesn't set a per bucket file size limit.
	* @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
	* The default value is null, which allows files with all mime types to be uploaded.
	* Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
	*/
	updateBucket(id, options) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				return {
					data: yield put(this.fetch, `${this.url}/bucket/${id}`, {
						id,
						name: id,
						public: options.public,
						file_size_limit: options.fileSizeLimit,
						allowed_mime_types: options.allowedMimeTypes
					}, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Removes all objects inside a single bucket.
	*
	* @param id The unique identifier of the bucket you would like to empty.
	*/
	emptyBucket(id) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				return {
					data: yield post(this.fetch, `${this.url}/bucket/${id}/empty`, {}, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
	/**
	* Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
	* You must first `empty()` the bucket.
	*
	* @param id The unique identifier of the bucket you would like to delete.
	*/
	deleteBucket(id) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				return {
					data: yield remove(this.fetch, `${this.url}/bucket/${id}`, {}, { headers: this.headers }),
					error: null
				};
			} catch (error) {
				if (this.shouldThrowOnError) throw error;
				if (isStorageError(error)) return {
					data: null,
					error
				};
				throw error;
			}
		});
	}
};
//#endregion
//#region node_modules/@supabase/storage-js/dist/module/StorageClient.js
var StorageClient = class extends StorageBucketApi {
	constructor(url, headers = {}, fetch, opts) {
		super(url, headers, fetch, opts);
	}
	/**
	* Perform file operation in a bucket.
	*
	* @param id The bucket id to operate on.
	*/
	from(id) {
		return new StorageFileApi(this.url, this.headers, id, this.fetch);
	}
};
//#endregion
export { StorageClient as t };
