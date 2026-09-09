const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiUnavailableError extends Error {
  constructor(message = "A API esta indisponivel no momento. Tente novamente em instantes.", public readonly timeout = false) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

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
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL nao esta configurada.");
  }
  if (!hasApiConfiguration()) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL deve conter uma URL HTTP ou HTTPS valida.");
  }
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

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, query, ...requestInit } = options;
  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

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
    throw new ApiUnavailableError(
      error instanceof Error && /timeout|timed out/i.test(error.message)
        ? "A API demorou demais para responder. Tente novamente."
        : undefined,
      error instanceof Error && /timeout|timed out/i.test(error.message),
    );
  }
  const payload = await parseResponse(response);

  if (!response.ok && response.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
    let refreshResponse: Response;
    try {
      refreshResponse = await fetch(apiUrl("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
    } catch (error) {
      throw new ApiUnavailableError(
        error instanceof Error && /timeout|timed out/i.test(error.message)
          ? "A API demorou demais para responder. Tente novamente."
          : undefined,
        error instanceof Error && /timeout|timed out/i.test(error.message),
      );
    }
    if (refreshResponse.ok) {
      const retry = await fetch(apiUrl(path, query), {
        ...requestInit,
        headers: requestHeaders,
        credentials: "include",
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      });
      const retryPayload = await parseResponse(retry);
      if (retry.ok) return retryPayload as T;
      if (retry.status !== 401) {
        const retryMessage = retryPayload && typeof retryPayload === "object" && "detail" in retryPayload
          ? String((retryPayload as { detail: unknown }).detail)
          : `A API respondeu com status ${retry.status}.`;
        throw new ApiError(retryMessage, retry.status, retryPayload);
      }
    } else if (refreshResponse.status >= 500) {
      throw new ApiUnavailableError();
    }
  }

  if (response.status >= 500) {
    throw new ApiUnavailableError();
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? formatApiDetail((payload as { detail: unknown }).detail)
        : payload && typeof payload === "object" && "error" in payload
        ? formatApiDetail((payload as { error: unknown }).error)
        : `A API respondeu com status ${response.status}.`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function formatApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) return String((detail as { message: unknown }).message);
  return JSON.stringify(detail);
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
