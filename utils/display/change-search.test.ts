import assert from "node:assert/strict";
import test from "node:test";
import { highlightParts, searchTerms } from "./change-search";
import { changeFilterError, changeFiltersKey, changeQuery, filtersFromParams, changeLabel } from "./changes";

test("accent and case folding preserve the exact original text", () => {
  const parts = highlightParts("Câmera da ÉLITE, câmera móvel", "CAMERA elite");
  assert.equal(parts.map((part) => part.text).join(""), "Câmera da ÉLITE, câmera móvel");
  assert.deepEqual(parts.filter((part) => part.matched).map((part) => part.text), ["Câmera", "ÉLITE", "câmera"]);
});

test("overlapping, repeated and adjacent matches are merged", () => {
  assert.deepEqual(highlightParts("banana", "ana banana ana"), [{ text: "banana", matched: true }]);
  assert.deepEqual(highlightParts("abc", "a bc"), [{ text: "abc", matched: true }]);
  assert.deepEqual(searchTerms(" São  SAO José "), ["sao", "jose"]);
});

test("search punctuation is literal and text remains text", () => {
  const text = '<script>alert("100%_[x]")</script>';
  const parts = highlightParts(text, "%_[x]");
  assert.equal(parts.map((part) => part.text).join(""), text);
  assert.deepEqual(parts.filter((part) => part.matched), [{ text: "%_[x]", matched: true }]);
});

test("UTF-16 offsets after non-BMP characters remain correct", () => {
  assert.deepEqual(highlightParts("𝄞 Câmera", "camera"), [{ text: "𝄞 ", matched: false }, { text: "Câmera", matched: true }]);
  assert.deepEqual(highlightParts("Câmera", ""), [{ text: "Câmera", matched: false }]);
});

test("date range includes the entire final day in local time", () => {
  const filters = filtersFromParams(new URLSearchParams("from=2026-10-07&to=2026-10-07&q=camera"));
  const query = changeQuery(filters);
  const start = new Date(query.started_at!);
  const end = new Date(query.ended_at!);
  assert.equal(start.getDate(), 7);
  assert.equal(start.getHours(), 0);
  assert.equal(end.getDate(), 8);
  assert.equal(end.getHours(), 0);
  assert.equal(query.q, "camera");
});

test("invalid dates and inverted ranges fail without an HTTP request", () => {
  for (const search of ["from=2026-02-30", "from=2026-10-08&to=2026-10-07", "from=bad"]) {
    assert.throws(() => changeQuery(filtersFromParams(new URLSearchParams(search))));
  }
  assert.equal(changeLabel("future_event"), "Outro evento registrado");
});

test("incremental URL preserves filters and encodes literal search text", () => {
  const filters = filtersFromParams(new URLSearchParams("event_type=seller_changed&store=kabum&from=2026-10-07&product_id=test-isolated"));
  filters.q = " São José & 100%_ ";
  const restored = filtersFromParams(new URLSearchParams(changeFiltersKey(filters)));
  assert.deepEqual(restored, { ...filters, q: filters.q.trim() });
  assert.equal(changeFilterError(restored), "");
});

test("invalid incremental drafts do not produce valid searches", () => {
  const filters = filtersFromParams(new URLSearchParams());
  assert.match(changeFilterError({ ...filters, q: "a b c d e f g h i" }), /oito termos/);
  assert.match(changeFilterError({ ...filters, q: "x".repeat(201) }), /200 caracteres/);
  assert.match(changeFilterError({ ...filters, from: "2026-02-30" }), /data válida/);
  assert.equal(changeFilterError({ ...filters, q: "" }), "");
});
