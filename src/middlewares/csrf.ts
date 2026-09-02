import { createMiddleware } from "@tanstack/react-start";

type CsrfSecFetchSite =
  | "same-origin"
  | "same-site"
  | "cross-site"
  | "none";

type CsrfRequestContext = {
  request: Request;
  handlerType: string;
};

type CsrfMatcher<TValue extends string> =
  | TValue
  | Array<TValue>
  | ((
      value: TValue | (string & {}),
      context: CsrfRequestContext,
    ) => boolean | Promise<boolean>);

type CsrfMiddlewareOptions = {
  /** Return true only for requests that should be checked. */
  filter?: (context: CsrfRequestContext) => boolean | Promise<boolean>;
  /** Allowed origins. Defaults to the current request origin. */
  origin?: CsrfMatcher<string>;
  /** Allowed Sec-Fetch-Site values. Defaults to same-origin. */
  secFetchSite?: CsrfMatcher<CsrfSecFetchSite>;
  /** Use Referer when Sec-Fetch-Site and Origin are absent. */
  referer?:
    | boolean
    | ((
        referer: string,
        context: CsrfRequestContext,
      ) => boolean | Promise<boolean>);
  allowRequestsWithoutOriginCheck?: boolean;
  failureResponse?:
    | Response
    | ((
        context: CsrfRequestContext,
      ) => Response | Promise<Response>);
};

const csrfSymbol = Symbol.for("tanstack-start:csrf-middleware");

/**
 * This is the framework's CSRF validation logic kept server-only. Importing
 * start-client-core here makes Vite ship node:async_hooks to the browser,
 * preventing React from hydrating in development.
 */
export function createCsrfMiddleware(options: CsrfMiddlewareOptions = {}) {
  const middleware = createMiddleware().server(async (context) => {
    const csrfContext = context as typeof context & CsrfRequestContext;

    if (options.filter && !(await options.filter(csrfContext))) {
      return context.next();
    }

    if (await isCsrfRequestAllowed(options, csrfContext)) {
      return context.next();
    }

    return getFailureResponse(options, csrfContext);
  });

  Object.defineProperty(middleware, csrfSymbol, { value: true });
  return middleware;
}

async function isCsrfRequestAllowed(
  options: CsrfMiddlewareOptions,
  context: CsrfRequestContext,
): Promise<boolean> {
  const result = await getCsrfRequestValidationResult(options, context);
  return result === true || (result === undefined && options.allowRequestsWithoutOriginCheck === true);
}

async function getCsrfRequestValidationResult(
  options: CsrfMiddlewareOptions,
  context: CsrfRequestContext,
): Promise<boolean | undefined> {
  const fetchSite = context.request.headers.get("Sec-Fetch-Site");
  if (fetchSite !== null) {
    return matchValue(options.secFetchSite ?? "same-origin", fetchSite, context);
  }

  const origin = context.request.headers.get("Origin");
  if (origin !== null) {
    if (options.origin) {
      return matchValue(options.origin, origin, context);
    }

    return origin === new URL(context.request.url).origin;
  }

  const referer = context.request.headers.get("Referer");
  if (referer === null || options.referer === false) {
    return undefined;
  }

  if (typeof options.referer === "function") {
    return options.referer(referer, context);
  }

  if (options.origin) {
    const refererOrigin = getOriginFromUrl(referer);
    return refererOrigin !== undefined && matchValue(options.origin, refererOrigin, context);
  }

  return isRefererSameOrigin(referer, new URL(context.request.url).origin);
}

async function matchValue<TValue extends string>(
  matcher: CsrfMatcher<TValue>,
  value: string,
  context: CsrfRequestContext,
): Promise<boolean> {
  if (typeof matcher === "function") {
    return matcher(value as TValue, context);
  }

  if (Array.isArray(matcher)) {
    return matcher.includes(value as TValue);
  }

  return value === matcher;
}

function getOriginFromUrl(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isRefererSameOrigin(referer: string, requestOrigin: string): boolean {
  if (referer === requestOrigin) return true;
  if (!referer.startsWith(requestOrigin)) return false;
  if (referer.length === requestOrigin.length) return true;

  const code = referer.charCodeAt(requestOrigin.length);
  return code === 47 || code === 63 || code === 35;
}

async function getFailureResponse(
  options: CsrfMiddlewareOptions,
  context: CsrfRequestContext,
): Promise<Response> {
  if (typeof options.failureResponse === "function") {
    return options.failureResponse(context);
  }

  return options.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
}
