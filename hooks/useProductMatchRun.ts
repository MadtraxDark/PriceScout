"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import toast from "react-hot-toast";
import { catalogApi } from "@/utils/api/services";
import type { MatchRunStatus, MatchRunStatusView } from "@/utils/api/contracts";
import {
  elapsedSecondsSince,
  formatElapsedHhMmSs,
  isActiveMatchRunStatus,
  isTerminalMatchRunStatus,
  isValidActiveMatchRun,
  getMatchRunError,
  matchRunErrorReducer,
} from "@/utils/match-run";
import { playMatchCompleteSound } from "@/utils/match-sound";

const POLL_INTERVAL_MS = 4000;
const ELAPSED_TICK_MS = 1000;
const RATE_LIMIT_BACKOFF_MS = 15_000;

/** Deduplica toast/som por run_id na sessão do browser. */
const toastedRunIds = new Set<string>();

function notifyTerminalTransition(run: MatchRunStatusView): void {
  if (toastedRunIds.has(run.id)) return;
  toastedRunIds.add(run.id);

  if (run.status === "completed") {
    const parts = [
      `Busca concluída: ${run.matches_found} oferta(s)`,
      run.errors > 0 ? `${run.errors} erro(s)` : null,
    ].filter(Boolean);
    toast.success(parts.join(" · "));
    void playMatchCompleteSound();
    return;
  }

  if (run.status === "failed") {
    if (run.failure_code === "worker_lost") {
      toast.error("Busca anterior foi interrompida.");
    } else {
      toast.error(run.failure_message || "A busca em outras lojas falhou.");
    }
    void playMatchCompleteSound();
  }
}

export type UseProductMatchRunResult = {
  activeRun: MatchRunStatusView | null;
  isActive: boolean;
  isStarting: boolean;
  elapsedLabel: string;
  error: string;
  start: () => Promise<void>;
  refreshActive: () => Promise<void>;
};

/**
 * Observa Match Run ativa do produto via polling.
 * Abort no unmount cancela apenas o ciclo de polling — nunca a Run no backend.
 */
export function useProductMatchRun(
  productId: string,
  options: { onTerminal?: (run: MatchRunStatusView) => void } = {},
): UseProductMatchRunResult {
  const [activeRun, setActiveRun] = useState<MatchRunStatusView | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [errorState, dispatchError] = useReducer(matchRunErrorReducer, {
    startError: "",
    pollError: "",
  });

  const previousStatusRef = useRef<MatchRunStatus | null>(null);
  const watchingRunIdRef = useRef<string | null>(null);
  const startInFlightRef = useRef(false);
  const onTerminalRef = useRef(options.onTerminal);
  const rateLimitedUntilRef = useRef(0);

  useEffect(() => {
    onTerminalRef.current = options.onTerminal;
  }, [options.onTerminal]);

  const handleSnapshot = useCallback((run: MatchRunStatusView | null) => {
    if (!run) {
      setActiveRun(null);
      previousStatusRef.current = null;
      watchingRunIdRef.current = null;
      return;
    }

    const previous = previousStatusRef.current;
    const wasActive = previous === "pending" || previous === "running";
    const isTerminal = isTerminalMatchRunStatus(run.status);

    watchingRunIdRef.current = run.id;

    if (wasActive && isTerminal) {
      notifyTerminalTransition(run);
      onTerminalRef.current?.(run);
      setActiveRun(null);
      previousStatusRef.current = null;
      watchingRunIdRef.current = null;
      return;
    }

    if (isActiveMatchRunStatus(run.status)) {
      previousStatusRef.current = run.status;
      setActiveRun(run);
      return;
    }

    // Terminal sem ter observado ativo nesta sessão — sem toast.
    setActiveRun(null);
    previousStatusRef.current = null;
    watchingRunIdRef.current = null;
  }, []);

  const poll = useCallback(async () => {
    if (!productId) return;
    if (Date.now() < rateLimitedUntilRef.current) return;
    try {
      const active = await catalogApi.getActiveMatchRun(productId);
      if (active) {
        if (!isValidActiveMatchRun(active, productId)) {
          throw new Error("A API retornou um estado inválido para a busca ativa.");
        }
        handleSnapshot(active);
        dispatchError({ type: "poll_succeeded" });
        return;
      }

      const watchingId = watchingRunIdRef.current;
      const previous = previousStatusRef.current;
      if (watchingId && (previous === "pending" || previous === "running")) {
        const terminal = await catalogApi.getMatchRun(watchingId);
        handleSnapshot(terminal);
        dispatchError({ type: "poll_succeeded" });
        return;
      }

      if (watchingRunIdRef.current || previousStatusRef.current) {
        handleSnapshot(null);
      }
      dispatchError({ type: "poll_succeeded" });
    } catch (pollError) {
      if (pollError instanceof DOMException && pollError.name === "AbortError") return;
      const status =
        pollError && typeof pollError === "object" && "status" in pollError
          ? Number((pollError as { status: unknown }).status)
          : null;
      const retryAfter =
        pollError && typeof pollError === "object" && "retry_after" in pollError
          ? Number((pollError as { retry_after: unknown }).retry_after)
          : null;
      if (status === 429) {
        const waitMs =
          Number.isFinite(retryAfter) && (retryAfter as number) > 0
            ? Math.min(60_000, Math.max(5_000, (retryAfter as number) * 1000))
            : RATE_LIMIT_BACKOFF_MS;
        rateLimitedUntilRef.current = Date.now() + waitMs;
        return;
      }
      dispatchError({
        type: "poll_failed",
        message: pollError instanceof Error ? pollError.message : "Não foi possível consultar a busca ativa.",
      });
    }
  }, [handleSnapshot, productId]);

  const refreshActive = useCallback(async () => {
    await poll();
  }, [poll]);

  const start = useCallback(async () => {
    if (!productId || startInFlightRef.current || isStarting) return;
    if (activeRun && isActiveMatchRunStatus(activeRun.status)) return;
    startInFlightRef.current = true;
    setIsStarting(true);
    dispatchError({ type: "start_requested" });
    try {
      const run = await catalogApi.startMatchRun(productId);
      if (!isValidActiveMatchRun(run, productId)) {
        throw new Error("A API respondeu sem confirmar uma busca ativa válida.");
      }
      watchingRunIdRef.current = run.id;
      previousStatusRef.current = run.status;
      setActiveRun(run);
      dispatchError({ type: "start_succeeded" });
      if (run.already_active) {
        toast("Já existe uma busca em andamento para este produto.");
      } else {
        toast.success("Busca em outras lojas iniciada.");
      }
    } catch (startError) {
      dispatchError({
        type: "start_failed",
        message: startError instanceof Error ? startError.message : "Não foi possível iniciar a busca em outras lojas.",
      });
    } finally {
      startInFlightRef.current = false;
      setIsStarting(false);
    }
  }, [activeRun, isStarting, productId]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    const controller = new AbortController();

    const initialTimer = window.setTimeout(() => {
      if (!cancelled && !controller.signal.aborted) void poll();
    }, 0);
    const timer = window.setInterval(() => {
      if (!cancelled && !controller.signal.aborted) void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [poll, productId]);

  // Timer local de elapsed (1s) — não faz request de status.
  const isActive = Boolean(activeRun && isActiveMatchRunStatus(activeRun.status));
  useEffect(() => {
    if (!isActive) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), ELAPSED_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const timerAnchor =
    activeRun?.active_since || activeRun?.claimed_at || activeRun?.started_at;
  const elapsedLabel =
    isActive && timerAnchor
      ? formatElapsedHhMmSs(elapsedSecondsSince(timerAnchor, nowMs))
      : "00:00:00";

  return {
    activeRun,
    isActive,
    isStarting,
    elapsedLabel,
    error: getMatchRunError(errorState),
    start,
    refreshActive,
  };
}
