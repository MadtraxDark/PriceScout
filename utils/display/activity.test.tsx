import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { before, describe, it } from "node:test";
import type { ActivityItem } from "../api/contracts";
import { activityContext, activityHref, activityTime, activityTitle, mergeActivities } from "./activity";

// Test-only fixtures: no demonstration data is shipped to the interface.
function item(type: ActivityItem["type"] = "price_changed", currency = "BRL"): ActivityItem {
  return {
    id: "offer:test", type, occurred_at: "2026-10-07T21:42:00Z",
    product: { id: "test-product", title: "Produto de teste isolado", brand: "Marca de teste", primary_image_url: null },
    store: { key: "kabum", display_name: "KaBuM!" },
    offer: { listing_id: "test-listing", old_currency: currency, currency, old_price: "2499.90", new_price: "2199.90", old_price_kind: "regular", new_price_kind: "regular", price_direction: "decreased", old_availability: "available", availability: "available", available: true, promotion_expires_at: null },
  };
}

const normalized = (text: string | null) => text?.replaceAll("\u00a0", " ");

describe("persistent catalog activity", () => {
  before(() => { process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000"; });
  it("formats price drops in BRL", () => {
    assert.equal(normalized(activityTitle(item())), "Preço caiu de R$ 2.499,90 para R$ 2.199,90");
  });
  it("formats USD without converting it", () => {
    assert.equal(normalized(activityTitle(item("price_changed", "USD"))), "Preço caiu de US$ 2.499,90 para US$ 2.199,90");
  });
  it("distinguishes increases and currency changes", () => {
    const value = item();
    value.offer!.price_direction = "increased";
    assert.match(activityTitle(value)!, /Preço subiu/);
    value.offer!.price_direction = null;
    value.offer!.old_currency = "USD";
    assert.equal(normalized(activityTitle(value)), "Preço alterado de US$ 2.499,90 para R$ 2.199,90");
  });
  it("uses local pt-BR time for today, yesterday and older days", () => {
    const at = new Date(2026, 9, 7, 18, 42);
    assert.equal(activityTime(at.toISOString(), new Date(2026, 9, 7, 20)).label, "18:42");
    assert.equal(activityTime(at.toISOString(), new Date(2026, 9, 8, 20)).label, "Ontem, 18:42");
    assert.equal(activityTime(at.toISOString(), new Date(2026, 9, 9, 20)).label, "07/10/2026 · 18:42");
    assert.match(activityTime(at.toISOString()).full, /07\/10\/2026/);
  });
  it("provides a real product destination", () => {
    assert.equal(activityHref(item()), "/admin/produtos/test-product");
  });
  it("uses different messages for all business events without inventing causes", () => {
    const expected: Array<[ActivityItem["type"], RegExp]> = [
      ["product_added", /adicionado ao catálogo/], ["new_offer", /Nova oferta encontrada por/],
      ["offer_removed", /Oferta de .* removida/], ["out_of_stock", /Oferta de .* ficou sem estoque/],
      ["promotion_activated", /Promoção ativada por/], ["promotion_expired", /Promoção de .* encerrada/],
      ["promotion_updated", /Promoção alterada de/], ["availability_changed", /Oferta voltou a ficar disponível/],
    ];
    for (const [type, pattern] of expected) assert.match(activityTitle(item(type))!, pattern);
    assert.doesNotMatch(activityContext(item("offer_removed")), /promoção|encerrada/);
    assert.match(activityContext(item("promotion_expired")), /promocional/);
    assert.doesNotMatch(activityContext(item("promotion_expired")), /Oferta não está/);
  });
  it("omits technical and unknown events rather than inventing a removal", () => {
    assert.equal(activityTitle({ ...item(), type: "scrape_failed" as ActivityItem["type"] }), null);
  });
  it("does not invent prices when currency or evidence is missing", () => {
    const value = item("offer_removed");
    value.offer!.old_currency = null;
    assert.equal(activityTitle(value), "Oferta removida");
    value.offer!.old_currency = "BRL";
    value.offer!.old_price = null;
    assert.equal(activityTitle(value), "Oferta removida");
  });
  it("merges pages without duplicates in descending order", () => {
    const old = { ...item(), id: "offer:old", occurred_at: "2026-10-06T10:00:00Z" };
    assert.deepEqual(mergeActivities([old], [item(), old]).map((row) => row.id), ["offer:test", "offer:old"]);
  });
  async function render(props: Partial<import("@/components/CatalogActivity").CatalogActivityViewProps> = {}) {
    const { CatalogActivityView } = await import("@/components/CatalogActivity");
    return renderToStaticMarkup(createElement(CatalogActivityView, { items: [], loading: false, error: "", nextCursor: null, loadMore: () => {}, ...props }));
  }
  it("renders compact feed with thumbnail, timestamp and product link", async () => {
    const value = item();
    value.product.primary_image_url = "/products/test/images/test/content?variant=optimized";
    const html = await render({ items: [value] });
    assert.match(html, /activity-row activity-price-down/);
    assert.match(html, /src="http:\/\/localhost:8000\/products\/test\/images\/test\/content/);
    assert.match(html, /href="\/admin\/produtos\/test-product"/);
    assert.match(html, /dateTime="2026-10-07T21:42:00Z"/);
    assert.match(html, /KaBuM!/);
  });
  it("uses existing missing-image fallback without a broken img", async () => {
    const html = await render({ items: [item()] });
    assert.match(html, /Nenhuma imagem dispon/);
    assert.doesNotMatch(html, /<img/);
  });
  it("renders loading, empty and discrete error states", async () => {
    assert.match(await render({ loading: true }), /Carregando atividades/);
    assert.match(await render(), /Nenhuma atividade registrada/);
    const error = await render({ error: "Falha de teste" });
    assert.match(error, /Falha de teste/);
    assert.match(error, /Tentar novamente/);
    assert.doesNotMatch(error, /Nenhuma atividade registrada/);
  });
  it("links to the full changes page when more activity exists", async () => {
    const withCursor = await render({ items: [item()], nextCursor: "test-cursor" });
    assert.match(withCursor, /href="\/admin\/catalogo\/alteracoes"[^>]*>Ver mais<\/a>/);
    assert.doesNotMatch(withCursor, /Ver menos|Carregar mais atividades/);
    assert.doesNotMatch(await render({ items: [item()] }), /Ver mais/);
    assert.match(await render({ items: [item()], nextCursor: "test-cursor", loading: true }), /href="\/admin\/catalogo\/alteracoes"/);
  });
  it("keeps the overview activity summary capped at five rows", async () => {
    const items = Array.from({ length: 7 }, (_, index) => ({ ...item(), id: `offer:${index}` }));
    const html = await render({ items });
    assert.equal((html.match(/class="activity-row/g) ?? []).length, 5);
    assert.match(html, /href="\/admin\/catalogo\/alteracoes"[^>]*>Ver mais<\/a>/);
  });
  it("never renders scrape_failed in the main feed", async () => {
    const html = await render({ items: [{ ...item(), type: "scrape_failed" as ActivityItem["type"] }] });
    assert.doesNotMatch(html, /removida|scrape_failed/);
  });
  it("API service requests persistent cursor pages without caching", async () => {
    const original = globalThis.fetch;
    let requested = "";
    globalThis.fetch = async (url) => {
      requested = String(url);
      return new Response(JSON.stringify({ items: [item()], next_cursor: "next" }), { headers: { "content-type": "application/json" } });
    };
    try {
      const { catalogApi } = await import("../api/services");
      const page = await catalogApi.listActivity({ cursor: "previous", limit: 10 });
      assert.match(requested, /products\/activity/);
      assert.match(requested, /cursor=previous/);
      assert.match(requested, /limit=10/);
      assert.equal(page.next_cursor, "next");
    } finally { globalThis.fetch = original; }
  });
});
