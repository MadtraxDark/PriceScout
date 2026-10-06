import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth-token";

let client: typeof import("./client");
const originalFetch = globalThis.fetch;
const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
const json = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

describe("cliente HTTP, API simulada somente em testes", () => {
  before(async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
    client = await import("./client");
  });
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
    clearAccessToken();
    setAccessToken("token-isolado-de-teste");
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.timers.reset();
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
    clearAccessToken();
  });

  it("compartilha GETs equivalentes mas nao guarda respostas", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return json(200, { ok: true }); };
    await Promise.all([
      client.api.get("/test/read", { query: { a: 1, b: 2 } }),
      client.api.get("/test/read", { query: { b: 2, a: 1 } }),
    ]);
    assert.equal(calls, 1);
    await client.api.get("/test/read", { query: { a: 1, b: 2 } });
    assert.equal(calls, 2);
  });

  it("respeita 429 longo, coordena queries e libera outra rota", async () => {
    mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 9, 5) });
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1 ? json(429, {}, { "Retry-After": "120" }) : json(200);
    };
    await assert.rejects(client.api.get("/test/limited"), (error) => error instanceof client.ApiError && error.retry_after === 120);
    mock.timers.tick(60_000);
    await assert.rejects(client.api.get("/test/limited", { query: { offset: 2 } }), (error) => error instanceof client.ApiError && error.retry_after === 60);
    assert.equal(calls, 1);
    await client.api.get("/test/other");
    mock.timers.tick(60_000);
    await client.api.get("/test/limited");
    assert.equal(calls, 3);
  });

  it("pausa rotas da mesma cota e mantem polling independente", async () => {
    mock.timers.enable({ apis: ["Date"], now: Date.UTC(2026, 9, 5) });
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1 ? json(429, { detail: { code: "RATE_LIMITED", rate_limit_policy: "token_bucket", rate_limit_scope: "default", retry_after: 2 } }) : json(200, {}, { "X-RateLimit-Scope": "default" });
    };
    await assert.rejects(client.api.get("/products"), { status: 429 });
    await assert.rejects(client.api.get("/stores"), { status: 429 });
    assert.equal(calls, 1);
    await client.api.get("/notifications");
    assert.equal(calls, 2);
    // Resposta em outro escopo nao cancela a pausa existente.
    await assert.rejects(client.api.get("/auth/me"), { status: 429 });
    mock.timers.tick(2000);
    await client.api.get("/stores");
    assert.equal(calls, 3);
  });

  it("aprende escopo de rota desconhecida pelo header", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 2 ? json(429, { detail: { rate_limit_policy: "token_bucket", rate_limit_scope: "default", retry_after: 5 } }) : json(200, {}, { "X-RateLimit-Scope": "default" });
    };
    await client.api.get("/test/learn-scope");
    await assert.rejects(client.api.get("/products"), { status: 429 });
    await assert.rejects(client.api.get("/test/learn-scope"), { status: 429 });
    assert.equal(calls, 2);
  });

  it("refresh respeita pausa compartilhada da autenticacao", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1 ? json(429, { detail: { rate_limit_policy: "token_bucket", rate_limit_scope: "auth", retry_after: 5 } }) : json(401);
    };
    await assert.rejects(client.api.post("/auth/logout", {}), { status: 429 });
    await assert.rejects(client.api.get("/test/protected-during-auth-pause"), { status: 429 });
    assert.equal(calls, 2);
    assert.ok(getAccessToken());
  });

  it("cooldown de loja nao pausa toda a cota de coleta", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1 ? json(429, { detail: { code: "RATE_LIMITED", rate_limit_policy: "upstream_cooldown", retry_after: 15 } }) : json(200);
    };
    await assert.rejects(client.api.post("/crawl", {}), { status: 429 });
    await client.api.post("/match", {});
    assert.equal(calls, 2);
  });

  it("isola headers diferentes e leituras iniciadas depois de uma mutacao", async () => {
    let calls = 0;
    let complete!: (response: Response) => void;
    globalThis.fetch = async (input, options) => {
      calls += 1;
      if (String(input).endsWith("/test/inflight") && options?.method === "GET" && calls === 1) {
        return new Promise<Response>((resolve) => { complete = resolve; });
      }
      return json(200);
    };
    const pending = client.api.get("/test/inflight");
    await Promise.resolve();
    await client.api.post("/test/inflight", {});
    await client.api.get("/test/inflight");
    assert.equal(calls, 3);
    complete(json(200));
    await pending;
    await Promise.all([
      client.api.get("/test/headers", { headers: { Accept: "application/json" } }),
      client.api.get("/test/headers", { headers: { Accept: "text/plain" } }),
    ]);
    assert.equal(calls, 5);
  });

  it("uma nova sessao nao herda cooldown da anterior", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return calls === 1 ? json(429, {}, { "Retry-After": "120" }) : json(200);
    };
    await assert.rejects(client.api.get("/test/session-limit"), { status: 429 });
    clearAccessToken();
    setAccessToken("outra-sessao-isolada");
    await client.api.get("/test/session-limit");
    assert.equal(calls, 2);
  });

  it("aceita Retry-After em data e usa o corpo quando o header e invalido", async () => {
    const now = Date.UTC(2026, 9, 5);
    mock.timers.enable({ apis: ["Date"], now });
    globalThis.fetch = async () => json(429, { detail: { retry_after: 90 } }, { "Retry-After": new Date(now + 180_000).toUTCString() });
    await assert.rejects(client.api.get("/test/date"), (error) => error instanceof client.ApiError && error.retry_after === 180);
    globalThis.fetch = async () => json(429, { detail: { retry_after: 90 } }, { "Retry-After": "invalid" });
    await assert.rejects(client.api.get("/test/body"), (error) => error instanceof client.ApiError && error.retry_after === 90);
  });

  it("nao repete mutacoes e nao compartilha requests do servidor", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return json(429, {}, { "Retry-After": "120" }); };
    await assert.rejects(client.api.post("/test/write", {}), { status: 429 });
    await assert.rejects(client.api.post("/test/write", {}), { status: 429 });
    assert.equal(calls, 1);
    Reflect.deleteProperty(globalThis, "window");
    globalThis.fetch = async () => { calls += 1; return json(200); };
    await Promise.all([client.api.get("/test/server"), client.api.get("/test/server")]);
    assert.equal(calls, 3);
  });

  it("preserva token no 429 do refresh e nao insiste durante a pausa", async () => {
    let refreshCalls = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/auth/refresh")) {
        refreshCalls += 1;
        return json(429, {}, { "Retry-After": "120" });
      }
      return json(401);
    };
    await assert.rejects(client.api.get("/test/protected"), { status: 429 });
    await assert.rejects(client.api.get("/test/protected"), { status: 429 });
    assert.equal(refreshCalls, 1);
    assert.equal(getAccessToken(), "token-isolado-de-teste");
  });

  it("renova uma vez, repete a leitura e preserva token em falha de rede", async () => {
    let reads = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/auth/refresh")) return json(200, { access_token: "token-renovado-de-teste" });
      return ++reads === 1 ? json(401) : json(200);
    };
    await client.api.get("/test/protected");
    assert.equal(reads, 2);
    assert.equal(getAccessToken(), "token-renovado-de-teste");
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/auth/refresh")) throw new TypeError("falha de rede isolada");
      return json(401);
    };
    await assert.rejects(client.api.get("/test/network"), { name: "ApiUnavailableError" });
    assert.equal(getAccessToken(), "token-renovado-de-teste");
  });

  it("descarta resposta de sessao anterior e nao restaura token apos logout", async () => {
    let resolve!: (response: Response) => void;
    globalThis.fetch = () => new Promise<Response>((done) => { resolve = done; });
    const pending = client.api.get("/test/session");
    await Promise.resolve();
    clearAccessToken();
    resolve(json(200));
    await assert.rejects(pending, { name: "AbortError" });
    setAccessToken("token-isolado-de-teste");
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/auth/refresh")) {
        clearAccessToken();
        return json(200, { access_token: "token-obsoleto-de-teste" });
      }
      return json(401);
    };
    await assert.rejects(client.api.get("/test/logout"), { name: "AbortError" });
    assert.equal(getAccessToken(), null);
  });

  it("distingue indisponibilidade do refresh de sessao rejeitada", async () => {
    globalThis.fetch = async (input) => String(input).endsWith("/auth/refresh") ? json(503) : json(401);
    await assert.rejects(client.api.get("/test/refresh-503"), { name: "ApiUnavailableError" });
    assert.equal(getAccessToken(), "token-isolado-de-teste");
    globalThis.fetch = async () => json(401);
    await assert.rejects(client.api.get("/test/refresh-invalid"), { status: 401 });
    assert.equal(getAccessToken(), null);
  });

  it("mantem cooldown recebido logo depois de renovar o token", async () => {
    let reads = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/auth/refresh")) return json(200, { access_token: "token-renovado-de-teste" });
      return ++reads === 1 ? json(401) : json(429, {}, { "Retry-After": "120" });
    };
    await assert.rejects(client.api.get("/test/after-refresh"), { status: 429 });
    await assert.rejects(client.api.get("/test/after-refresh"), { status: 429 });
    assert.equal(reads, 2);
  });
});
