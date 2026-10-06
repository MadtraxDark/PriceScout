"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import type { CatalogStore } from "@/utils/api/contracts";
import { resolveMediaUrl } from "@/utils/api/product-images";
import { ImageWithState } from "@/components/ImageViewer";

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
  const resolved = store.logo_url ? resolveMediaUrl(store.logo_url) : null;
  return resolved ?? (store.logo_svg ? storeLogoDataUrl(store.logo_svg) : "");
}

const logoExtensions = new Set(["svg", "png", "webp", "avif", "jpg", "jpeg"]);
const logoMimeTypes = new Set([
  "image/svg+xml",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jpeg",
]);

function FormIcon({
  name,
}: {
  name: "lock" | "info" | "upload" | "image" | "undo" | "check";
}) {
  const paths = {
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M12 12v4" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    undo: (
      <>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

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
  const selectedMarketIsSupported = (
    store.supported_country_currency_pairs ?? [[store.country ?? "BR", store.currency ?? "BRL"]]
  ).some(([country, currency]) => `${country}:${currency}` === market);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, saving]);

  function clearLocalLogoSelection() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setLogoFile(null);
    setLogoSvg(store.logo_svg ?? "");
    setLogoPreview(persistedLogoPreview(store));
    setError("");
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
        <div className="store-field-group store-field-span-2">
          <div className="store-field-header">
            <label htmlFor="store-name-input" className="store-field-label">
              Nome da loja
            </label>
            <span className="store-badge editable">Editável</span>
          </div>
          <input
            id="store-name-input"
            className="store-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={160}
            placeholder="Nome oficial ou de exibição da loja"
            autoFocus
          />
        </div>

        <div className="store-field-group">
          <div className="store-field-header">
            <label htmlFor="store-domain-input" className="store-field-label">
              Domínio
            </label>
            <span className="store-badge locked">
              <FormIcon name="lock" /> Bloqueado
            </span>
          </div>
          <input
            id="store-domain-input"
            type="url"
            className="store-input is-readonly"
            value={url}
            readOnly
            tabIndex={-1}
            aria-describedby="store-domain-help"
          />
          <p id="store-domain-help" className="store-field-help">
            <FormIcon name="info" />
            <span>Domínio associado ao adapter pré-cadastrado.</span>
          </p>
        </div>

        <div className="store-field-group">
          <div className="store-field-header">
            <label htmlFor="store-market-input" className="store-field-label">
              País e moeda
            </label>
            <span className="store-badge locked">
              <FormIcon name="lock" /> Bloqueado
            </span>
          </div>
          <input
            id="store-market-input"
            className="store-input is-readonly"
            value={`${store.country ?? "BR"} · ${store.currency ?? "BRL"}`}
            readOnly
            tabIndex={-1}
            aria-describedby="store-market-help"
          />
          <p id="store-market-help" className="store-field-help">
            <FormIcon name="info" />
            <span>País e moeda são definidos pela integração.</span>
          </p>
        </div>
      </div>

      <div className="store-logo-section">
        <div className="store-logo-content">
          <div className="store-logo-info">
            <span className="store-logo-title">Logo da loja</span>
            <p className="store-logo-specs">
              SVG, PNG, WebP, AVIF, JPG ou JPEG até 2 MB.
            </p>
            <p className="store-logo-note">
              A prévia muda ao selecionar; a logo é salva ao confirmar.
            </p>
          </div>
          <div className="store-logo-actions-row">
            <label
              className="store-logo-upload store-logo-upload-btn"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.querySelector("input")?.click();
                }
              }}
            >
              <FormIcon name="upload" />
              <span>
                {logoFile
                  ? "Trocar arquivo"
                  : logoPreview
                  ? "Alterar logo"
                  : "Escolher arquivo"}
              </span>
              <input
                type="file"
                accept="image/svg+xml,image/png,image/webp,image/avif,image/jpeg,.svg,.png,.webp,.avif,.jpg,.jpeg"
                onChange={handleLogo}
                disabled={saving}
              />
            </label>
            {logoFile && (
              <button
                type="button"
                className="store-logo-revert-btn"
                onClick={clearLocalLogoSelection}
                disabled={saving}
                title="Restaurar logo cadastrada anteriormente"
              >
                <FormIcon name="undo" />
                <span>Desfazer</span>
              </button>
            )}
          </div>
        </div>

        <div className="store-logo-preview-column">
          <div
            className={`store-logo-preview store-logo-preview-frame ${logoPreview ? "has-logo" : "is-empty"}`}
          >
            {logoPreview ? (
              <ImageWithState src={logoPreview} alt="Prévia da logo da loja" />
            ) : (
              <div className="store-logo-empty-state">
                <FormIcon name="image" />
                <span>Logo não cadastrada</span>
              </div>
            )}
          </div>
          {logoFile && <span className="store-logo-pending-tag">Arquivo selecionado</span>}
        </div>
      </div>

      {error && (
        <div className="error-notice store-error-banner" role="alert">
          <FormIcon name="info" />
          <span>{error}</span>
        </div>
      )}

      <div className="store-editor-actions">
        <button
          className="outline-button store-cancel-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          className="primary-button store-save-button"
          type="submit"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="store-save-spinner" aria-hidden="true" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <FormIcon name="check" />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
