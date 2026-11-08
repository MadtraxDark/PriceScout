import type { ExistingCatalogProduct, ProductPreview, ProductResolutionView } from "@/utils/api/contracts";
import { ApiError, ApiUnavailableError } from "@/utils/api/client";
import { resolveMediaUrl } from "@/utils/api/product-images";
import type { ResolutionStatus } from "@/utils/display/import-gate";

export const IDENTITY_REVIEW_CODE = "PRODUCT_IDENTITY_REVIEW_REQUIRED";
export const IDENTITY_CONFLICT_CODE = "PRODUCT_IDENTITY_CONFLICT";
export const INTEGRITY_ERROR_CODE = "DATABASE_INTEGRITY_ERROR";
export const RESOLVE_TIMEOUT_MS = 15000;

export type ReviewCandidate = { product: ExistingCatalogProduct; confidence: number | null };

/** Candidato do 409 PRODUCT_IDENTITY_REVIEW_REQUIRED, incluindo match_confidence. */
export function reviewCandidateFromError(error: unknown): ReviewCandidate | null {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== IDENTITY_REVIEW_CODE) return null;
  if (!error.details || typeof error.details !== "object") return null;
  const d = error.details as Record<string, unknown>;
  if (!d.existing_product || typeof d.existing_product !== "object") return null;
  const ep = d.existing_product as Record<string, unknown>;
  const id = ep.id != null ? String(ep.id) : "";
  if (!id) return null;
  const raw = d.match_confidence;
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  return {
    confidence: Number.isFinite(parsed) ? parsed : null,
    product: {
      id,
      name: ep.title ? String(ep.title) : null,
      brand: ep.brand != null ? String(ep.brand) : null,
      created_at: ep.created_at ? String(ep.created_at) : null,
      primary_image_url: typeof ep.image_url === "string" ? resolveMediaUrl(ep.image_url) : null,
    },
  };
}

export function isIdentityConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409 && error.code === IDENTITY_CONFLICT_CODE;
}

export function isIntegrityError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409 && error.code === INTEGRITY_ERROR_CODE;
}

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: string }).name === "AbortError";
}

/** Classifica falha da consulta: sem resposta (unavailable), conflito ou recusa (error). */
export function classifyResolveError(error: unknown): Exclude<ResolutionStatus, "idle" | "loading" | "ready"> {
  if (error instanceof ApiUnavailableError || isAbort(error)) return "unavailable";
  if (isIdentityConflict(error)) return "conflict";
  if (error instanceof ApiError && error.status >= 500) return "unavailable";
  return "error";
}

/** Resolve com timeout via AbortSignal. */
export async function resolveProductWithTimeout(
  resolve: (product: ProductPreview, options: { signal?: AbortSignal }) => Promise<ProductResolutionView>,
  product: ProductPreview,
  timeoutMs: number = RESOLVE_TIMEOUT_MS,
): Promise<ProductResolutionView> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await resolve(product, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
