import { clearAccessToken, getAccessToken, getSessionRevision, setAccessToken } from "./auth-token";
import { parseRetryAfter, RequestFlights, retryDelayMs } from "./request-control";
import { apiRateLimitScope, parseApiRateLimitScope } from "./rate-limit-scope";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

// ---------------------------------------------------------------------------
// Erros públicos
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = "UNKNOWN",
    public readonly retryable: boolean = false,
    public readonly retry_after: number | null = null,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Erros de rede (sem resposta) e 5xx.
 * NÃO usar para 401 / 403 / 404 / 409 / 422 / 429.
 */
export class ApiUnavailableError extends Error {
  constructor(
    message = "A API esta indisponivel no momento. Tente novamente em instantes.",
    public readonly timeout = false,
  ) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

// ---------------------------------------------------------------------------
// Utilitários de URL
// ---------------------------------------------------------------------------

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  discardResponseBody?: boolean;
  preserveApiErrorDetails?: boolean;
  query?: Record<string, string | number | boolean | null | undefined>;
};

export function hasApiConfiguration(): boolean {
  if (!API_BASE_URL) return false;
  try {
    const url = new URL(API_BASE_URL);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_BASE_URL nao esta configurada.");
  if (!hasApiConfiguration()) throw new Error("NEXT_PUBLIC_API_BASE_URL deve conter uma URL HTTP ou HTTPS valida.");
  return API_BASE_URL;
}

export function apiUrl(path: string, query?: RequestOptions["query"]): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${requireApiBaseUrl()}${normalizedPath}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// ---------------------------------------------------------------------------
// Parse de resposta
// ---------------------------------------------------------------------------

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

/**
 * Constrói ApiError a partir do payload de erro do ScoutApiV2.
 * Formato canônico: { detail: { code, message, retryable, ... } }
 */
function buildApiError(payload: unknown, status: number, retryAfterHeader?: string | null): ApiError {
  const detail =
    payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail: unknown }).detail
      : null;

  let code = "UNKNOWN";
  let message = `A API respondeu com status ${status}.`;
  let retryable = false;
  let retry_after: number | null = null;
  let details: unknown = payload;

  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    if (typeof d.code === "string") code = d.code;
    if (typeof d.message === "string") message = d.message;
    if (typeof d.retryable === "boolean") retryable = d.retryable;
    if (typeof d.retry_after === "number" && Number.isFinite(d.retry_after) && d.retry_after >= 0) retry_after = d.retry_after;
    details = detail;
  } else if (typeof detail === "string") {
    message = detail;
  }

  if (retryAfterHeader) {
    const parsed = parseRetryAfter(retryAfterHeader);
    if (parsed !== null) retry_after = parsed;
  }

  const isRateLimited = status === 429;

  return new ApiError(message, status, code, retryable || isRateLimited, retry_after, details);
}

// ---------------------------------------------------------------------------
// Refresh single-flight
// Garante que apenas uma requisição de refresh ocorra por vez; demais
// aguardam o resultado do mesmo Promise.
// ---------------------------------------------------------------------------

let _refreshPromise: Promise<boolean> | null = null;

async function singleFlightRefresh(): Promise<boolean> {
  if (_refreshPromise !== null) {
    return _refreshPromise;
  }

  const promise = (async (): Promise<boolean> => {
    try {
      const refreshUrl = apiUrl("/auth/refresh");
      const cooldownKey = `POST ${refreshUrl}`;
      const browser = typeof window !== "undefined";
      const revision = getSessionRevision();
      const cooldown = browser && controlRevision === revision ? getCooldown(cooldownKey, `${new URL(refreshUrl).origin} scope:auth`) : undefined;
      if (cooldown && cooldown.until > Date.now()) {
        throw new ApiError("A renovação da sessão será retomada após a pausa solicitada pela API.", 429, cooldown.error.code, true, Math.ceil((cooldown.until - Date.now()) / 1000));
      }
      const response = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
      });
      if (browser && revision !== getSessionRevision()) throw new DOMException("Sessão alterada", "AbortError");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          clearAccessToken();
          return false;
        }
        if (response.status >= 500) throw new ApiUnavailableError();
        let error = buildApiError(await parseResponse(response), response.status, response.headers.get("Retry-After"));
        if (browser && response.status === 429 && revision === getSessionRevision()) {
          error = recordCooldown(error, cooldownKey, refreshUrl);
        }
        throw error;
      }
      const payload = await response.json() as unknown;
      if (browser && revision !== getSessionRevision()) throw new DOMException("Sessão alterada", "AbortError");
      const token =
        payload && typeof payload === "object" && "access_token" in payload
          ? String((payload as { access_token: unknown }).access_token)
          : null;
      if (token) {
        setAccessToken(token);
        return true;
      }
      clearAccessToken();
      return false;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      if (error instanceof ApiError || error instanceof ApiUnavailableError) throw error;
      throw new ApiUnavailableError();
    }
  })();

  _refreshPromise = promise;
  try {
    return await promise;
  } finally {
    _refreshPromise = null;
  }
}

// ---------------------------------------------------------------------------
// Headers da requisição
// ---------------------------------------------------------------------------

function buildRequestHeaders(base?: HeadersInit, body?: unknown, isFormData?: boolean): Headers {
  const headers = new Headers(base);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return headers;
}

// ---------------------------------------------------------------------------
// Função principal de request
// ---------------------------------------------------------------------------

const requestFlights = new RequestFlights();
const cooldowns = new Map<string, { until: number; failures: number; error: ApiError }>();
const routeScopes = new Map<string, string>();
let controlRevision = -1;
let mutationRevision = 0;

function getCooldown(routeKey: string, scopeKey?: string) {
  const scoped = scopeKey ? cooldowns.get(scopeKey) : undefined;
  const local = cooldowns.get(routeKey);
  return scoped && (!local || scoped.until > local.until) ? scoped : local;
}

function recordCooldown(error: ApiError, routeKey: string, url: string): ApiError {
  const detail = error.details && typeof error.details === "object" ? error.details as Record<string, unknown> : null;
  // Apenas cotas da API pausam outras rotas. Cooldown de loja fica local.
  const scope = detail?.rate_limit_policy === "token_bucket" ? parseApiRateLimitScope(detail.rate_limit_scope) : null;
  const key = scope ? `${new URL(url).origin} scope:${scope}` : routeKey;
  if (scope) routeScopes.set(routeKey, scope);
  const failures = (cooldowns.get(key)?.failures ?? 0) + 1;
  const wait = retryDelayMs(failures - 1, error.retry_after);
  const until = Math.max(cooldowns.get(key)?.until ?? 0, Date.now() + wait);
  cooldowns.set(key, { until, failures, error });
  return new ApiError(error.message, error.status, error.code, true, Math.ceil((until - Date.now()) / 1000), error.details);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const browser = typeof window !== "undefined";
  const revision = getSessionRevision();
  if (browser && controlRevision !== revision) {
    cooldowns.clear();
    routeScopes.clear();
    controlRevision = revision;
  }
  const method = (options.method ?? "GET").toUpperCase();
  const url = new URL(apiUrl(path, options.query));
  const cooldownKey = `${method} ${url.origin}${url.pathname}`;
  const task = (signal?: AbortSignal | null) => executeRequest<T>(path, { ...options, signal }, cooldownKey, revision, browser);
  // Opcoes extras de Next e GETs com corpo nao sao compartilhados.
  const supported = new Set(["method", "headers", "query", "signal", "cache", "discardResponseBody", "preserveApiErrorDetails"]);
  if (browser && method === "GET" && options.body === undefined && Object.keys(options).every((key) => supported.has(key))) {
    url.searchParams.sort();
    const key = JSON.stringify([revision, mutationRevision, url.toString(), Array.from(buildRequestHeaders(options.headers).entries()).sort(), options.cache, options.discardResponseBody, options.preserveApiErrorDetails]);
    return requestFlights.run(key, (signal) => task(signal), options.signal);
  }
  return task(options.signal);
}

async function executeRequest<T>(path: string, options: RequestOptions, cooldownKey: string, revision: number, browser: boolean): Promise<T> {
  let activeRevision = revision;
  const { body, headers, query, discardResponseBody, preserveApiErrorDetails, ...requestInit } = options;
  const isFormData = body instanceof FormData;
  // Evita loop infinito de refresh em endpoints de auth
  const isAuthEndpoint =
    path.includes("/auth/refresh") ||
    path.includes("/auth/logout") ||
    path.includes("/auth/google");

  async function attempt(isRetry: boolean): Promise<T> {
    requestInit.signal?.throwIfAborted();
    if (browser && activeRevision !== getSessionRevision()) throw new DOMException("Sessão alterada", "AbortError");
    if (browser) {
      const url = new URL(apiUrl(path, query));
      const scope = routeScopes.get(cooldownKey) ?? apiRateLimitScope((requestInit.method ?? "GET").toUpperCase(), path.split("?")[0]);
      const cooldown = getCooldown(cooldownKey, scope ? `${url.origin} scope:${scope}` : undefined);
      if (cooldown && cooldown.until > Date.now()) {
        throw new ApiError("A API pediu uma pausa. Aguarde antes de tentar novamente.", 429, cooldown.error.code, true, Math.ceil((cooldown.until - Date.now()) / 1000), cooldown.error.details);
      }
    }
    const requestHeaders = buildRequestHeaders(headers, body, isFormData);
    let response: Response;

    try {
      response = await fetch(apiUrl(path, query), {
        ...requestInit,
        headers: requestHeaders,
        credentials: "include",
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      const isTimeout = error instanceof Error && /timeout|timed out/i.test(error.message);
      throw new ApiUnavailableError(
        isTimeout ? "A API demorou demais para responder. Tente novamente." : undefined,
        isTimeout,
      );
    }

    const payload = response.ok && discardResponseBody
      ? undefined
      : await parseResponse(response);
    if (browser && activeRevision !== getSessionRevision()) throw new DOMException("Sessão alterada", "AbortError");
    if (browser) {
      const scope = parseApiRateLimitScope(response.headers.get("X-RateLimit-Scope"));
      if (scope) routeScopes.set(cooldownKey, scope);
    }
    if (response.ok && discardResponseBody) {
      await response.body?.cancel();
    }

    // 401: tentar refresh uma única vez (nunca em endpoints de auth)
    if (response.status === 401) {
      if (!isAuthEndpoint && !isRetry) {
        const refreshed = await singleFlightRefresh();
        if (refreshed) {
          activeRevision = getSessionRevision();
          if (browser && controlRevision !== activeRevision) {
            cooldowns.clear();
            controlRevision = activeRevision;
          }
          return attempt(true);
        }
      }
      // Refresh falhou ou segundo 401: limpar token e propagar erro
      clearAccessToken();
      throw buildApiError(payload, 401);
    }

    // 5xx → ApiUnavailableError
    if (response.status >= 500 && !preserveApiErrorDetails) {
      throw new ApiUnavailableError();
    }

    // Qualquer outro erro HTTP → ApiError (401/403/404/409/422/429 NÃO viram ApiUnavailableError)
    if (!response.ok) {
      let error = buildApiError(payload, response.status, response.headers.get("Retry-After"));
      if (browser && activeRevision === getSessionRevision() && response.status === 429) {
        error = recordCooldown(error, cooldownKey, apiUrl(path, query));
      }
      throw error;
    }

    if (browser && activeRevision === getSessionRevision()) {
      cooldowns.delete(cooldownKey);
      const scope = routeScopes.get(cooldownKey);
      const scopeKey = `${new URL(apiUrl(path, query)).origin} scope:${scope}`;
      const cooldown = cooldowns.get(scopeKey);
      if (cooldown && cooldown.until <= Date.now()) cooldowns.delete(scopeKey);
      if ((requestInit.method ?? "GET").toUpperCase() !== "GET") mutationRevision += 1;
    }

    return payload as T;
  }

  return attempt(false);
}

// ---------------------------------------------------------------------------
// Métodos shorthand
// ---------------------------------------------------------------------------

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
