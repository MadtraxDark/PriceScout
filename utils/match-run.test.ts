import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  elapsedSecondsSince,
  formatElapsedHhMmSs,
  isActiveMatchRunStatus,
  isTerminalMatchRunStatus,
  isValidActiveMatchRun,
} from "./match-run.ts";

describe("formatElapsedHhMmSs", () => {
  it("formata zero", () => {
    assert.equal(formatElapsedHhMmSs(0), "00:00:00");
  });

  it("formata horas minutos segundos", () => {
    assert.equal(formatElapsedHhMmSs(3661), "01:01:01");
  });

  it("nao permite negativo", () => {
    assert.equal(formatElapsedHhMmSs(-5), "00:00:00");
  });
});

describe("elapsedSecondsSince", () => {
  it("calcula segundos a partir de ISO", () => {
    const started = new Date("2026-09-22T12:00:00.000Z").toISOString();
    const now = Date.parse("2026-09-22T12:00:10.000Z");
    assert.equal(elapsedSecondsSince(started, now), 10);
  });

  it("retorna 0 para ISO invalido", () => {
    assert.equal(elapsedSecondsSince("nao-e-data"), 0);
  });
});

describe("status helpers", () => {
  it("identifica status ativo", () => {
    assert.equal(isActiveMatchRunStatus("pending"), true);
    assert.equal(isActiveMatchRunStatus("running"), true);
    assert.equal(isActiveMatchRunStatus("completed"), false);
  });

  it("identifica status terminal", () => {
    assert.equal(isTerminalMatchRunStatus("completed"), true);
    assert.equal(isTerminalMatchRunStatus("failed"), true);
    assert.equal(isTerminalMatchRunStatus("running"), false);
  });
});

describe("isValidActiveMatchRun", () => {
  it("aceita confirmação ativa do produto solicitado", () => {
    assert.equal(
      isValidActiveMatchRun(
        { id: "run-1", product_id: "product-1", status: "pending" },
        "product-1",
      ),
      true,
    );
  });

  it("rejeita resposta sem run, de outro produto ou terminal", () => {
    assert.equal(isValidActiveMatchRun(null, "product-1"), false);
    assert.equal(
      isValidActiveMatchRun(
        { id: "run-1", product_id: "product-2", status: "running" },
        "product-1",
      ),
      false,
    );
    assert.equal(
      isValidActiveMatchRun(
        { id: "run-1", product_id: "product-1", status: "failed" },
        "product-1",
      ),
      false,
    );
  });
});
