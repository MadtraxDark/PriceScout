import type { MatchRunStatus } from "@/utils/api/contracts";
import { isBlank, warnUnknownLabel } from "./labels";

export const MATCH_RUN_STATUS_LABELS: Record<MatchRunStatus, string> = {
  pending: "Aguardando",
  running: "Em andamento",
  completed: "Concluída",
  failed: "Falhou",
  cancelled: "Cancelada",
};

const UNKNOWN = "Status desconhecido";

/**
 * User-facing label for persistent match-run status.
 */
export function matchRunStatusLabel(value: string | null | undefined): string {
  if (isBlank(value)) return "—";
  const key = value.trim() as MatchRunStatus;
  if (key in MATCH_RUN_STATUS_LABELS) {
    return MATCH_RUN_STATUS_LABELS[key];
  }
  warnUnknownLabel("matchRunStatus", value);
  return UNKNOWN;
}

/** Label amigável quando failure_code=worker_lost. */
export function matchRunFailureLabel(
  status: string | null | undefined,
  failureCode: string | null | undefined,
): string | null {
  if (status === "failed" && failureCode === "worker_lost") {
    return "Interrompida";
  }
  return null;
}
