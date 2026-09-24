import type { MatchStoreRunStatus } from "@/utils/api/contracts";
import { isBlank, warnUnknownLabel } from "./labels";

export const MATCH_STORE_STATUS_LABELS: Record<MatchStoreRunStatus, string> = {
  pending: "Aguardando",
  running: "Em andamento",
  match: "Correspondência encontrada",
  no_match: "Sem correspondência",
  error: "Erro durante a busca",
};

const UNKNOWN = "Status desconhecido";

/**
 * User-facing label for per-store match-run outcomes.
 */
export function matchStoreStatusLabel(value: string | null | undefined): string {
  if (isBlank(value)) return "—";
  const key = value.trim() as MatchStoreRunStatus;
  if (key in MATCH_STORE_STATUS_LABELS) {
    return MATCH_STORE_STATUS_LABELS[key];
  }
  warnUnknownLabel("matchStoreStatus", value);
  return UNKNOWN;
}
