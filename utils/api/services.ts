import { api, apiUrl } from "@/utils/api/client";
import type { CatalogProduct, CatalogStore, Product, ProductImage, ProductPreview, TaxonomyItem } from "@/utils/api/contracts";

export const authApi = {
  signInUrl(nextPath: string) {
    return apiUrl("/auth/sign-in", { next: nextPath });
  },
  me() {
    return api.get<{ user: { id: string; name: string | null; email: string | null }; is_admin: boolean }>("/auth/me");
  },
  signOut() {
    return api.post<void>("/auth/sign-out");
  },
};

export const catalogApi = {
  listProducts() {
    return api.get<{ products: CatalogProduct[] }>("/catalog/products", { cache: "no-store" });
  },
  listStores() {
    return api.get<{ stores: CatalogStore[] }>("/catalog/stores", { cache: "no-store" });
  },
  createStore(input: { name: string; url: string }) {
    return api.post<{ store: CatalogStore }>("/catalog/stores", input);
  },
  previewProduct(url: string) {
    return api.post<{ product: ProductPreview }>("/catalog/products/preview", { url });
  },
  importProduct(product: ProductPreview) {
    return api.post<{ product: CatalogProduct; message?: string }>("/catalog/products/import", { product });
  },
  getProduct(id: string) {
    return api.get<{ product: Product; images: ProductImage[]; taxonomy: TaxonomyItem[] }>(`/catalog/products/${encodeURIComponent(id)}`, { cache: "no-store" });
  },
  updateProduct(id: string, input: Record<string, unknown>) {
    return api.patch<{ product: Product }>(`/catalog/products/${encodeURIComponent(id)}`, input);
  },
  addProductImage(id: string, imageUrl: string) {
    return api.post<{ image: ProductImage }>(`/catalog/products/${encodeURIComponent(id)}/images`, { imageUrl });
  },
  updateProductImages(id: string, imageIds: string[], primaryImageId?: string) {
    return api.patch<void>(`/catalog/products/${encodeURIComponent(id)}/images`, { imageIds, ...(primaryImageId ? { primaryImageId } : {}) });
  },
  deleteProductImage(id: string, imageId: string) {
    return api.delete<void>(`/catalog/products/${encodeURIComponent(id)}/images`, { query: { imageId } });
  },
};
