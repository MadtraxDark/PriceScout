export type ProductPreview = {
  source: string;
  url: string;
  productId: string | null;
  sourceProductId?: string | null;
  name: string | null;
  brand: string | null;
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
  installments: { quantity: number; amount: number; total: number } | null;
  priceDifferencePixToCard: number | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  stockQuantity: number | null;
  seller: string | null;
  seller_assets?: EntityAssetsPayload | null;
  deliveryResponsible?: string | null;
  delivery_assets?: EntityAssetsPayload | null;
  special_status: string | null;
  shipping_from: string | null;
  taxonomy: Array<{ level: number; name: string; slug: string }>;
  main_image?: string | null;
  images: Array<{ url: string; alt: string | null; width: number | null; height: number | null }>;
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
  name: string; product_url: string; source: string; external_product_id: string; image_url?: string | null; primary_image_url?: string | null; main_image_url?: string | null;
  stock_quantity?: number | null; seller?: string | null; special_status?: string | null; shipping_from?: string | null; original_price?: number | null; pix_price?: number | null; pix_discount_percent?: number | null; card_price?: number | null; installments_quantity?: number | null; installment_amount?: number | null; price_difference_pix_to_card?: number | null; primary_image_id?: string | null; store?: { name: string; hostname: string } | null;
};

export type OfferPriceHistory = {
  id: number;
  catalog_offer_id: string;
  original_price: number | null;
  pix_price: number | null;
  card_price: number | null;
  installments: number | null;
  installment_value: number | null;
  interest_free: boolean | null;
  availability: string;
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
  availability: string;
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
  original_url: string;
  optimized_image_url?: string | null;
  position: number;
  is_main: boolean;
  status: string;
  drive_original_id?: string | null;
  drive_avif_id?: string | null;
  error?: string | null;
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
};

export type StoreMarketOption = {
  country: string;
  country_name: string;
  currency: string;
  currency_name: string;
};

export type Product = CatalogProduct;

export type OtherStorePricesResponse = {
  variant?: CatalogProductVariant; prices?: OtherStorePrice[]; diagnostics: Array<Record<string, unknown>>;
};

export type OtherStoreProgressEvent = {
  type: "store_progress" | "search_progress" | "search_result";
  store?: string | null;
  display_name?: string | null;
  stage: string;
  status: "pending" | "running" | "success" | "warning" | "error" | "no_result";
  message: string;
  candidate_count?: number;
  result?: OtherStorePricesResponse;
};

export type OtherStorePrice = { storeId: string; displayName: string; url: string; currency: string; originalPrice: number | null; pixDiscountPercent: number | null; pixPrice: number | null; cardPrice: number | null; installments: { quantity: number; amount: number; total: number; interestFree: boolean | null } | null; availability: string | null; seller: string | null; deliveryResponsible: string | null; };

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
