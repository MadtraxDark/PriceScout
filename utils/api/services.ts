import { api, apiUrl, hasApiConfiguration } from "@/utils/api/client";
import type {
  CatalogProduct,
  CatalogStore,
  StoreMarketOption,
  Product,
  ProductImage,
  ProductPreview,
  ProductPreviewResponse,
  OtherStorePrice,
  OtherStorePricesResponse,
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
  // Gera a URL do endpoint FastAPI que inicia o fluxo OAuth.
  // O browser deve navegar diretamente para essa URL (window.location.href),
  // nunca via fetch. A FastAPI retorna 302 para o Supabase/Google.
  signInUrl(nextPath: string): string | null {
    if (!hasApiConfiguration()) return null;
    // window.location.origin so esta disponivel no browser (client component).
    // Nunca use isso em Server Components.
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const safePath =
      typeof nextPath === "string" && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : "/admin";
    const callbackTarget = `${origin}/auth/callback?next=${encodeURIComponent(safePath)}`;
    return apiUrl("/api/v1/auth/google/login", { redirect_frontend_url: callbackTarget });
  },

  async me(): Promise<AuthUserResponse> {
    // Se a requisicao falhar (401, 403, etc), propaga o erro normalmente.
    // NUNCA retornar usuario fake em caso de falha - isso e uma vulnerabilidade de seguranca.
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
      // is_admin e determinado estritamente pelo role retornado pela API.
      // Nunca usar || true aqui - isso tornaria qualquer usuario autenticado admin.
      is_admin: user.role === "admin",
    };
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
    try {
      await api.post<void>("/api/v1/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
      }
    }
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

  async previewProduct(url: string): Promise<ProductPreviewResponse> {
    return api.post<ProductPreviewResponse>("/api/v1/catalog/products/preview", { url });
  },

  async listStoreMarkets(): Promise<{ markets: StoreMarketOption[] }> {
    return api.get<{ markets: StoreMarketOption[] }>("/api/v1/catalog/store-markets", { cache: "no-store" });
  },

  async updateStore(id: string, input: { name: string; url: string; country: string; currency: string; logo_svg?: string | null }): Promise<{ store: CatalogStore }> {
    return api.patch<{ store: CatalogStore }>(`/api/v1/catalog/stores/${encodeURIComponent(id)}`, input);
  },

  async getPreview(previewId: string): Promise<ProductPreviewResponse> {
    return api.get<ProductPreviewResponse>(`/api/v1/catalog/products/previews/${encodeURIComponent(previewId)}`, { cache: "no-store" });
  },

  async discardPreview(previewId: string): Promise<void> {
    await api.delete(`/api/v1/catalog/products/previews/${encodeURIComponent(previewId)}`);
  },

  async importProduct(product: ProductPreview, previewId?: string): Promise<{ product: CatalogProduct; message?: string }> {
    return api.post<{ product: CatalogProduct; message?: string }>("/api/v1/catalog/products/import", previewId ? { preview_id: previewId } : { product });
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

  async updateProductImages(id: string, imageIds: string[], primaryImageId: string): Promise<{
    product_id: string;
    primary_image_id: string;
    images: ProductImage[];
  }> {
    return api.patch(`/api/v1/catalog/products/${encodeURIComponent(id)}/images`, {
      image_ids: imageIds,
      primary_image_id: primaryImageId,
    });
  },

  async searchOtherStorePrices(id: string): Promise<OtherStorePricesResponse> {
    const payload = await api.post<unknown>(
      `/api/v1/catalog/products/${encodeURIComponent(id)}/other-store-prices`,
      undefined,
      { cache: "no-store" },
    );
    return normalizeOtherStorePricesResponse(payload);
  },

  async deleteProductImage(id: string, imageId: string): Promise<void> {
    return api.delete<void>(`/api/v1/catalog/products/${encodeURIComponent(id)}/images`, { query: { imageId } });
  },

  async deleteProduct(id: string): Promise<{ success: boolean; product_id: string; images_removed: number; message: string }> {
    return api.delete<{ success: boolean; product_id: string; images_removed: number; message: string }>(`/api/v1/catalog/products/${encodeURIComponent(id)}`);
  },
};

function normalizeOtherStorePricesResponse(payload: unknown): OtherStorePricesResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("A API retornou uma resposta inválida para a busca de preços.");
  }

  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.prices)) {
    throw new Error("A API não retornou o campo prices na busca de preços.");
  }
  const rawPrices = body.prices;
  const prices = rawPrices.flatMap((entry): OtherStorePrice[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const store = firstString(item.store, item.store_name);
    const currency = firstString(item.currency) ?? "BRL";
    if (!store) return [];
    return [{
      store,
      url: firstString(item.url) ?? "",
      currency,
      originalPrice: firstNumber(item.originalPrice, item.original_price),
      pixPrice: firstNumber(item.pixPrice, item.pix_price),
      cardPrice: firstNumber(item.cardPrice, item.card_price),
    }];
  });

  return {
    success: body.success !== false,
    prices,
    error: typeof body.error === "string" ? body.error : null,
  };
}

function firstString(...values: unknown[]): string | null {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value : null;
}

function firstNumber(...values: unknown[]): number | null {
  const value = values.find((candidate) => typeof candidate === "number" && Number.isFinite(candidate));
  return typeof value === "number" ? value : null;
}
