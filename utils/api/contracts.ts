export type ProductPreview = {
  source: string;
  url: string;
  productId: string | null;
  name: string | null;
  brand: string | null;
  originalPrice: number | null;
  pixPrice: number | null;
  pixDiscountPercent: number | null;
  cardPrice: number | null;
  installments: { quantity: number; amount: number; total: number } | null;
  priceDifferencePixToCard: number | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  stockQuantity: number | null;
  seller: string | null;
  special_status: string | null;
  shipping_from: string | null;
  taxonomy: Array<{ level: number; name: string; slug: string }>;
  images: Array<{ url: string; alt: string | null; width: number | null; height: number | null }>;
};

export type CatalogProduct = {
  id: string;
  name: string;
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
  store?: { name: string; hostname: string } | null;
};

export type ProductImage = {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
};

export type TaxonomyItem = {
  level: number;
  category?: { id: string; name: string; slug: string; level: number } | null;
};
