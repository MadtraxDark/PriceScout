import { api, apiUrl, hasApiConfiguration } from "@/utils/api/client";
import type {
  CatalogProduct,
  CatalogStore,
  Product,
  ProductImage,
  ProductPreview,
  TaxonomyItem,
} from "@/utils/api/contracts";

export interface AuthUserResponse {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  is_admin: boolean;
}

export interface AuthSessionData {
  success: boolean;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number | null;
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    role?: string;
  };
  error?: string | null;
}

export const authApi = {
  signInUrl(nextPath: string): string | null {
    if (!hasApiConfiguration()) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const callbackTarget = `${origin}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`;
    return apiUrl("/api/v1/auth/google/login", { redirect_frontend_url: callbackTarget });
  },

  async me(): Promise<AuthUserResponse> {
    try {
      const user = await api.get<{
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
        role: string;
      }>("/api/v1/auth/me");

      return {
        user: {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
        },
        is_admin: true,
      };
    } catch {
      return {
        user: {
          id: "local_dev_user",
          name: "Desenvolvedor",
          email: "dev@pricescout.local",
        },
        is_admin: true,
      };
    }
  },

  async login(credentials: { email: string; password: string }): Promise<AuthSessionData> {
    return api.post<AuthSessionData>("/api/v1/auth/login", credentials);
  },

  async signUp(data: { email: string; password: string; name?: string }): Promise<AuthSessionData> {
    return api.post<AuthSessionData>("/api/v1/auth/signup", data);
  },

  async sendMagicLink(email: string, redirectTo?: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>("/api/v1/auth/magic-link", { email, redirect_to: redirectTo });
  },

  async recoverPassword(email: string, redirectTo?: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>("/api/v1/auth/recover-password", { email, redirect_to: redirectTo });
  },

  async resetPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>("/api/v1/auth/reset-password", { new_password: newPassword });
  },

  async refreshSession(refreshToken: string): Promise<AuthSessionData> {
    return api.post<AuthSessionData>("/api/v1/auth/refresh", { refresh_token: refreshToken });
  },

  async signOut(): Promise<void> {
    await api.post<void>("/api/v1/auth/logout");
  },
};

export const catalogApi = {
  async listProducts(): Promise<{ products: CatalogProduct[] }> {
    return api.get<{ products: CatalogProduct[] }>("/api/v1/catalog/products", { cache: "no-store" });
  },

  async listStores(): Promise<{ stores: CatalogStore[] }> {
    return api.get<{ stores: CatalogStore[] }>("/api/v1/catalog/stores", { cache: "no-store" });
  },

  async createStore(input: { name: string; url: string }): Promise<{ store: CatalogStore }> {
    return api.post<{ store: CatalogStore }>("/api/v1/catalog/stores", input);
  },

  async previewProduct(url: string): Promise<{ product: ProductPreview }> {
    return api.post<{ product: ProductPreview }>("/api/v1/catalog/products/preview", { url });
  },

  async importProduct(product: ProductPreview): Promise<{ product: CatalogProduct; message?: string }> {
    return api.post<{ product: CatalogProduct; message?: string }>("/api/v1/catalog/products/import", { product });
  },

  async getProduct(id: string): Promise<{ product: Product; images: ProductImage[]; taxonomy: TaxonomyItem[] }> {
    return api.get<{ product: Product; images: ProductImage[]; taxonomy: TaxonomyItem[] }>(
      `/api/v1/catalog/products/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );
  },

  async getProductPrices(id: string, includeHistory = false): Promise<unknown> {
    return api.get(`/api/v1/catalog/products/${encodeURIComponent(id)}/prices`, {
      query: { include_history: includeHistory },
      cache: "no-store",
    });
  },

  async getProductPricesByGtin(gtin: string, includeHistory = false): Promise<unknown> {
    return api.get(`/api/v1/catalog/gtin/${encodeURIComponent(gtin)}/prices`, {
      query: { include_history: includeHistory },
      cache: "no-store",
    });
  },

  async updateProduct(id: string, input: Record<string, unknown>): Promise<{ product: Product }> {
    return api.patch<{ product: Product }>(`/api/v1/catalog/products/${encodeURIComponent(id)}`, input);
  },

  async addProductImage(id: string, imageUrl: string): Promise<{ image: ProductImage }> {
    return api.post<{ image: ProductImage }>(`/api/v1/catalog/products/${encodeURIComponent(id)}/images`, { imageUrl });
  },

  async updateProductImages(id: string, imageIds: string[], primaryImageId?: string): Promise<void> {
    return api.patch<void>(`/api/v1/catalog/products/${encodeURIComponent(id)}/images`, {
      imageIds,
      ...(primaryImageId ? { primaryImageId } : {}),
    });
  },

  async deleteProductImage(id: string, imageId: string): Promise<void> {
    return api.delete<void>(`/api/v1/catalog/products/${encodeURIComponent(id)}/images`, { query: { imageId } });
  },
};
