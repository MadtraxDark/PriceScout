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
  country?: string | null,
): string {
  const normalizedId = storeId ? normalizeStoreId(storeId) : "";
  const amazonId = normalizedId === "amazon" || normalizedId.startsWith("amazon_");
  let hostname = "";
  if (url) {
    try {
      const candidateUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `https://${url}`;
      hostname = new URL(candidateUrl).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      // A URL invÃ¡lida nÃ£o deve impedir o uso dos outros dados da loja.
    }
  }
  const amazonHost = hostname === "amazon.com.br"
    || hostname.endsWith(".amazon.com.br")
    || hostname === "amazon.com"
    || hostname.endsWith(".amazon.com");
  const isAmazon = amazonId || amazonHost;

  if (isAmazon) {
    const normalizedCountry = country?.trim().toUpperCase();
    if (["BR", "BRA", "BRASIL", "BRAZIL"].includes(normalizedCountry ?? "")) {
      return "Amazon Brasil";
    }
    if (["US", "USA", "EUA", "UNITED STATES", "UNITED STATES OF AMERICA"].includes(normalizedCountry ?? "")) {
      return "Amazon EUA";
    }
    if (hostname === "amazon.com.br" || hostname.endsWith(".amazon.com.br")) {
      return "Amazon Brasil";
    }
    if (hostname === "amazon.com" || hostname.endsWith(".amazon.com")) {
      return "Amazon EUA";
    }
  }

  if (apiDisplayName && apiDisplayName.trim()) {
    return apiDisplayName.trim();
  }
  if (normalizedId && STORE_DISPLAY_NAMES[normalizedId]) {
    return STORE_DISPLAY_NAMES[normalizedId];
  }

  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
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
