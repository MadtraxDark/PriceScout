import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateImportGate, importGateMessage, IMPORT_GATE_MESSAGES, type ResolutionStatus } from "./import-gate";

type Kind = "new_product" | "existing_listing" | "existing_product_new_listing" | "needs_review";
const gate = (resolutionStatus: ResolutionStatus, kind: Kind | null, reviewDecision: unknown = null, duplicateProduct: unknown = null) =>
  evaluateImportGate({ resolutionStatus, resolution: kind ? { kind } : null, duplicateProduct, reviewDecision });

describe("import gate (identificadores genericos, somente testes)", () => {
  it("bloqueia quando a consulta nao concluiu, mesmo com resolucao presente", () => {
    for (const status of ["idle", "loading", "error", "unavailable", "conflict"] as const) {
      for (const kind of [null, "new_product", "existing_product_new_listing", "needs_review"] as const) {
        const result = gate(status, kind, { kind: "create" });
        assert.equal(result.canApprove, false, `${status}/${kind}`);
      }
    }
  });

  it("ready sem resolucao falha fechado", () => {
    assert.deepEqual(gate("ready", null), { canApprove: false, state: "not_checked", reason: "not_checked" });
  });

  it("libera produto novo e nova oferta de produto existente", () => {
    assert.equal(gate("ready", "new_product").canApprove, true);
    assert.equal(gate("ready", "existing_product_new_listing").canApprove, true);
  });

  it("existing_listing e bloqueado como ja cadastrado", () => {
    assert.deepEqual(gate("ready", "existing_listing"), { canApprove: false, state: "already_registered", reason: "already_registered" });
    assert.equal(gate("ready", "existing_listing", { kind: "create" }).canApprove, false);
  });

  it("needs_review exige decisao", () => {
    assert.equal(gate("ready", "needs_review").state, "review_required");
    assert.equal(gate("ready", "needs_review").canApprove, false);
    assert.equal(gate("ready", "needs_review", { kind: "attach", productId: "produto-teste" }).canApprove, true);
  });

  it("duplicateProduct conhecido bloqueia sempre", () => {
    assert.equal(gate("ready", "new_product", null, { id: "produto-teste" }).canApprove, false);
  });

  it("tipo de resolucao desconhecido falha fechado", () => {
    const result = evaluateImportGate({ resolutionStatus: "ready", resolution: { kind: "x" as never }, duplicateProduct: null, reviewDecision: null });
    assert.equal(result.canApprove, false);
  });

  it("mensagens de apresentacao nao expoem codigos crus e existem para todo motivo", () => {
    for (const [reason, text] of Object.entries(IMPORT_GATE_MESSAGES)) {
      assert.ok(text.length > 0);
      assert.doesNotMatch(text, /_/, reason);
    }
    assert.match(importGateMessage("already_registered"), /já cadastrado/);
    assert.equal(importGateMessage(undefined), IMPORT_GATE_MESSAGES.not_checked);
    assert.doesNotMatch(importGateMessage("unavailable"), /não criará duplicidades/i);
  });
});
