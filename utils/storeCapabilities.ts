/**
 * Resolve store crawl capabilities from GET /stores — no per-store if/else.
 */

export type StoreCapability = {
  key: string;
  domains: string[];
  implemented: boolean;
  supports_images: boolean;
  image_fetch_cost: "low" | "high" | "unsupported";
  default_include_images: boolean;
};

export function matchStoreByHostname(
  hostname: string | null | undefined,
  stores: StoreCapability[],
): StoreCapability | null {
  if (!hostname) return null;
  const host = hostname.trim().toLowerCase().replace(/^www\./, "");
  if (!host) return null;
  for (const store of stores) {
    for (const domain of store.domains) {
      const d = domain.toLowerCase().replace(/^www\./, "");
      if (host === d || host.endsWith(`.${d}`)) {
        return store;
      }
    }
  }
  return null;
}

export function defaultIncludeImagesForStore(
  store: StoreCapability | null,
): boolean {
  if (!store || !store.supports_images) return false;
  return store.default_include_images === true;
}
