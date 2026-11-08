import assert from "node:assert/strict";
import { it } from "node:test";

// Dados de teste isolados: identificadores genéricos, sem registros reais.
const savedView = (overrides: Record<string, unknown> = {}) => ({
  id: "saved-product", title: "Produto aprovado", attributes: {}, listings: [],
  images: [], created_at: "2026-10-05T00:00:00Z", updated_at: "2026-10-05T00:00:00Z",
  ...overrides,
});

it("salva referências em um POST sem aguardar uploads de imagens", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  const { api } = await import("./client");
  const { catalogApi } = await import("./services");
  const originalPost = api.post;
  const originalGet = api.get;
  const calls: Array<{ path: string; body: unknown }> = [];
  api.post = (async (path: string, body: unknown) => {
    calls.push({ path, body });
    assert.equal(path, "/products", "upload individual não pertence ao caminho crítico");
    return { created: true, listing_created: true, resolution: "new_product", product: savedView() };
  }) as typeof api.post;
  api.get = (async () => { throw new Error("GET adicional bloqueia a conclusão"); }) as typeof api.get;
  try {
    const result = await catalogApi.importProduct({
      name: "Produto aprovado", source: "magazineluiza", url: "https://www.magazineluiza.com.br/p/123",
      images: [{ url: "https://cdn.example/1.jpg" }, { url: " https://cdn.example/1.jpg " }, { url: "https://cdn.example/2.jpg" }],
    } as Parameters<typeof catalogApi.importProduct>[0]);
    assert.equal(result.product.id, "saved-product");
    assert.equal(result.resolution, "new_product");
    assert.match(result.message ?? "", /segundo plano/);
    assert.equal(calls.length, 1);
    assert.deepEqual((calls[0].body as { images: unknown }).images, [
      { source_url: "https://cdn.example/1.jpg", position: 0, is_main: true },
      { source_url: "https://cdn.example/2.jpg", position: 1, is_main: false },
    ]);
    const many = await catalogApi.importProduct({
      name: "Produto com galeria extensa", source: "magazineluiza",
      url: "https://www.magazineluiza.com.br/p/123",
      images: Array.from({ length: 25 }, (_, i) => ({ url: `https://cdn.example/${i}.jpg` })),
    } as Parameters<typeof catalogApi.importProduct>[0]);
    assert.equal((calls[1].body as { images: unknown[] }).images.length, 20);
    assert.match(many.message ?? "", /primeiras 20 de 25/);
  } finally {
    api.post = originalPost;
    api.get = originalGet;
  }
});

it("não anuncia produto salvo quando a API reutilizou o cadastro, mesmo com imagens", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  const { api } = await import("./client");
  const { catalogApi } = await import("./services");
  const originalPost = api.post;
  const responses = [
    { created: false, listing_created: false, resolution: "existing_listing", product: savedView() },
    { created: false, listing_created: true, resolution: "existing_product_new_listing", product: savedView() },
  ];
  api.post = (async () => responses.shift()) as typeof api.post;
  try {
    const preview = {
      name: "Produto aprovado", source: "kabum", url: "https://loja.example/p/1",
      images: [{ url: "https://cdn.example/1.jpg" }],
    } as Parameters<typeof catalogApi.importProduct>[0];
    const same = await catalogApi.importProduct(preview);
    assert.equal(same.resolution, "existing_listing");
    assert.match(same.message ?? "", /já estava cadastrada/);
    assert.doesNotMatch(same.message ?? "", /segundo plano|Produto salvo/);
    const offer = await catalogApi.importProduct(preview);
    assert.equal(offer.resolution, "existing_product_new_listing");
    assert.equal(offer.listingCreated, true);
    assert.match(offer.message ?? "", /oferta desta loja foi adicionada/);
  } finally {
    api.post = originalPost;
  }
});

it("envia a decisão do usuário quando a resolução pediu revisão", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  const { api } = await import("./client");
  const { catalogApi } = await import("./services");
  const originalPost = api.post;
  const bodies: Array<Record<string, unknown>> = [];
  api.post = (async (_path: string, body: unknown) => {
    bodies.push(body as Record<string, unknown>);
    return { created: false, listing_created: true, resolution: "existing_product_new_listing", matched_by: "user_confirmed", product: savedView() };
  }) as typeof api.post;
  try {
    const preview = { name: "Produto", source: "kabum", url: "https://loja.example/p/2" } as Parameters<typeof catalogApi.importProduct>[0];
    await catalogApi.importProduct(preview, undefined, { kind: "attach", productId: "existing-id" });
    await catalogApi.importProduct(preview, undefined, { kind: "create" });
    assert.equal(bodies[0].target_product_id, "existing-id");
    assert.equal(bodies[0].create_new_product, undefined);
    assert.equal(bodies[1].create_new_product, true);
    assert.equal(bodies[1].target_product_id, undefined);
  } finally {
    api.post = originalPost;
  }
});

it("resolve consulta a API sem imagens e mapeia o produto existente", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
  const { api } = await import("./client");
  const { catalogApi } = await import("./services");
  const originalPost = api.post;
  const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  api.post = (async (path: string, body: unknown) => {
    calls.push({ path, body: body as Record<string, unknown> });
    return {
      resolution: "needs_review", matched_by: "identity", match_confidence: "0.8100",
      product: savedView({ id: "candidate", title: "Produto existente", brand: "Marca" }), listing: null,
    };
  }) as typeof api.post;
  try {
    const result = await catalogApi.resolveProduct({
      name: "Produto", source: "kabum", url: "https://loja.example/p/3", productId: "3",
      images: [{ url: "https://cdn.example/3.jpg" }],
    } as Parameters<typeof catalogApi.resolveProduct>[0]);
    assert.equal(calls[0].path, "/products/resolve");
    assert.equal("images" in calls[0].body, false);
    assert.equal(calls[0].body.product_id, "3");
    assert.equal(result.kind, "needs_review");
    assert.equal(result.matchedBy, "identity");
    assert.equal(result.confidence, 0.81);
    assert.equal(result.existing?.id, "candidate");
    assert.equal(result.existing?.name, "Produto existente");
  } finally {
    api.post = originalPost;
  }
});
