import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  comparablePriceBrl,
  formatMoney,
  sortOffersByComparableBrl,
  type OfferMoneyFields,
} from "./money.ts";

describe("formatMoney", () => {
  it("formata BRL sem linha de conversão", () => {
    assert.equal(formatMoney(5399, "BRL"), "R$\u00a05.399,00");
  });

  it("formata USD", () => {
    assert.equal(formatMoney(857.3, "USD"), "US$\u00a0857,30");
  });

  it("formata PYG com símbolo ₲", () => {
    assert.equal(formatMoney(6_274_000, "PYG"), "₲ 6.274.000");
  });
});

describe("comparablePriceBrl", () => {
  it("usa preço local para BRL", () => {
    const offer: OfferMoneyFields = {
      currency: "BRL",
      pix_price: 5399,
      card_price: 5998.89,
    };
    assert.equal(comparablePriceBrl(offer), 5399);
  });

  it("usa converted_price_brl para USD", () => {
    const offer: OfferMoneyFields = {
      currency: "USD",
      card_price: 857,
      converted_price_brl: 4700,
    };
    assert.equal(comparablePriceBrl(offer), 4700);
  });

  it("não usa raw estrangeiro quando conversão falta", () => {
    const offer: OfferMoneyFields = {
      currency: "USD",
      card_price: 857,
      converted_price_brl: null,
    };
    assert.equal(comparablePriceBrl(offer), null);
  });
});

describe("MENOR PREÇO / sorting", () => {
  const usd: OfferMoneyFields = {
    currency: "USD",
    card_price: 857,
    converted_price_brl: 4700,
  };
  const brl: OfferMoneyFields = {
    currency: "BRL",
    pix_price: 5399,
  };
  const pyg: OfferMoneyFields = {
    currency: "PYG",
    card_price: 6_274_000,
    converted_price_brl: 4500,
  };

  it("escolhe Shopping China (PYG convertido) como menor", () => {
    const sorted = [usd, brl, pyg].sort(sortOffersByComparableBrl);
    assert.equal(comparablePriceBrl(sorted[0]!), 4500);
    assert.equal(sorted[0]!.currency, "PYG");
  });

  it("ordena ascendente por BRL normalizado", () => {
    const sorted = [usd, brl, pyg].sort(sortOffersByComparableBrl);
    assert.deepEqual(
      sorted.map((o) => comparablePriceBrl(o)),
      [4500, 4700, 5399],
    );
  });

  it("prefere New sobre Renewed antes do preço", () => {
    const renewedCheap: OfferMoneyFields = {
      currency: "USD",
      card_price: 599,
      converted_price_brl: 3300,
      condition: "renewed",
    };
    const newPricier: OfferMoneyFields = {
      currency: "USD",
      card_price: 799,
      converted_price_brl: 4400,
      condition: "new",
    };
    const sorted = [renewedCheap, newPricier].sort(sortOffersByComparableBrl);
    assert.equal(sorted[0]!.condition, "new");
    assert.equal(sorted[1]!.condition, "renewed");
  });

  it("exclui USD sem conversão da comparação numérica", () => {
    const unavailable: OfferMoneyFields = {
      currency: "USD",
      card_price: 857,
      converted_price_brl: null,
    };
    const sorted = [unavailable, brl].sort(sortOffersByComparableBrl);
    assert.equal(sorted[0]!.currency, "BRL");
    assert.equal(comparablePriceBrl(sorted[0]!), 5399);
    assert.equal(comparablePriceBrl(sorted[1]!), null);
  });

  it("não compara raw USD com BRL", () => {
    const wrongIfRaw = comparablePriceBrl({
      currency: "USD",
      card_price: 857,
      converted_price_brl: null,
    });
    assert.notEqual(wrongIfRaw, 857);
    assert.equal(wrongIfRaw, null);
  });
});

describe("stale conversion", () => {
  it("continua comparável quando converted existe e status=stale", () => {
    const offer: OfferMoneyFields = {
      currency: "USD",
      card_price: 857.3,
      converted_price_brl: 4732.58,
      exchange_rate_status: "stale",
    };
    assert.equal(comparablePriceBrl(offer), 4732.58);
    assert.match(formatMoney(offer.converted_price_brl, "BRL"), /4\.732,58/);
    assert.match(formatMoney(offer.card_price, "USD"), /857,30/);
  });
});
