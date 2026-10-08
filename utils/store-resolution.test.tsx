import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreIdentity } from "@/components/StoreIdentity";
import { shouldShowStoreInitials } from "@/components/StoreIdentity";
import type { CatalogStore } from "@/utils/api/contracts";
import { findCatalogStore, storesHaveProcessingLogo } from "@/utils/store-resolution";
import { getStoreDisplayName } from "@/utils/store-display";

function store(values: Partial<CatalogStore> & Pick<CatalogStore, "id" | "name" | "hostname" | "country">): CatalogStore {
  return {
    url: `https://${values.hostname}`,
    currency: values.country === "US" ? "USD" : "BRL",
    productCount: 0,
    updated_at: "",
    ...values,
  };
}

const stores = [
  store({ id: "amazon_br", name: "Amazon Brasil", hostname: "amazon.com.br", country: "BR", domains: ["amazon.com.br"], logo_url: "https://media.invalid/amazon-br.webp" }),
  store({ id: "amazon_us", name: "Amazon EUA", hostname: "amazon.com", country: "US", domains: ["amazon.com"], logo_url: "https://media.invalid/amazon-us.webp" }),
  store({ id: "magazineluiza", name: "Magazine Luiza", hostname: "magazineluiza.com.br", country: "BR", domains: ["magazineluiza.com.br"], logo_svg: "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>" }),
  store({ id: "shoppingchina", name: "Shopping China", hostname: "shop.example.py", country: "PY", domains: ["shop.example.py"] }),
];

test("resolve registry entry by store key before seller/display labels", () => {
  assert.equal(findCatalogStore(stores, { storeKey: "magazineluiza", displayName: "KaBuM!" })?.id, "magazineluiza");
});

test("resolve Amazon Brasil and EUA by canonical key and URL", () => {
  assert.equal(findCatalogStore(stores, { storeKey: "amazon_br", url: "https://amazon.com/dp/item" })?.id, "amazon_br");
  assert.equal(findCatalogStore(stores, { url: "https://www.amazon.com/dp/item", displayName: "Amazon" })?.id, "amazon_us");
});

test("Amazon live labels retain the market from the matched country", () => {
  assert.equal(getStoreDisplayName("amazon_br", "https://amazon.com.br/item", "Amazon BR", "BR"), "Amazon Brasil");
  assert.equal(getStoreDisplayName("amazon_us", "https://amazon.com/item", "Amazon US", "US"), "Amazon EUA");
});

test("resolve a store by URL or exact display name", () => {
  assert.equal(findCatalogStore(stores, { url: "https://www.shop.example.py/item" })?.id, "shoppingchina");
  assert.equal(findCatalogStore(stores, { displayName: "Shopping China" })?.id, "shoppingchina");
});

test("StoreIdentity renders URL logo without initials", () => {
  const markup = renderToStaticMarkup(createElement(StoreIdentity, { store: stores[0], label: "Amazon Brasil" }));
  assert.match(markup, /https:\/\/media\.invalid\/amazon-br\.webp/);
  assert.match(markup, /Amazon Brasil/);
  assert.doesNotMatch(markup, /persisted-store-mark/);
  assert.match(markup, /Brasil/);
});

test("StoreIdentity converts registry SVG to a data URL", () => {
  const markup = renderToStaticMarkup(createElement(StoreIdentity, { store: stores[2], label: "Magazine Luiza" }));
  assert.match(markup, /data:image\/svg\+xml/);
  assert.doesNotMatch(markup, /persisted-store-mark/);
});

test("StoreIdentity uses initials only when registry has no logo", () => {
  const noLogo = stores[3];
  const markup = renderToStaticMarkup(createElement(StoreIdentity, { store: noLogo, label: noLogo.name }));
  assert.match(markup, /persisted-store-mark/);
  assert.match(markup, />SC</);
  assert.doesNotMatch(markup, /persisted-store-logo/);
});

test("StoreIdentity falls back to initials after the logo source fails", () => {
  assert.equal(shouldShowStoreInitials("https://media.invalid/logo.webp", "https://media.invalid/logo.webp"), true);
  assert.equal(shouldShowStoreInitials("https://media.invalid/logo.webp", null), false);
});

test("logo polling is active only while registry metadata reports processing", () => {
  const pending = store({ ...stores[0], logo_processing_status: "pending" });
  const processing = store({ ...stores[1], logo_processing_status: "processing" });
  const ready = store({ ...stores[2], logo_processing_status: "ready" });
  assert.equal(storesHaveProcessingLogo([pending]), true);
  assert.equal(storesHaveProcessingLogo([processing]), true);
  assert.equal(storesHaveProcessingLogo([ready]), false);
});

test("marketplace seller does not replace the storefront identity", () => {
  const matchingStore = findCatalogStore(stores, { storeKey: "magazineluiza", displayName: "KaBuM!" });
  const markup = renderToStaticMarkup(createElement(StoreIdentity, { store: matchingStore, label: "Magazine Luiza" }));
  assert.match(markup, /Magazine Luiza/);
  assert.doesNotMatch(markup, /KaBuM!/);
  assert.doesNotMatch(markup, /persisted-store-country/);
  assert.match(markup, /data:image\/svg\+xml/);
});
