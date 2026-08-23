export type StoreDetection = {
  hostname: string;
  scraperKey: string;
  supported: boolean;
};

// A loja só é suportada quando existir um scraper implementado e registrado aqui.
// Não incluir domínios fictícios ou de demonstração neste registro.
const SCRAPER_REGISTRY = new Set<string>();

export function detectStoreFromUrl(value: string): StoreDetection | null {
  if (!value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!hostname) return null;

    return {
      hostname,
      scraperKey: `host:${hostname}`,
      supported: SCRAPER_REGISTRY.has(hostname),
    };
  } catch {
    return null;
  }
}
