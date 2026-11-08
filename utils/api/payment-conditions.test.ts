import assert from "node:assert/strict";
import test from "node:test";
import {
  cashDiscountFromMetadata,
  cashDiscountLabel,
  installmentInterestFreeFromMetadata,
  installmentTotalFromMetadata,
  pixDiscountPercentFor,
} from "./payment-conditions";

const metadata = {
  pricing: {
    cash_discount_percent: "10",
    cash_discount_method: "credit_card",
    installment_total: "11999.00",
    installment_interest_free: true,
  },
};

test("desconto à vista no cartão é lido de metadata.pricing", () => {
  const discount = cashDiscountFromMetadata(metadata);
  assert.deepEqual(discount, { percent: 10, method: "credit_card" });
  assert.equal(cashDiscountLabel(discount!), "10% de desconto à vista no cartão de crédito");
  assert.equal(installmentTotalFromMetadata(metadata), 11999);
  assert.equal(installmentInterestFreeFromMetadata(metadata), true);
});

test("metadata ausente ou inválida não inventa condições", () => {
  assert.equal(cashDiscountFromMetadata(undefined), null);
  assert.equal(cashDiscountFromMetadata({ pricing: { cash_discount_percent: "100" } }), null);
  assert.equal(cashDiscountFromMetadata({ pricing: { cash_discount_percent: "abc" } }), null);
  assert.equal(installmentTotalFromMetadata({ pricing: { installment_total: "0" } }), null);
  assert.equal(installmentInterestFreeFromMetadata({}), null);
});

test("desconto percentual só é atribuído ao Pix quando existe preço Pix", () => {
  assert.equal(pixDiscountPercentFor(null, 11999, 10), null);
  assert.equal(pixDiscountPercentFor(900, 1000, null), 10);
  assert.equal(pixDiscountPercentFor(900, null, 10), 10);
});
