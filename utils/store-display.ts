/**
 * Fallback labels when API omits `display_name`.
 * Prefer `StoreInfo.display_name` / `store_display_name` from ScoutApiV2.
 * Never invent names with `.replace("_", " ")` — unknown IDs use a neutral label.
 */
const STORE_DISPLAY_NAMES: Record<string, string> = {
  amazon: "Amazon",
  amazon_br: "Amazon Brasil",
  amazon_us: "Amazon US",
  amazon_com_br: "Amazon Brasil",
  amazon_brasil: "Amazon Brasil",
  kabum: "KaBuM!",
  magazine_luiza: "Magazine Luiza",
  magazineluiza: "Magazine Luiza",
  mercado_livre: "Mercado Livre",
  mercadolivre: "Mercado Livre",
  pichau: "Pichau",
  terabyte: "TerabyteShop",
  terabyteshop: "TerabyteShop",
  shopee: "Shopee",
  aliexpress: "AliExpress",
  bestbuy: "Best Buy",
  nissei: "Nissei",
  shoppingchina: "Shopping China",
  shopping_china: "Shopping China",
  visaovip: "Visão VIP",
  visao_vip: "Visão VIP",
  cellshop: "Cellshop",
  stargames: "Star Games",
  ebay: "eBay",
  gamestop: "GameStop",
  newegg: "Newegg",
  microcenter: "Micro Center",
};

function normalizeStoreId(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Resolve a user-facing store label.
 * Prefer an explicit API `displayName` when provided by the caller.
 */
export function getStoreDisplayName(
  storeId?: string | null,
  url?: string | null,
  apiDisplayName?: string | null,
): string {
  if (apiDisplayName && apiDisplayName.trim()) {
    return apiDisplayName.trim();
  }
  const normalizedId = storeId ? normalizeStoreId(storeId) : "";
  if (normalizedId && STORE_DISPLAY_NAMES[normalizedId]) {
    return STORE_DISPLAY_NAMES[normalizedId];
  }

  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      if (hostname === "amazon.com.br" || hostname.endsWith(".amazon.com.br")) {
        return "Amazon Brasil";
      }
      if (hostname === "amazon.com" || hostname.endsWith(".amazon.com")) {
        return "Amazon US";
      }
      const byHostname = STORE_DISPLAY_NAMES[normalizeStoreId(hostname.split(".")[0])];
      if (byHostname) return byHostname;
      // Hostname is a public domain, not an internal snake_case id.
      return hostname;
    } catch {
      // URL inválida — cai no fallback neutro abaixo.
    }
  }

  if (normalizedId && process.env.NODE_ENV !== "production") {
    console.warn("[display] Unknown store label:", normalizedId);
  }

  return "Loja desconhecida";
}
