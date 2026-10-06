import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchDecisionLabel,
  matchRunStatusLabel,
  matchStoreStatusLabel,
  notificationTypeLabel,
} from "./index.ts";
import { getStoreDisplayName } from "../store-display.ts";
import { imageAvailabilityView } from "./image-availability.ts";

describe("imageAvailabilityView", () => {
  it("uses a safe Portuguese label for each image state", () => {
    for (const status of ["missing", "processing", "temporarily_unavailable", "permission_denied", "not_found", "storage_error", "invalid_reference", "load_failed"] as const) {
      const view = imageAvailabilityView(status);
      assert.equal(view.status, status);
      assert.ok(view.message.length > 0);
      assert.doesNotMatch(view.message, /_/);
    }
  });

  it("permits retry only for retryable storage availability failures", () => {
    assert.equal(imageAvailabilityView("temporarily_unavailable", true).retryable, true);
    assert.equal(imageAvailabilityView("storage_error", true).retryable, true);
    assert.equal(imageAvailabilityView("not_found", true).retryable, false);
    assert.equal(imageAvailabilityView("permission_denied", true).retryable, false);
  });
});

describe("matchDecisionLabel", () => {
  it("mapeia auto_match para label amigavel", () => {
    assert.equal(matchDecisionLabel("auto_match"), "Correspondência automática");
  });

  it("mapeia review e reject", () => {
    assert.equal(matchDecisionLabel("review"), "Revisão necessária");
    assert.equal(matchDecisionLabel("reject"), "Não corresponde");
  });

  it("nunca devolve o enum cru para valor desconhecido", () => {
    const label = matchDecisionLabel("future_internal_status");
    assert.equal(label, "Status desconhecido");
    assert.doesNotMatch(label, /_/);
  });

  it("trata vazio com traco", () => {
    assert.equal(matchDecisionLabel(null), "—");
    assert.equal(matchDecisionLabel(""), "—");
  });
});

describe("matchRunStatusLabel", () => {
  it("mapeia statuses da run", () => {
    assert.equal(matchRunStatusLabel("pending"), "Aguardando");
    assert.equal(matchRunStatusLabel("running"), "Em andamento");
    assert.equal(matchRunStatusLabel("completed"), "Concluída");
    assert.equal(matchRunStatusLabel("failed"), "Falhou");
    assert.equal(matchRunStatusLabel("cancelled"), "Cancelada");
  });

  it("fallback seguro para desconhecido", () => {
    assert.equal(matchRunStatusLabel("in_progress"), "Status desconhecido");
  });
});

describe("matchStoreStatusLabel", () => {
  it("mapeia outcomes por loja", () => {
    assert.equal(matchStoreStatusLabel("match"), "Correspondência encontrada");
    assert.equal(matchStoreStatusLabel("no_match"), "Sem correspondência");
    assert.equal(matchStoreStatusLabel("error"), "Erro durante a busca");
  });
});

describe("notificationTypeLabel", () => {
  it("mapeia tipos internos", () => {
    assert.equal(notificationTypeLabel("PRODUCT_MATCH_COMPLETED"), "Busca concluída");
    assert.equal(notificationTypeLabel("PRODUCT_MATCH_FAILED"), "Busca não concluída");
  });

  it("nao vaza tipo desconhecido", () => {
    assert.equal(notificationTypeLabel("PRODUCT_MATCH_SOMETHING"), "Tipo desconhecido");
  });
});

describe("getStoreDisplayName", () => {
  it("mapeia amazon_br", () => {
    assert.equal(getStoreDisplayName("amazon_br"), "Amazon Brasil");
  });

  it("nao beautifica snake_case desconhecido", () => {
    assert.equal(getStoreDisplayName("loja_fantasma_xyz"), "Loja desconhecida");
  });

  it("prefere display_name da API", () => {
    assert.equal(getStoreDisplayName("amazon_br", null, "Amazon BR API"), "Amazon BR API");
  });

  it("usa o país estruturado para distinguir ofertas Amazon mesmo com nome genérico", () => {
    assert.equal(getStoreDisplayName("amazon", "https://www.amazon.com/item", "Amazon", "BR"), "Amazon Brasil");
    assert.equal(getStoreDisplayName("amazon", "https://www.amazon.com.br/item", "Amazon", "US"), "Amazon EUA");
  });

  it("usa o domínio como fallback quando o país não está disponível", () => {
    assert.equal(getStoreDisplayName("amazon", "https://www.amazon.com.br/item"), "Amazon Brasil");
    assert.equal(getStoreDisplayName("amazon", "https://www.amazon.com/item"), "Amazon EUA");
  });

  it("mantém os nomes das demais lojas inalterados", () => {
    assert.equal(getStoreDisplayName("bestbuy", "https://www.bestbuy.com", "Best Buy", "US"), "Best Buy");
  });
});
