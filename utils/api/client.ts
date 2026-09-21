import { clearAccessToken, getAccessToken, setAccessToken } from "./auth-token";

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
    if (typeof d.retry_after === "number") retry_after = d.retry_after;
    details = detail;
  } else if (typeof detail === "string") {
    message = detail;
  }

  if (retryAfterHeader) {
    const parsed = parseInt(retryAfterHeader, 10);
    if (Number.isFinite(parsed)) retry_after = parsed;
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
      const response = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        clearAccessToken();
        return false;
      }
      const payload = await response.json() as unknown;
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
    } catch {
      clearAccessToken();
      return false;
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, query, ...requestInit } = options;
  const isFormData = body instanceof FormData;
  // Evita loop infinito de refresh em endpoints de auth
  const isAuthEndpoint =
    path.includes("/auth/refresh") ||
    path.includes("/auth/logout") ||
    path.includes("/auth/google");

  async function attempt(isRetry: boolean): Promise<T> {
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

    const payload = await parseResponse(response);

    // 401: tentar refresh uma única vez (nunca em endpoints de auth)
    if (response.status === 401) {
      if (!isAuthEndpoint && !isRetry) {
        const refreshed = await singleFlightRefresh();
        if (refreshed) return attempt(true);
      }
      // Refresh falhou ou segundo 401: limpar token e propagar erro
      clearAccessToken();
      throw buildApiError(payload, 401);
    }

    // 5xx → ApiUnavailableError
    if (response.status >= 500) {
      throw new ApiUnavailableError();
    }

    // Qualquer outro erro HTTP → ApiError (401/403/404/409/422/429 NÃO viram ApiUnavailableError)
    if (!response.ok) {
      throw buildApiError(payload, response.status, response.headers.get("Retry-After"));
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
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: RequestOptions = {}) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
