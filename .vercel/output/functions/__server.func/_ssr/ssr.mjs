//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
/**
* A closed tab, navigation, reload or HMR refresh kills in-flight sockets and
* Node emits `Error: aborted` (abortIncoming / ECONNRESET / ECONNABORTED).
* The client is already gone, so this is noise — never record or report it.
*/
function isRequestAbortError(error) {
	if (error == null) return false;
	const err = error;
	const message = typeof err.message === "string" ? err.message.toLowerCase() : "";
	if (err.name === "AbortError" || message === "aborted" || message.includes("aborted") || err.code === "ECONNRESET" || err.code === "ECONNABORTED" || err.code === "ABORT_ERR") return true;
	return err.cause != null && err.cause !== error ? isRequestAbortError(err.cause) : false;
}
function record(error) {
	if (isRequestAbortError(error)) return;
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => {
		const err = event.error ?? event;
		if (isRequestAbortError(err)) {
			event.preventDefault?.();
			return;
		}
		record(err);
	});
	globalThis.addEventListener("unhandledrejection", (event) => {
		const reason = event.reason;
		if (isRequestAbortError(reason)) {
			event.preventDefault?.();
			return;
		}
		record(reason);
	});
}
var proc = globalThis.process;
if (proc && typeof proc.on === "function" && !proc.__abortGuard) {
	proc.__abortGuard = true;
	const originalEmit = proc.emit.bind(proc);
	proc.emit = function patchedEmit(event, ...args) {
		if ((event === "uncaughtException" || event === "unhandledRejection") && isRequestAbortError(args[0])) return true;
		return originalEmit(event, ...args);
	};
	proc.on("uncaughtException", (error) => {
		if (isRequestAbortError(error)) return;
		console.error(error);
	});
	proc.on("unhandledRejection", (reason) => {
		if (isRequestAbortError(reason)) return;
		console.error(reason);
	});
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-BgjhdJal.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		if (isRequestAbortError(error)) return new Response(null, { status: 499 });
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
