/**
 * Adaptadores centrais de imagem de produto (ScoutApiV2 → UI).
 * Toda tela deve usar estes helpers — não reimplementar fallback AVIF/original.
 */

import { apiUrl } from "@/utils/api/client";
import type {
  ApiProductImageView,
  CatalogProductImage,
  ProductImage,
} from "@/utils/api/contracts";
import type { ImageViewerImage } from "@/components/ImageViewer";

/** Resolve path relativo da API para URL absoluta do backend. */
export function resolveMediaUrl(src: string | null | undefined): string | null {
  if (src == null) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return apiUrl(trimmed);
  }
  return trimmed;
}

/** display_url canônico: AVIF se ready, senão original (já resolvido no backend). */
export function pickDisplayUrl(
  image: Pick<ApiProductImageView, "display_url" | "optimized_url" | "original_url"> | CatalogProductImage,
): string | null {
  if ("optimized_url" in image && "original_url" in image && "display_url" in image) {
    const api = image as ApiProductImageView;
    return api.display_url || api.optimized_url || api.original_url || null;
  }
  const catalog = image as CatalogProductImage;
  return catalog.display_url || catalog.optimized_image_url || catalog.original_url || null;
}

export function apiImageToCatalogImage(view: ApiProductImageView): CatalogProductImage {
  const display = pickDisplayUrl(view);
  return {
    image_id: view.image_id,
    product_id: view.product_id,
    // Media path controlada pelo ScoutApiV2 — nunca source_url da loja.
    original_url: view.original_url || "",
    optimized_image_url: view.optimized_url,
    display_url: display,
    position: view.position,
    is_main: view.is_main,
    status: view.original_status,
    original_status: view.original_status,
    optimized_status: view.optimized_status,
    error: view.optimized_error,
  };
}

export function toGalleryProductImage(image: CatalogProductImage): ProductImage {
  const relative = pickDisplayUrl(image);
  const absolute = resolveMediaUrl(relative) || "";
  return {
    id: image.image_id,
    name: "Imagem do produto",
    image_url: absolute,
    original_url: resolveMediaUrl(image.original_url) || image.original_url || undefined,
    sort_order: image.position,
    is_main: image.is_main,
  };
}

export function toProductImageView(
  image: CatalogProductImage | ProductImage,
  alt = "Imagem do produto",
): ImageViewerImage {
  if ("image_id" in image) {
    const src = resolveMediaUrl(pickDisplayUrl(image)) || "";
    return {
      id: image.image_id,
      src,
      thumbnailSrc: src,
      alt,
    };
  }
  const src = resolveMediaUrl(image.image_url) || "";
  return {
    id: image.id,
    src,
    thumbnailSrc: src,
    alt: image.name || alt,
  };
}

export function pickPrimaryImageUrl(
  primaryFromApi: string | null | undefined,
  gallery: CatalogProductImage[],
): string | null {
  const main = gallery.find((image) => image.is_main) ?? gallery[0] ?? null;
  const fromGallery = main ? pickDisplayUrl(main) : null;
  return resolveMediaUrl(fromGallery || primaryFromApi || null);
}
