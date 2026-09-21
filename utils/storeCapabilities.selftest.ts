/**
 * Lightweight assertions for store capability helpers (no test runner yet).
 * Run: node --experimental-strip-types utils/storeCapabilities.selftest.ts
 */
import {
  defaultIncludeImagesForStore,
  matchStoreByHostname,
  type StoreCapability,
} from "./storeCapabilities.ts";

const stores: StoreCapability[] = [
  {
    key: "magazineluiza",
    domains: ["magazineluiza.com.br"],
    implemented: true,
    supports_images: true,
    image_fetch_cost: "low",
    default_include_images: true,
  },
  {
    key: "shopee",
    domains: ["shopee.com.br"],
    implemented: true,
    supports_images: true,
    image_fetch_cost: "high",
    default_include_images: false,
  },
];

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(
  matchStoreByHostname("www.magazineluiza.com.br", stores)?.key === "magazineluiza",
  "magalu hostname",
);
assert(
  defaultIncludeImagesForStore(matchStoreByHostname("magazineluiza.com.br", stores)) === true,
  "magalu default on",
);
assert(
  defaultIncludeImagesForStore(matchStoreByHostname("shopee.com.br", stores)) === false,
  "shopee default off",
);
assert(matchStoreByHostname("unknown.example", stores) === null, "unknown");

console.log("storeCapabilities.selftest: ok");
