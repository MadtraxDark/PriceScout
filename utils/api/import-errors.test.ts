import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Dados de teste isolados: API simulada somente em testes, identificadores genericos.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";

const previewTeste = { name: "Produto teste", source: "loja-teste", url: "https://loja-teste.example/p/1", images: [] } as never;

describe("API simulada (somente testes): resolucao e erros de importacao", () => {
  it("mapeia 409 de revisao incluindo match_confidence", async () => {
    const { ApiError } = await import("./client");
    const { reviewCandidateFromError } = await import("./import-errors");
    const error = new ApiError("revisao", 409, "PRODUCT_IDENTITY_REVIEW_REQUIRED", false, null, {
      existing_product: { id: 42, title: "Produto teste", brand: "marca-teste" },
      match_confidence: "0.85",
    });
    const result = reviewCandidateFromError(error);
    assert.equal(result?.product.id, "42");
    assert.equal(result?.product.name, "Produto teste");
    assert.equal(result?.confidence, 0.85);
    assert.equal(reviewCandidateFromError(new ApiError("x", 409, "OUTRO", false, null, {})), null);
    assert.equal(reviewCandidateFromError(new ApiError("x", 409, "PRODUCT_IDENTITY_REVIEW_REQUIRED", false, null, {})), null);
    assert.equal(reviewCandidateFromError(new Error("x")), null);
    const noConfidence = new ApiError("r", 409, "PRODUCT_IDENTITY_REVIEW_REQUIRED", false, null, { existing_product: { id: "a" } });
    assert.equal(reviewCandidateFromError(noConfidence)?.confidence, null);
  });

  it("classifica erros de conflito e integridade", async () => {
    const { ApiError } = await import("./client");
    const { isIdentityConflict, isIntegrityError } = await import("./import-errors");
    assert.equal(isIdentityConflict(new ApiError("c", 409, "PRODUCT_IDENTITY_CONFLICT")), true);
    assert.equal(isIdentityConflict(new ApiError("c", 409, "DATABASE_INTEGRITY_ERROR")), false);
    assert.equal(isIntegrityError(new ApiError("c", 409, "DATABASE_INTEGRITY_ERROR")), true);
  });

  it("classifica indisponibilidade, abort, conflito e recusa da consulta", async () => {
    const { ApiError, ApiUnavailableError } = await import("./client");
    const { classifyResolveError } = await import("./import-errors");
    assert.equal(classifyResolveError(new ApiUnavailableError()), "unavailable");
    assert.equal(classifyResolveError(new ApiUnavailableError("t", true)), "unavailable");
    assert.equal(classifyResolveError(new DOMException("abort", "AbortError")), "unavailable");
    assert.equal(classifyResolveError(new ApiError("c", 409, "PRODUCT_IDENTITY_CONFLICT")), "conflict");
    assert.equal(classifyResolveError(new ApiError("r", 422, "VALIDATION")), "error");
    assert.equal(classifyResolveError(new Error("inesperado")), "error");
  });

  it("resolveProduct propaga ApiUnavailableError do api.post simulado", async () => {
    const { api, ApiUnavailableError } = await import("./client");
    const { catalogApi } = await import("./services");
    const original = api.post;
    api.post = (async () => { throw new ApiUnavailableError(); }) as typeof api.post;
    try {
      await assert.rejects(() => catalogApi.resolveProduct(previewTeste), ApiUnavailableError);
    } finally { api.post = original; }
  });

  it("resolveProductWithTimeout aborta o sinal ao estourar o prazo", async () => {
    const { api } = await import("./client");
    const { catalogApi } = await import("./services");
    const { resolveProductWithTimeout, classifyResolveError } = await import("./import-errors");
    const original = api.post;
    let received: AbortSignal | undefined;
    api.post = ((_path: string, _body: unknown, options?: { signal?: AbortSignal }) => {
      received = options?.signal;
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new DOMException("abort", "AbortError")));
      });
    }) as unknown as typeof api.post;
    try {
      const error = await resolveProductWithTimeout((p, o) => catalogApi.resolveProduct(p, o), previewTeste, 20).catch((e) => e);
      assert.ok(received, "sinal repassado a api.post");
      assert.equal(received?.aborted, true);
      assert.equal(classifyResolveError(error), "unavailable");
    } finally { api.post = original; }
  });

  it("resolveProduct devolve existing_listing e o gate bloqueia", async () => {
    const { api } = await import("./client");
    const { catalogApi } = await import("./services");
    const { evaluateImportGate, importGateMessage } = await import("@/utils/display/import-gate");
    const original = api.post;
    api.post = (async () => ({
      resolution: "existing_listing", matched_by: "store_identity", created: false,
      product: { id: "produto-teste", title: "Produto teste", attributes: {}, listings: [], images: [], created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    })) as unknown as typeof api.post;
    try {
      const result = await catalogApi.resolveProduct(previewTeste);
      assert.equal(result.kind, "existing_listing");
      const gate = evaluateImportGate({ resolutionStatus: "ready", resolution: result, duplicateProduct: null, reviewDecision: null });
      assert.equal(gate.canApprove, false);
      assert.match(importGateMessage(gate.reason), /já cadastrado/);
    } finally { api.post = original; }
  });
});
