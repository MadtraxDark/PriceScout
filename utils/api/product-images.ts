/**
 * Adaptadores centrais de imagem de produto (ScoutApiV2 → UI).
 * Toda tela deve usar estes helpers — não reimplementar fallback AVIF/original.
 */

import { ApiError, ApiUnavailableError, apiRequest, apiUrl } from "@/utils/api/client";
import type {
  ApiProductImageView,
  CatalogProductImage,
  ProductImage,
  ImageAvailabilityStatus,
} from "@/utils/api/contracts";
import type { ImageViewerImage } from "@/components/ImageViewer";
import {
  imageAvailabilityView,
  type ImageAvailabilityView,
} from "@/utils/display/image-availability";

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
    image_status: view.image_status,
    image_error_code: view.image_error_code,
    image_retryable: view.image_retryable,
    image_warning_code: view.image_warning_code,
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
    image_status: image.image_status,
    image_error_code: image.image_error_code,
    image_retryable: image.image_retryable,
    image_warning_code: image.image_warning_code,
  };
}

function isImageAvailabilityStatus(value: unknown): value is ImageAvailabilityStatus {
  return typeof value === "string" && [
    "ready",
    "missing",
    "processing",
    "temporarily_unavailable",
    "permission_denied",
    "not_found",
    "storage_error",
    "invalid_reference",
    "load_failed",
  ].includes(value);
}

/** Read the structured response after a browser image request fails. */
export async function diagnoseImageLoadFailure(
  src: string,
): Promise<ImageAvailabilityView> {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return imageAvailabilityView("missing");

  let url: URL;
  try {
    url = new URL(resolved);
  } catch {
    return imageAvailabilityView("load_failed");
  }

  const productMedia = /^\/products\/[^/]+\/images\/[^/]+\/content$/;
  const storeLogo = /^\/stores\/[^/]+\/logo$/;
  if (!productMedia.test(url.pathname) && !storeLogo.test(url.pathname)) {
    return imageAvailabilityView("load_failed");
  }

  try {
    await apiRequest<unknown>(`${url.pathname}${url.search}`, {
      method: "GET",
      discardResponseBody: true,
      preserveApiErrorDetails: true,
    });
    return imageAvailabilityView("load_failed");
  } catch (error) {
    if (error instanceof ApiUnavailableError) {
      return imageAvailabilityView("temporarily_unavailable", true);
    }
    if (error instanceof ApiError) {
      const detail = error.details;
      if (detail && typeof detail === "object" && "image_status" in detail) {
        const status = (detail as { image_status?: unknown }).image_status;
        if (isImageAvailabilityStatus(status)) {
          return imageAvailabilityView(status, error.retryable);
        }
      }
      if (error.status === 404) return imageAvailabilityView("not_found");
      if (error.status === 403) return imageAvailabilityView("permission_denied");
      if (error.status === 503 || error.status === 429) {
        return imageAvailabilityView("temporarily_unavailable", true);
      }
    }
    return imageAvailabilityView("load_failed");
  }
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
      availabilityStatus: image.image_status,
      retryable: image.image_retryable,
      warningCode: image.image_warning_code,
    };
  }
  const src = resolveMediaUrl(image.image_url) || "";
  return {
    id: image.id,
    src,
    thumbnailSrc: src,
    alt: image.name || alt,
    availabilityStatus: image.image_status,
    retryable: image.image_retryable,
    warningCode: image.image_warning_code,
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
