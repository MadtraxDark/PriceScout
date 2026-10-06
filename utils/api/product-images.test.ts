import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, before } from "node:test";

describe("product-images adapters", () => {
  before(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  });

  it("renders a valid source and distinct empty, processing, and retryable states", async () => {
    const { ImageWithState } = await import("@/components/ImageViewer");
    const ready = renderToStaticMarkup(createElement(ImageWithState, {
      src: "http://localhost:8000/products/p/images/i/content",
      alt: "Produto",
    }));
    assert.match(ready, /<img[^>]+alt="Produto"/);

    const missing = renderToStaticMarkup(createElement(ImageWithState, {
      src: "",
      alt: "Produto",
      availabilityStatus: "missing",
    }));
    assert.match(missing, /Nenhuma imagem dispon/);
    assert.doesNotMatch(missing, /<img/);

    const processing = renderToStaticMarkup(createElement(ImageWithState, {
      src: "",
      alt: "Produto",
      availabilityStatus: "processing",
    }));
    assert.match(processing, /sendo processada/);
    assert.doesNotMatch(processing, /Tentar novamente/);

    const temporary = renderToStaticMarkup(createElement(ImageWithState, {
      src: "",
      alt: "Produto",
      availabilityStatus: "temporarily_unavailable",
      retryable: true,
    }));
    assert.match(temporary, /Tentar novamente/);
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

  it("diagnoses a missing Drive image without offering retry", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      detail: {
        code: "IMAGE_STORAGE_NOT_FOUND",
        message: "A imagem cadastrada não foi encontrada no armazenamento.",
        image_status: "not_found",
        retryable: false,
      },
    }), { status: 404, headers: { "content-type": "application/json" } });
    try {
      const { diagnoseImageLoadFailure } = await import("./product-images.ts");
      const view = await diagnoseImageLoadFailure(
        "http://localhost:8000/products/p/images/i/content?variant=original",
      );
      assert.equal(view.status, "not_found");
      assert.equal(view.retryable, false);
      assert.match(view.message, /armazenamento/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("marks transient storage failures retryable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      detail: {
        code: "IMAGE_STORAGE_UNAVAILABLE",
        message: "Temporariamente indisponível.",
        image_status: "temporarily_unavailable",
        retryable: true,
      },
    }), { status: 503, headers: { "content-type": "application/json" } });
    try {
      const { diagnoseImageLoadFailure } = await import("./product-images.ts");
      const view = await diagnoseImageLoadFailure("http://localhost:8000/stores/loja/logo");
      assert.equal(view.status, "temporarily_unavailable");
      assert.equal(view.retryable, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not suggest retry for a non-recoverable storage credential failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      detail: {
        code: "IMAGE_STORAGE_ERROR",
        message: "Não foi possível acessar a imagem cadastrada.",
        image_status: "storage_error",
        retryable: false,
      },
    }), { status: 502, headers: { "content-type": "application/json" } });
    try {
      const { diagnoseImageLoadFailure } = await import("./product-images.ts");
      const view = await diagnoseImageLoadFailure(
        "http://localhost:8000/products/p/images/i/content?variant=optimized",
      );
      assert.equal(view.status, "storage_error");
      assert.equal(view.retryable, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
