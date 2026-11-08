/**
 * Condições de pagamento vindas de `metadata.pricing` da API.
 * Funções puras: um desconto à vista no cartão nunca é tratado como Pix.
 */

export type CashDiscountMethod = "credit_card" | "card" | "boleto" | "pix" | "other";

export type CashDiscount = { percent: number; method: CashDiscountMethod | null };

const METHODS: readonly string[] = ["credit_card", "card", "boleto", "pix", "other"];

function pricingOf(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") return {};
  const pricing = (metadata as { pricing?: unknown }).pricing;
  return pricing && typeof pricing === "object" ? (pricing as Record<string, unknown>) : {};
}

function positiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function cashDiscountFromMetadata(metadata: unknown): CashDiscount | null {
  const pricing = pricingOf(metadata);
  const percent = positiveNumber(pricing.cash_discount_percent);
  if (percent === null || percent >= 100) return null;
  const method = typeof pricing.cash_discount_method === "string" && METHODS.includes(pricing.cash_discount_method)
    ? (pricing.cash_discount_method as CashDiscountMethod)
    : null;
  return { percent, method };
}

export function installmentTotalFromMetadata(metadata: unknown): number | null {
  return positiveNumber(pricingOf(metadata).installment_total);
}

export function installmentInterestFreeFromMetadata(metadata: unknown): boolean | null {
  const value = pricingOf(metadata).installment_interest_free;
  return typeof value === "boolean" ? value : null;
}

/** Desconto atribuído ao Pix somente quando existe preço Pix. */
export function pixDiscountPercentFor(
  pix: number | null,
  original: number | null,
  discountPercentage: number | null,
): number | null {
  if (pix === null) return null;
  if (original !== null && original > 0) return Math.round(((original - pix) / original) * 100);
  return discountPercentage;
}

const METHOD_LABELS: Record<CashDiscountMethod, string> = {
  credit_card: "no cartão de crédito",
  card: "no cartão",
  boleto: "no boleto",
  pix: "no Pix",
  other: "",
};

export function cashDiscountLabel(discount: CashDiscount): string {
  const method = discount.method ? METHOD_LABELS[discount.method] : "";
  return `${discount.percent}% de desconto à vista${method ? ` ${method}` : ""}`;
}
