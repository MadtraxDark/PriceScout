/**
 * Labels comerciais de condição/carrier para cards de oferta (pt-BR).
 * Valores crus da API (renewed, refurbished, …) nunca devem aparecer na UI.
 */

export type OfferConditionFields = {
  condition?: string | null;
  condition_grade?: string | null;
  carrier?: string | null;
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Novo",
  renewed: "Renovado",
  refurbished: "Recondicionado",
  used: "Usado",
  open_box: "Caixa aberta",
};

export function conditionRank(condition: string | null | undefined): number {
  const code = (condition || "unknown").toLowerCase();
  if (code === "new" || code === "unknown" || !code) return 0;
  if (code === "renewed" || code === "refurbished") return 1;
  if (code === "open_box") return 2;
  if (code === "used") return 3;
  return 1;
}

export function formatOfferConditionLabel(
  offer: OfferConditionFields,
): string | null {
  const code = (offer.condition || "").toLowerCase().trim();
  if (!code || code === "new" || code === "unknown") {
    // Novo implícito: só destaca quando há grade/carrier especiais.
    if (offer.carrier) return null;
    return null;
  }
  const base = CONDITION_LABELS[code] ?? null;
  if (!base) return null;
  const grade = (offer.condition_grade || "").toLowerCase().trim();
  if (code === "renewed" && grade === "premium") {
    return "Renovado Premium";
  }
  return base;
}

export function formatOfferCarrierLabel(
  carrier: string | null | undefined,
): string | null {
  const raw = (carrier || "").trim();
  if (!raw) return null;
  const folded = raw.toLowerCase();
  if (folded === "unlocked" || folded === "carrier unlocked" || folded === "sim free") {
    return "Desbloqueado";
  }
  if (folded === "verizon") return "Verizon";
  if (folded === "at&t" || folded === "att") return "AT&T";
  if (folded === "t-mobile" || folded === "tmobile") return "T-Mobile";
  return raw;
}

export function isFactoryNewCondition(
  condition: string | null | undefined,
): boolean {
  const code = (condition || "unknown").toLowerCase();
  return !code || code === "new" || code === "unknown";
}
