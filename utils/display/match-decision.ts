import type { MatchHit } from "@/utils/api/contracts";
import { isBlank, warnUnknownLabel } from "./labels";

export type MatchDecision = MatchHit["decision"];

export const MATCH_DECISION_LABELS: Record<MatchDecision, string> = {
  auto_match: "Correspondência automática",
  review: "Revisão necessária",
  reject: "Não corresponde",
};

const UNKNOWN = "Status desconhecido";

/**
 * User-facing label for product-match decisions.
 * Never returns the raw enum (e.g. auto_match).
 */
export function matchDecisionLabel(value: string | null | undefined): string {
  if (isBlank(value)) return "—";
  const key = value.trim() as MatchDecision;
  if (key in MATCH_DECISION_LABELS) {
    return MATCH_DECISION_LABELS[key];
  }
  warnUnknownLabel("matchDecision", value);
  return UNKNOWN;
}
