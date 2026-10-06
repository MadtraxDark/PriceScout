import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { startVisiblePolling } from "./visible-polling";

const descriptors = new Map(["window", "document"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
let documentTarget: EventTarget & { visibilityState: string };
let windowTarget: EventTarget;
let polling: ReturnType<typeof startVisiblePolling> | undefined;
async function flush() { for (let index = 0; index < 20; index += 1) await Promise.resolve(); }

describe("polling visivel, ambiente simulado isolado", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    documentTarget = Object.assign(new EventTarget(), { visibilityState: "visible" });
    windowTarget = new EventTarget();
    Object.defineProperty(globalThis, "document", { configurable: true, value: documentTarget });
    Object.defineProperty(globalThis, "window", { configurable: true, value: windowTarget });
  });
  afterEach(() => {
    polling?.stop();
    polling = undefined;
    mock.timers.reset();
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  it("aguarda resposta lenta antes de agendar proximo ciclo", async () => {
    let calls = 0;
    let complete!: () => void;
    let signal: AbortSignal | undefined;
    polling = startVisiblePolling(async (currentSignal) => {
      calls += 1;
      signal = currentSignal;
      await new Promise<void>((resolve) => { complete = resolve; });
    }, () => 4000);
    mock.timers.tick(0);
    await flush();
    mock.timers.tick(20_000);
    windowTarget.dispatchEvent(new Event("focus"));
    await flush();
    assert.equal(calls, 1);
    complete();
    await flush();
    mock.timers.tick(3999);
    await flush();
    assert.equal(calls, 1);
    mock.timers.tick(1);
    await flush();
    assert.equal(calls, 2);
    polling.stop();
    assert.equal(signal?.aborted, true);
    complete();
    await flush();
    mock.timers.tick(20_000);
    await flush();
    assert.equal(calls, 2);
  });

  it("pausa em aba oculta e deduplica eventos ao voltar", async () => {
    let calls = 0;
    documentTarget.visibilityState = "hidden";
    polling = startVisiblePolling(async () => { calls += 1; }, () => 4000);
    mock.timers.tick(60_000);
    await flush();
    assert.equal(calls, 0);
    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("focus"));
    await flush();
    assert.equal(calls, 1);
    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    mock.timers.tick(60_000);
    await flush();
    assert.equal(calls, 1);
  });

  it("espera Retry-After completo mesmo com foco e atualizacao manual", async () => {
    let calls = 0;
    polling = startVisiblePolling(async () => {
      if (++calls === 1) throw { status: 429, retry_after: 120 };
    }, () => 4000);
    mock.timers.tick(0);
    await flush();
    mock.timers.tick(60_000);
    windowTarget.dispatchEvent(new Event("focus"));
    await polling.refresh();
    assert.equal(calls, 1);
    mock.timers.tick(59_999);
    await flush();
    assert.equal(calls, 1);
    mock.timers.tick(1);
    await flush();
    assert.equal(calls, 2);
  });
});
