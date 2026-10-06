import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRetryAfter, RequestFlights, retryDelayMs } from "./request-control";

describe("controle de requests, fixtures isoladas", () => {
  it("aceita segundos, datas HTTP e espera longa sem truncar", () => {
    const now = Date.UTC(2026, 9, 5);
    assert.equal(parseRetryAfter("120", now), 120);
    assert.equal(parseRetryAfter(new Date(now + 120_000).toUTCString(), now), 120);
    assert.equal(parseRetryAfter(new Date(now - 1000).toUTCString(), now), 0);
    for (const invalid of ["", "-1", "1.5", "120oops", "Infinity"]) {
      assert.equal(parseRetryAfter(invalid, now), null);
    }
    assert.equal(retryDelayMs(0, 120), 120_000);
    assert.equal(retryDelayMs(10, 600), 600_000);
    const delay = retryDelayMs(10);
    assert.ok(delay >= 30_000 && delay <= 60_000);
  });

  it("deduplica trabalho e cancela somente o consumidor que desistiu", async () => {
    const flights = new RequestFlights();
    const firstController = new AbortController();
    let calls = 0;
    let transportSignal: AbortSignal | undefined;
    let resolve!: (value: string) => void;
    const task = (signal: AbortSignal) => {
      calls += 1;
      transportSignal = signal;
      return new Promise<string>((done) => { resolve = done; });
    };
    const first = flights.run("consulta", task, firstController.signal);
    const second = flights.run("consulta", task);
    await Promise.resolve();
    firstController.abort();
    await assert.rejects(first, { name: "AbortError" });
    assert.equal(transportSignal?.aborted, false);
    resolve("resposta");
    assert.equal(await second, "resposta");
    assert.equal(calls, 1);
    assert.equal(await flights.run("consulta", async () => "nova resposta"), "nova resposta");
  });

  it("aborta transporte quando todos os consumidores cancelam e permite nova consulta", async () => {
    const flights = new RequestFlights();
    const controller = new AbortController();
    let signal: AbortSignal | undefined;
    const first = flights.run("consulta", async (sharedSignal) => {
      signal = sharedSignal;
      return new Promise<void>((_resolve, reject) => {
        sharedSignal.addEventListener("abort", () => reject(sharedSignal.reason), { once: true });
      });
    }, controller.signal);
    await Promise.resolve();
    controller.abort();
    await assert.rejects(first, { name: "AbortError" });
    await Promise.resolve();
    assert.equal(signal?.aborted, true);
    assert.equal(await flights.run("consulta", async () => "nova"), "nova");
  });
});
