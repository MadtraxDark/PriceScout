/** Formata segundos decorridos como HH:MM:SS. */
export function formatElapsedHhMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Segundos desde `startedAtIso` até `nowMs` (Date.now()). */
export function elapsedSecondsSince(startedAtIso: string, nowMs: number = Date.now()): number {
  const started = Date.parse(startedAtIso);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((nowMs - started) / 1000));
}

export type MatchRunErrorState = {
  startError: string;
  pollError: string;
};

export type MatchRunErrorAction =
  | { type: "start_requested" }
  | { type: "start_succeeded" }
  | { type: "start_failed"; message: string }
  | { type: "poll_succeeded" }
  | { type: "poll_failed"; message: string };

export function matchRunErrorReducer(
  state: MatchRunErrorState,
  action: MatchRunErrorAction,
): MatchRunErrorState {
  switch (action.type) {
    case "start_requested":
      return { startError: "", pollError: "" };
    case "start_succeeded":
      return { startError: "", pollError: "" };
    case "start_failed":
      return { ...state, startError: action.message };
    case "poll_succeeded":
      return { ...state, pollError: "" };
    case "poll_failed":
      return { ...state, pollError: action.message };
  }
}

export function getMatchRunError(state: MatchRunErrorState): string {
  return state.startError || state.pollError;
}

export function isActiveMatchRunStatus(status: string | null | undefined): boolean {
  return status === "pending" || status === "running";
}

export function isTerminalMatchRunStatus(status: string | null | undefined): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}
import type { MatchRunStatusView } from "./api/contracts";


/** Valida a confirmação mínima da API antes de ativar a busca no frontend. */
export function isValidActiveMatchRun(
  run: unknown,
  productId: string,
): run is MatchRunStatusView {
  if (!run || typeof run !== "object") return false;
  const value = run as Record<string, unknown>;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.product_id === productId &&
    isActiveMatchRunStatus(
      typeof value.status === "string" ? value.status : null,
    )
  );
}
