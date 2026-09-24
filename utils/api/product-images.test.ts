import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

describe("product-images adapters", () => {
  before(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  });

  it("maps API image to catalog without using source_url as media", async () => {
    const { apiImageToCatalogImage, pickPrimaryImageUrl, resolveMediaUrl } = await import(
      "./product-images.ts"
    );

    const mapped = apiImageToCatalogImage({
      image_id: "img-1",
      product_id: "prod-1",
      position: 0,
      is_main: true,
      source_url: "https://cdn.loja.example/photo.jpg",
      original_url: "/products/prod-1/images/img-1/content?variant=original",
      optimized_url: null,
      display_url: "/products/prod-1/images/img-1/content?variant=original",
      original_status: "ready",
      optimized_status: "pending",
      original_width: 100,
      original_height: 100,
      optimized_error: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    assert.equal(mapped.original_url, "/products/prod-1/images/img-1/content?variant=original");
    assert.notEqual(mapped.original_url, "https://cdn.loja.example/photo.jpg");
    assert.equal(
      mapped.display_url,
      "/products/prod-1/images/img-1/content?variant=original",
    );

    const primary = pickPrimaryImageUrl(null, [mapped]);
    assert.equal(
      primary,
      "http://localhost:8000/products/prod-1/images/img-1/content?variant=original",
    );
    assert.equal(
      resolveMediaUrl("/products/prod-1/images/img-1/content?variant=optimized"),
      "http://localhost:8000/products/prod-1/images/img-1/content?variant=optimized",
    );
  });

  it("uses API primary_image_url when gallery empty", async () => {
    const { pickPrimaryImageUrl } = await import("./product-images.ts");
    const primary = pickPrimaryImageUrl(
      "/products/p/images/i/content?variant=original",
      [],
    );
    assert.equal(
      primary,
      "http://localhost:8000/products/p/images/i/content?variant=original",
    );
  });
});
