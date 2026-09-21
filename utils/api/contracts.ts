// =============================================================================
// Tipos da API ScoutApiV2 (contratos do backend)
// =============================================================================

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type PublicUser = {
  id: string;
  display_name: string;
};

export type AuthSession = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: PublicUser;
};

// ---------------------------------------------------------------------------
// Produtos — respostas do ScoutApiV2
// ---------------------------------------------------------------------------

export type ProductListingView = {
  id: string;
  store: string;
  country: string;
  product_id: string;
  sku: string | null;
  gtin: string | null;
  url: string;
  canonical_url: string;
  status: string;
  title: string | null;
  match_decision: string;
  confidence: string;
  created_at: string;
  updated_at: string;
  monitoring_enabled?: boolean;
  last_checked_at?: string | null;
  next_check_at?: string | null;
  last_successful_check_at?: string | null;
  consecutive_failures?: number;
  price?: string | null;
  currency?: string | null;
  seller?: string | null;
  availability?: string | null;
  available?: boolean | null;
  pix_price?: string | null;
  original_price?: string | null;
  promotion_status?: string;
  promotion_expires_at?: string | null;
  promotion_type?: string | null;
  promotion_price?: string | null;
  promotion_conditions?: Record<string, unknown>;
  promotion_commercially_active?: boolean;
};

/** ProductView retornado por GET /products e GET /products/{id}. */
export type ProductView = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  variant_key: string | null;
  attributes: Record<string, unknown>;
  gtins: string[];
  listings: ProductListingView[];
  created_at: string;
  updated_at: string;
};

export type ProductListResponse = {
  items: ProductView[];
  count: number;
  limit: number;
  offset: number;
};

export type ProductRegisterRequest = {
  title: string;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  variant_key?: string | null;
  gtin?: string | null;
  attributes?: Record<string, unknown> | null;
  store?: string | null;
  country?: string | null;
  product_id?: string | null;
  sku?: string | null;
  url?: string | null;
  canonical_url?: string | null;
};

export type ProductRegisterResponse = {
  created: boolean;
  listing_created: boolean;
  product: ProductView;
  listing: ProductListingView | null;
};

export type ProductUpdateRequest = {
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  variant?: string | null;
  attributes?: Record<string, unknown> | null;
};

// ---------------------------------------------------------------------------
// Crawl — POST /crawl
// ---------------------------------------------------------------------------

export type CrawlRequest = {
  url: string;
  include_images?: boolean;
};

/** Item retornado pelo endpoint POST /crawl. Decimais como strings JSON. */
export type ProductPriceItem = {
  store: string;
  country: string;
  product_id: string;
  sku: string | null;
  gtin: string | null;
  title: string;
  brand: string | null;
  model: string | null;
  variant: string | null;
  seller: string | null;
  url: string;
  canonical_url: string;
  currency: string;
  price: string;
  original_price: string | null;
  discount_percentage: string | null;
  pix_price: string | null;
  installment_price: string | null;
  installment_count: number | null;
  shipping_price: string | null;
  available: boolean;
  images: string[];
  scraped_at: string;
  last_changed_at: string | null;
  metadata: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Match — POST /match e POST /match/stream
// ---------------------------------------------------------------------------

export type MatchReason = {
  code: string;
  detail: string;
  score?: number | null;
};

export type MatchHit = {
  store: string;
  country: string;
  listing_id: string | null;
  decision: "auto_match" | "review" | "reject";
  confidence: string;
  reasons: MatchReason[];
  product: ProductPriceItem;
  search_query: string | null;
};

export type MatchStoreError = {
  store: string;
  code: string;
  message: string;
};

export type MatchRequest = {
  reference_url: string;
  stores?: string[];
  include_review?: boolean;
  persist?: boolean;
  include_images?: boolean;
  max_candidates_per_store?: number;
};

export type MatchResponse = {
  canonical_product_id: string | null;
  reference: ProductPriceItem;
  matches: MatchHit[];
  unmatched_stores: string[];
  errors: MatchStoreError[];
  discovered_gtin: string | null;
  gtin_source: string | null;
};

// ---------------------------------------------------------------------------
// Offers — POST /offers/refresh
// ---------------------------------------------------------------------------

export type OfferRefreshRequest = {
  canonical_product_id?: string;
  listing_ids?: string[];
  urls?: string[];
  include_details?: boolean;
};

export type OfferRefreshResponse = {
  refreshed: number;
  errors: Array<{ url: string; error: string }>;
};

// ---------------------------------------------------------------------------
// Stores — GET /stores
// ---------------------------------------------------------------------------

export type StoreInfo = {
  key: string;
  country: string;
  currency: string;
  domains: string[];
  implemented: boolean;
  supports_search: boolean;
  supports_images: boolean;
  image_fetch_cost?: "low" | "high" | "unsupported";
  default_include_images?: boolean;
};

// =============================================================================
// Tipos de UI — usados pelas páginas (mantidos para compatibilidade)
// =============================================================================

// ---------------------------------------------------------------------------
// Helpers monetários
// ---------------------------------------------------------------------------

/**
 * Converte valor decimal (string ou número) em número, ou null se inválido.
 * Use apenas para exibição — nunca para cálculos financeiros.
 */
export function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Formata valor monetário para exibição em pt-BR.
 */
export function formatMoney(value: number | null | undefined, currency = "BRL"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

// ---------------------------------------------------------------------------
// Tipos de UI para produto (usados por páginas e componentes existentes)
// ---------------------------------------------------------------------------

export type ProductPreview = {
  source: string;
  url: string;
  productId: string | null;
  sourceProductId?: string | null;
  name: string | null;
  brand: string | null;
  model?: string | null;
  variant?: string | null;
  country?: string | null;
  currency?: string | null;
  brand_assets?: EntityAssetsPayload | null;
  store_assets?: EntityAssetsPayload | null;
  brand_confidence?: number | null;
  brand_source?: string | null;
  gtin?: string | null;
  gtin_type?: string | null;
  gtin_confidence?: number | null;
  gtin_source?: string | null;
  mpn?: string | null;
  originalPrice: number | null;
  pixPrice: number | null;
  pixDiscountPercent: number | null;
  cardPrice: number | null;
  installments: { quantity: number; amount: number; total: number; interestFree?: boolean | null } | null;
  priceDifferencePixToCard: number | null;
  seller: string | null;
  seller_assets?: EntityAssetsPayload | null;
  deliveryResponsible?: string | null;
  delivery_assets?: EntityAssetsPayload | null;
  special_status: string | null;
  shipping_from: string | null;
  taxonomy: Array<{ level: number; name: string; slug: string }>;
  main_image?: string | null;
  images: Array<{ url: string; alt: string | null; width: number | null; height: number | null }>;
  image_status?: "success" | "partial" | "empty" | "omitted" | "error" | null;
  image_error?: string | null;
};

export type ProductPreviewResponse = {
  product: ProductPreview;
  preview_id?: string;
  expires_at?: string;
  status?: "ready";
};

export type ExistingCatalogProduct = {
  id: string;
  name: string | null;
  brand?: string | null;
  product_url?: string | null;
  primary_image_url?: string | null;
  main_image_url?: string | null;
  created_at?: string | null;
};

// ---------------------------------------------------------------------------
// Entity assets (legado — mantido para compatibilidade com ReviewPreview)
// ---------------------------------------------------------------------------

export type EntityAssets = {
  logo?: string | null;
  symbol?: string | null;
  icon?: string | null;
  alt?: string | null;
  visual?: LogoVisualMetadata | null;
};

export type LogoVisualMetadata = {
  logo_id?: string | null;
  analysis_status?: "pending" | "ready" | "failed" | null;
  dominant_color?: string | null;
  average_luminance?: number | null;
  has_transparency?: boolean | null;
  recommended_background?: "light" | "dark" | "neutral" | null;
  foreground_color?: string | null;
};

export type BrandAssetRecord = {
  asset_type?: string;
  brand?: string;
  available?: boolean;
  source?: string;
  asset_url?: string | null;
  logo_id?: string | null;
  visual?: LogoVisualMetadata | null;
  drive_file_ids?: string[];
  drive_file_names?: string[];
  error?: string | null;
};

export type BrandAssetsResponse = {
  brand: string;
  requested_assets?: string[];
  assets: Record<string, BrandAssetRecord>;
};

export type EntityAssetsPayload = EntityAssets | BrandAssetsResponse | Record<string, BrandAssetsResponse>;

// ---------------------------------------------------------------------------
// Tipos do catálogo (UI) — usados pelas páginas existentes
// ---------------------------------------------------------------------------

export type OfferPriceHistory = {
  id: number;
  catalog_offer_id: string;
  original_price: number | null;
  pix_price: number | null;
  card_price: number | null;
  installments: number | null;
  installment_value: number | null;
  interest_free: boolean | null;
  currency: string;
  country: string;
  market: string;
  captured_at: string;
};

export type CatalogOffer = {
  id: string;
  catalog_product_variant_id: string;
  store_id: string;
  source: string;
  external_product_id: string | null;
  canonical_url: string;
  seller: string | null;
  delivery_responsible: string | null;
  original_price: number | null;
  pix_price: number | null;
  card_price: number | null;
  discount_percent: number | null;
  installments: number | null;
  installment_value: number | null;
  interest_free: boolean | null;
  image_url: string | null;
  currency: string;
  country: string;
  market: string;
  store?: { id: string; name: string; hostname: string } | null;
  history: OfferPriceHistory[];
  last_checked_at?: string | null;
  next_check_at?: string | null;
  promotion_expires_at?: string | null;
  promotion_status?: string | null;
  promotion_commercially_active?: boolean;
  available?: boolean | null;
};

export type CatalogProductVariant = {
  id: string;
  catalog_product_id: string;
  attributes: Record<string, string>;
  variant_fingerprint: string;
  identity_status: "confirmed" | "ambiguous";
  offers: CatalogOffer[];
};

export type CatalogProductImage = {
  image_id: string;
  product_id?: string;
  original_url: string;
  optimized_image_url?: string | null;
  display_url?: string | null;
  position: number;
  is_main: boolean;
  status: string;
  original_status?: string;
  optimized_status?: string;
  drive_original_id?: string | null;
  drive_avif_id?: string | null;
  error?: string | null;
};

/** Resposta canônica do ScoutApiV2 para galeria. */
export type ApiProductImageView = {
  image_id: string;
  product_id: string;
  position: number;
  is_main: boolean;
  source_url: string;
  original_url: string | null;
  optimized_url: string | null;
  display_url: string | null;
  original_status: string;
  optimized_status: string;
  original_width: number | null;
  original_height: number | null;
  optimized_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiProductImageListResponse = {
  items: ApiProductImageView[];
  count: number;
};

export type CatalogProduct = {
  id: string;
  canonical_name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  identity_attributes: Record<string, unknown>;
  identity_status: "confirmed" | "ambiguous";
  variants: CatalogProductVariant[];
  images: CatalogProductImage[];
  created_at: string;
  updated_at: string;
  // Campos legados — preenchidos pelo mapper para compatibilidade com páginas
  name: string;
  product_url: string;
  source: string;
  external_product_id: string;
  primary_image_url?: string | null;
  primary_image_id?: string | null;
  store?: { name: string; hostname: string } | null;
};

export type CatalogOverview = {
  summary: { products: number; variants: number; offers: number; stores: number };
  recent_products: Array<{ id: string; name: string; brand: string | null; created_at: string; image_url: string | null; variants: number; offers: number }>;
  single_offer_variants: Array<{ product_id: string; variant_id: string; product_name: string; variant_label: string | null; store_name: string | null }>;
  best_price_opportunities: Array<{ product_id: string; variant_id: string; product_name: string; variant_label: string | null; lowest_price: number; highest_price: number; savings: number; currency: string; offers: Array<{ store_name: string | null; price: number; url: string | null }> }>;
  alerts: Array<{ kind: string; label: string; count: number; product_ids: string[] }>;
  recent_activity: Array<{ kind: string; label: string; product_id: string | null; product_name: string | null; occurred_at: string }>;
};

export type CatalogStore = {
  id: string;
  name: string;
  hostname: string;
  url: string;
  country: string;
  currency: string;
  logo_svg?: string | null;
  productCount: number;
  updated_at: string;
  domains?: string[];
  supports_images?: boolean;
  image_fetch_cost?: "low" | "high" | "unsupported";
  default_include_images?: boolean;
};

export type StoreMarketOption = {
  country: string;
  country_name: string;
  currency: string;
  currency_name: string;
};

/** Alias de compatibilidade — mapeado a partir de ProductView pelo serviço. */
export type Product = CatalogProduct;

// ---------------------------------------------------------------------------
// Preços em outras lojas
// ---------------------------------------------------------------------------

export type OtherStorePricesResponse = {
  variant?: CatalogProductVariant;
  prices?: OtherStorePrice[];
  diagnostics: Array<Record<string, unknown>>;
};

export type OtherStoreProgressEvent = {
  type: "store_progress" | "search_progress" | "search_result" | string;
  store?: string | null;
  display_name?: string | null;
  stage: string;
  status: "pending" | "running" | "success" | "warning" | "error" | "no_result";
  message: string;
  candidate_count?: number;
  sequence?: number | string | null;
  event_id?: number | string | null;
  attempt?: number | string | null;
  timestamp?: string | null;
  created_at?: string | null;
  occurred_at?: string | null;
  result?: OtherStorePricesResponse;
};

export type OtherStorePrice = {
  storeId: string;
  displayName: string;
  url: string;
  currency: string;
  originalPrice: number | null;
  pixDiscountPercent: number | null;
  pixPrice: number | null;
  cardPrice: number | null;
  installments: { quantity: number; amount: number; total: number; interestFree: boolean | null } | null;
  seller: string | null;
  deliveryResponsible: string | null;
};

// ---------------------------------------------------------------------------
// Imagens de produto (UI)
// ---------------------------------------------------------------------------

export type ProductImage = {
  id: string;
  name: string;
  image_url: string;
  original_url?: string;
  sort_order: number;
  is_main?: boolean;
};

export type TaxonomyItem = {
  level: number;
  category?: { id: string; name: string; slug: string; level: number } | null;
};
