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

export function resolveAssetUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return apiUrl(value);
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

  const response = await fetch(apiUrl(path, query), {
    ...requestInit,
    headers: requestHeaders,
    credentials: "include",
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });
  const payload = await parseResponse(response);

  if (!response.ok && response.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
    const refreshResponse = await fetch(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    });
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
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `A API respondeu com status ${response.status}.`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: RequestOptions = {}) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
