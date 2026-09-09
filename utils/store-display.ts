const STORE_DISPLAY_NAMES: Record<string, string> = {
  amazon: "Amazon",
  amazon_com_br: "Amazon",
  amazon_brasil: "Amazon",
  kabum: "KaBuM!",
  magazine_luiza: "Magazine Luiza",
  magazineluiza: "Magazine Luiza",
  mercado_livre: "Mercado Livre",
  mercadolivre: "Mercado Livre",
  pichau: "Pichau",
  terabyte: "TerabyteShop",
  terabyteshop: "TerabyteShop",
};

function normalizeStoreId(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getStoreDisplayName(storeId?: string | null, url?: string | null): string {
  const normalizedId = storeId ? normalizeStoreId(storeId) : "";
  if (normalizedId && STORE_DISPLAY_NAMES[normalizedId]) return STORE_DISPLAY_NAMES[normalizedId];

  if (url) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      const byHostname = STORE_DISPLAY_NAMES[normalizeStoreId(hostname.split(".")[0])];
      if (byHostname) return byHostname;
      return hostname;
    } catch {
      // Sem URL valida, o identificador continua como ultimo recurso legivel.
    }
  }

  return normalizedId && normalizedId !== "generic" && normalizedId !== "desconhecido"
    ? normalizedId.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())
    : "Loja nao identificada";
}
