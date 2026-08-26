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
  name: string;
  primary_image_url: string | null;
  image_url: string | null;
  brand: string | null;
  product_url: string;
  source: string;
  external_product_id: string;
  availability: string;
  pix_price: number | null;
  updated_at: string;
  store?: { name: string; hostname: string } | null;
};

export type CatalogStore = {
  id: string;
  name: string;
  hostname: string;
  url: string;
  productCount: number;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  created_at?: string | null;
  brand: string | null;
  product_url: string;
  source: string;
  external_product_id: string;
  availability: string;
  stock_quantity: number | null;
  seller: string | null;
  special_status: string | null;
  shipping_from: string | null;
  original_price: number | null;
  pix_price: number | null;
  pix_discount_percent: number | null;
  card_price: number | null;
  installments_quantity: number | null;
  installment_amount: number | null;
  price_difference_pix_to_card: number | null;
  primary_image_id: string | null;
  primary_image_url: string | null;
  store?: { name: string; hostname: string } | null;
};

export type ProductImage = {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_main?: boolean;
};

export type TaxonomyItem = {
  level: number;
  category?: { id: string; name: string; slug: string; level: number } | null;
};
