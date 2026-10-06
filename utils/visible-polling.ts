import { retryDelayMs } from "./api/request-control";

/** Um request por ciclo; eventos de foco compartilham a consulta em andamento. */
export function startVisiblePolling(
  task: (signal: AbortSignal) => Promise<void>,
  interval: () => number,
  onError: (error: unknown) => void = () => undefined,
  initialDelay = 0,
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight: Promise<void> | null = null;
  let failures = 0;
  let notBefore = 0;
  let lastFinished = -Infinity;

  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (controller.signal.aborted || document.visibilityState !== "visible") return;
    timer = setTimeout(() => { void refresh(); }, Math.min(2_147_483_647, Math.max(0, delay)));
  };

  const refresh = (): Promise<void> => {
    if (controller.signal.aborted || document.visibilityState !== "visible") return Promise.resolve();
    if (flight) return flight;
    if (Date.now() < notBefore) {
      schedule(notBefore - Date.now());
      return Promise.resolve();
    }
    if (Date.now() - lastFinished < 500) {
      schedule(interval());
      return Promise.resolve();
    }
    clearTimeout(timer);
    const promise = Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return task(controller.signal);
    }).then(() => {
      failures = 0;
      notBefore = 0;
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const retryAfter = error && typeof error === "object" && "retry_after" in error
        ? (error as { retry_after: unknown }).retry_after : null;
      const delay = retryDelayMs(failures++, typeof retryAfter === "number" ? retryAfter : null);
      notBefore = Date.now() + delay;
      onError(error);
    }).finally(() => {
      flight = null;
      lastFinished = Date.now();
      schedule(notBefore > Date.now() ? notBefore - Date.now() : interval());
    });
    flight = promise;
    return promise;
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") void refresh();
    else clearTimeout(timer);
  };
  const onFocus = () => { void refresh(); };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onFocus);
  schedule(initialDelay);

  return {
    refresh,
    stop() {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    },
  };
}
