import type { CatalogStore } from "@/utils/api/contracts";

export type StoreLookup = {
  storeKey?: string | null;
  url?: string | null;
  displayName?: string | null;
  country?: string | null;
};

export function storesHaveProcessingLogo(stores: CatalogStore[]): boolean {
  return stores.some((store) => store.logo_processing_status === "pending" || store.logo_processing_status === "processing");
}

function normalizeStoreKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeHost(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(candidate).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizedCountry(value: string | null | undefined): string {
  const country = value?.trim().toUpperCase();
  if (country === "BR" || country === "BRA" || country === "BRASIL" || country === "BRAZIL") return "BR";
  if (["US", "USA", "EUA", "UNITED STATES", "UNITED STATES OF AMERICA"].includes(country ?? "")) return "US";
  return country ?? "";
}

function matchesHost(store: CatalogStore, host: string): boolean {
  if (!host) return false;
  const domains = store.domains?.length ? store.domains : [store.hostname];
  return domains.some((domain) => {
    const normalizedDomain = normalizeHost(domain);
    return normalizedDomain && (host === normalizedDomain || host.endsWith(`.${normalizedDomain}`));
  });
}

/** Resolve a registry entry from the available canonical key, URL, or display label. */
export function findCatalogStore(stores: CatalogStore[], lookup: StoreLookup): CatalogStore | null {
  const key = lookup.storeKey ? normalizeStoreKey(lookup.storeKey) : "";
  if (key) {
    const byKey = stores.find((store) => normalizeStoreKey(store.id) === key);
    if (byKey) return byKey;
  }

  const host = normalizeHost(lookup.url);
  if (host) {
    const byHost = stores.find((store) => matchesHost(store, host));
    if (byHost) return byHost;
  }

  const name = lookup.displayName?.trim().toLocaleLowerCase("pt-BR");
  if (!name) return null;
  const byName = stores.filter((store) => store.name.trim().toLocaleLowerCase("pt-BR") === name);
  if (byName.length === 1) return byName[0];

  const country = normalizedCountry(lookup.country);
  if (country && byName.length > 1) {
    return byName.find((store) => normalizedCountry(store.country) === country) ?? null;
  }
  return null;
}
