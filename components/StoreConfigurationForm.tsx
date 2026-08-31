"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { CatalogStore, StoreMarketOption } from "@/utils/api/contracts";

export type StoreConfigurationValues = {
  name: string;
  url: string;
  country: string;
  currency: string;
  logo_svg?: string | null;
};

export type StoreConfigurationFormProps = {
  store: Partial<CatalogStore>;
  markets: StoreMarketOption[];
  onSave: (values: StoreConfigurationValues) => Promise<void>;
  onCancel: () => void;
  onLogoUpload?: (file: File) => Promise<string>;
  submitLabel?: string;
};

export function storeLogoDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function StoreConfigurationForm({ store, markets, onSave, onCancel, onLogoUpload, submitLabel = "Salvar alterações" }: StoreConfigurationFormProps) {
  const [name, setName] = useState(store.name ?? "");
  const [url, setUrl] = useState(store.url ?? "");
  const [market, setMarket] = useState(`${store.country ?? "BR"}:${store.currency ?? "BRL"}`);
  const [logoSvg, setLogoSvg] = useState(store.logo_svg ?? "");
  const [logoPreview, setLogoPreview] = useState(store.logo_svg ? storeLogoDataUrl(store.logo_svg) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const availableMarkets = markets.length > 0 ? markets : [{ country: store.country ?? "BR", country_name: store.country ?? "BR", currency: store.currency ?? "BRL", currency_name: store.currency ?? "BRL" }];
  const selectedMarket = availableMarkets.find((item) => `${item.country}:${item.currency}` === market);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMarket) { setError("Selecione uma combinação de país e moeda disponível."); return; }
    try {
      setSaving(true);
      setError("");
      await onSave({ name: name.trim(), url: url.trim(), country: selectedMarket.country, currency: selectedMarket.currency, logo_svg: logoSvg || null });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a loja.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") { setError("Selecione um arquivo SVG."); return; }
    try {
      const value = onLogoUpload ? await onLogoUpload(file) : await file.text();
      setLogoSvg(value);
      setLogoPreview(value ? storeLogoDataUrl(value) : "");
      setError("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível ler a logo SVG.");
    }
  }

  return <form className="store-configuration-form" onSubmit={handleSubmit}><div className="store-editor-fields"><label>Nome da loja<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} /></label><label>Domínio<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></label><label>País e moeda<select value={market} onChange={(event) => setMarket(event.target.value)} required>{availableMarkets.map((item) => <option key={`${item.country}:${item.currency}`} value={`${item.country}:${item.currency}`}>{item.country_name} · {item.country} / {item.currency} — {item.currency_name}</option>)}</select></label></div><div className="store-editor-logo"><div><span className="field-label">Logo da loja</span><p className="helper">SVG até 1 MB. A nova logo substitui a atual ao salvar.</p><label className="store-logo-upload"><input type="file" accept="image/svg+xml,.svg" onChange={handleLogo} />Escolher arquivo SVG</label></div><div className="store-logo-preview">{logoPreview ? <img src={logoPreview} alt="Prévia da logo da loja" /> : <span>Logo não cadastrada</span>}</div></div>{error && <p className="error-notice" role="alert">{error}</p>}<div className="store-editor-actions"><button className="outline-button" type="button" onClick={onCancel}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : submitLabel}</button></div></form>;
}
