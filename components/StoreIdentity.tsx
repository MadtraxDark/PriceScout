"use client";

import { useCallback, useState } from "react";
import { ImageWithState } from "@/components/ImageViewer";
import type { CatalogStore } from "@/utils/api/contracts";
import { storeLogoDataUrl } from "@/utils/store-logo";

function storeInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("pt-BR") || "LO";
}

export function shouldShowStoreInitials(logoSrc: string | null, failedLogoSrc: string | null): boolean {
  return !logoSrc || failedLogoSrc === logoSrc;
}

function countryCode(label: string): "BR" | "US" | null {
  if (label === "Amazon Brasil") return "BR";
  if (label === "Amazon EUA") return "US";
  return null;
}

export function StoreIdentity({ store, label }: { store: CatalogStore | null; label: string }) {
  const logoSrc = store?.logo_url || (store?.logo_svg ? storeLogoDataUrl(store.logo_svg) : null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const handleImageFailure = useCallback(() => {
    if (logoSrc) setFailedSrc(logoSrc);
  }, [logoSrc]);
  const country = countryCode(label);

  return <div className="persisted-store-identity">
    {logoSrc && !shouldShowStoreInitials(logoSrc, failedSrc)
      ? <ImageWithState className="persisted-store-logo" src={logoSrc} alt={`Logo de ${label}`} showFallbackLabel={false} allowRetry={false} onImageError={handleImageFailure} />
      : <span className="persisted-store-mark" aria-hidden="true">{storeInitials(label)}</span>}
    <strong>{label}</strong>
    {country && <span className="persisted-store-country" aria-label={country === "BR" ? "Brasil" : "Estados Unidos"}>{country}</span>}
  </div>;
}
