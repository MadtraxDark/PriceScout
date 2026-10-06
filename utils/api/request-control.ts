/** Segundos ou data HTTP; valores invalidos nao criam uma espera. */
export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  if (/^\d+$/.test(text)) {
    const seconds = Number(text);
    return Number.isFinite(seconds) ? seconds : null;
  }
  if (/^[\d.+-]+$/.test(text)) return null;
  const deadline = Date.parse(text);
  return Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export function retryDelayMs(attempt: number, retryAfter: number | null = null): number {
  if (retryAfter !== null && Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.max(1000, retryAfter * 1000);
  }
  const base = Math.min(60_000, 2000 * 2 ** Math.min(attempt, 5));
  return Math.round(base / 2 + Math.random() * base / 2);
}

type Flight<T> = {
  controller: AbortController;
  promise: Promise<T>;
  consumers: number;
  settled: boolean;
};

/** Somente trabalho em voo; nao armazena respostas ou credenciais persistentes. */
export class RequestFlights {
  private readonly flights = new Map<string, Flight<unknown>>();

  run<T>(key: string, task: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal | null): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason ?? new DOMException("Cancelado", "AbortError"));
    let flight = this.flights.get(key) as Flight<T> | undefined;
    if (!flight || flight.controller.signal.aborted) {
      const controller = new AbortController();
      const created: Flight<T> = {
        controller, consumers: 0, settled: false,
        promise: Promise.resolve().then(() => task(controller.signal)),
      };
      flight = created;
      this.flights.set(key, created);
      void created.promise.then(() => finish(), () => finish());
      const finish = () => {
        created.settled = true;
        if (this.flights.get(key) === created) this.flights.delete(key);
      };
    }
    const shared = flight;
    shared.consumers += 1;
    return new Promise<T>((resolve, reject) => {
      let finished = false;
      const release = () => {
        if (finished) return false;
        finished = true;
        signal?.removeEventListener("abort", onAbort);
        shared.consumers -= 1;
        queueMicrotask(() => {
          if (!shared.settled && shared.consumers === 0) shared.controller.abort();
        });
        return true;
      };
      const onAbort = () => {
        if (release()) reject(signal?.reason ?? new DOMException("Cancelado", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      shared.promise.then(
        (result) => { if (release()) resolve(result); },
        (error: unknown) => { if (release()) reject(error); },
      );
    });
  }
}
