"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { CatalogStore } from "@/utils/api/contracts";

export type StoreConfigurationValues = {
  name: string;
  url: string;
  country: string;
  currency: string;
  logo_svg?: string | null;
  logo_file?: File | null;
};

export type StoreConfigurationFormProps = {
  store: Partial<CatalogStore>;
  onSave: (values: StoreConfigurationValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function storeLogoDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function persistedLogoPreview(store: Partial<CatalogStore>): string {
  return store.logo_url ?? (store.logo_svg ? storeLogoDataUrl(store.logo_svg) : "");
}

const logoExtensions = new Set(["svg", "png", "webp", "avif", "jpg", "jpeg"]);
const logoMimeTypes = new Set([
  "image/svg+xml",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jpeg",
]);

export default function StoreConfigurationForm({
  store,
  onSave,
  onCancel,
  submitLabel = "Salvar alterações",
}: StoreConfigurationFormProps) {
  const [name, setName] = useState(store.name ?? "");
  const [url] = useState(store.url ?? "");
  const [market] = useState(`${store.country ?? "BR"}:${store.currency ?? "BRL"}`);
  const [logoSvg, setLogoSvg] = useState(store.logo_svg ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(() => persistedLogoPreview(store));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const selectedMarketIsSupported = (store.supported_country_currency_pairs ?? [[store.country ?? "BR", store.currency ?? "BRL"]]).some(([country, currency]) => `${country}:${currency}` === market);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function clearLocalLogoSelection() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setLogoFile(null);
    setLogoSvg(store.logo_svg ?? "");
    setLogoPreview(persistedLogoPreview(store));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMarketIsSupported) {
      setError("Selecione uma combinação de país e moeda disponível.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await onSave({
        name: name.trim(),
        url: url.trim(),
        country: store.country ?? "BR",
        currency: store.currency ?? "BRL",
        logo_svg: logoFile ? undefined : logoSvg || null,
        logo_file: logoFile,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a loja.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!logoMimeTypes.has(file.type) || !logoExtensions.has(extension ?? "")) {
      clearLocalLogoSelection();
      event.target.value = "";
      setError("Selecione SVG, PNG, WebP, AVIF, JPG ou JPEG.");
      return;
    }
    if (file.size === 0 || file.size > 2 * 1024 * 1024) {
      clearLocalLogoSelection();
      event.target.value = "";
      setError("A logo deve ter conteúdo e no máximo 2 MB.");
      return;
    }

    const previousObjectUrl = objectUrlRef.current;
    const nextObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextObjectUrl;
    setLogoFile(file);
    setLogoSvg("");
    setLogoPreview(nextObjectUrl);
    setError("");
    if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
  }

  return (
    <form className="store-configuration-form" onSubmit={handleSubmit}>
      <div className="store-editor-fields">
        <label>
          Nome da loja
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} />
        </label>
        <label>
          Domínio
          <input type="url" value={url} readOnly />
          <small>Domínio associado ao adapter pré-cadastrado.</small>
        </label>
        <label>
          País e moeda
          <input value={`${store.country ?? "BR"} · ${store.currency ?? "BRL"}`} readOnly />
          <small>País e moeda são definidos pela integração.</small>
        </label>
      </div>
      <div className="store-editor-logo">
        <div>
          <span className="field-label">Logo da loja</span>
          <p className="helper">SVG, PNG, WebP, AVIF, JPG ou JPEG até 2 MB. A prévia muda ao selecionar; a logo é salva ao confirmar.</p>
          <label className="store-logo-upload">
            <input
              type="file"
              accept="image/svg+xml,image/png,image/webp,image/avif,image/jpeg,.svg,.png,.webp,.avif,.jpg,.jpeg"
              onChange={handleLogo}
              disabled={saving}
            />
            Escolher arquivo
          </label>
        </div>
        <div className="store-logo-preview">
          {logoPreview
            ? <img src={logoPreview} alt="Prévia da logo da loja" />
            : <span>Logo não cadastrada</span>}
        </div>
      </div>
      {error && <p className="error-notice" role="alert">{error}</p>}
      <div className="store-editor-actions">
        <button className="outline-button" type="button" onClick={onCancel} disabled={saving}>Cancelar</button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
