import type { ProductMatchedBy, ProductResolutionKind } from "@/utils/api/contracts";
import { isBlank, warnUnknownLabel } from "./labels";

export const PRODUCT_RESOLUTION_LABELS: Record<ProductResolutionKind, string> = {
  existing_listing: "Esta oferta já está cadastrada",
  existing_product_new_listing: "Produto já cadastrado: nova oferta",
  needs_review: "Possível produto já cadastrado",
  new_product: "Produto novo",
};

export const PRODUCT_MATCHED_BY_LABELS: Record<ProductMatchedBy, string> = {
  store_identity: "mesmo anúncio da loja",
  gtin: "código de barras (GTIN/EAN)",
  identity: "marca, modelo e variante",
  user_confirmed: "confirmação manual",
};

const UNKNOWN_RESOLUTION = "Situação do cadastro desconhecida";
const UNKNOWN_EVIDENCE = "evidência não identificada";

/** User-facing label for a registration resolution. Never returns the raw enum. */
export function productResolutionLabel(value: string | null | undefined): string {
  if (isBlank(value)) return UNKNOWN_RESOLUTION;
  const key = value.trim() as ProductResolutionKind;
  if (key in PRODUCT_RESOLUTION_LABELS) return PRODUCT_RESOLUTION_LABELS[key];
  warnUnknownLabel("productResolution", value);
  return UNKNOWN_RESOLUTION;
}

/** User-facing label for the evidence used to recognize a product. */
export function productMatchedByLabel(value: string | null | undefined): string {
  if (isBlank(value)) return UNKNOWN_EVIDENCE;
  const key = value.trim() as ProductMatchedBy;
  if (key in PRODUCT_MATCHED_BY_LABELS) return PRODUCT_MATCHED_BY_LABELS[key];
  warnUnknownLabel("productMatchedBy", value);
  return UNKNOWN_EVIDENCE;
}

/** Message shown after POST /products, driven only by the API resolution. */
export function productImportMessage(
  resolution: string | null | undefined,
  options: { listingCreated: boolean; imagesQueued: number; imagesTotal: number },
): string {
  const imagesNote =
    options.imagesQueued > 0
      ? options.imagesTotal > options.imagesQueued
        ? ` As primeiras ${options.imagesQueued} de ${options.imagesTotal} imagens serão processadas em segundo plano (limite do catálogo).`
        : " As imagens serão processadas em segundo plano."
      : "";
  switch (resolution) {
    case "existing_listing":
      return "Esta oferta já estava cadastrada. Nenhum registro novo foi criado.";
    case "existing_product_new_listing":
      return options.listingCreated
        ? "Produto já cadastrado. A oferta desta loja foi adicionada ao produto existente."
        : "Produto já cadastrado. Nenhum registro novo foi criado.";
    case "new_product":
      return `Produto cadastrado.${imagesNote}`;
    default:
      return `Produto salvo.${imagesNote}`;
  }
}
