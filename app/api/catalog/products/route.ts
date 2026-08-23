import { NextResponse } from "next/server";
import { detectStoreFromUrl } from "@/utils/scraping/store-detector";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  const { data, error } = await supabase.from("catalog_products").select("*, store:catalog_stores(id,name,hostname,url)").order("updated_at", { ascending: false });
  if (error) {
    console.error("Falha ao listar produtos do catálogo.");
    return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor." }, { status: 503 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const source = typeof body.source === "string" ? body.source.trim() : "";
    const externalProductId = typeof body.productId === "string" ? body.productId.trim() : "";
    const productUrl = typeof body.productUrl === "string" ? body.productUrl.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const detection = detectStoreFromUrl(productUrl);
    if (!source || !externalProductId || !productUrl || !name || !detection) return NextResponse.json({ error: "Produto ou loja incompleta." }, { status: 400 });

    const storeName = typeof body.storeName === "string" && body.storeName.trim() ? body.storeName.trim() : detection.hostname;
    const storeUrl = typeof body.storeUrl === "string" && body.storeUrl.trim() ? body.storeUrl.trim() : `https://${detection.hostname}`;
    const { data: store, error: storeError } = await supabase.from("catalog_stores").upsert({ name: storeName, hostname: detection.hostname, url: storeUrl, created_by: identity.user.id }, { onConflict: "hostname" }).select("id,name,hostname,url").single();
    if (storeError || !store) throw storeError || new Error("Não foi possível cadastrar a loja.");

    const row = {
      store_id: store.id,
      source,
      external_product_id: externalProductId,
      product_url: productUrl,
      name,
      brand: typeof body.brand === "string" ? body.brand.trim() || null : null,
      original_price: typeof body.originalPrice === "number" ? body.originalPrice : null,
      pix_price: typeof body.pixPrice === "number" ? body.pixPrice : null,
      pix_discount_percent: typeof body.pixDiscountPercent === "number" ? body.pixDiscountPercent : null,
      card_price: typeof body.cardPrice === "number" ? body.cardPrice : null,
      installments_quantity: typeof body.installmentsQuantity === "number" ? body.installmentsQuantity : null,
      installment_amount: typeof body.installmentAmount === "number" ? body.installmentAmount : null,
      price_difference_pix_to_card: typeof body.priceDifferencePixToCard === "number" ? body.priceDifferencePixToCard : null,
      availability: body.availability === "in_stock" || body.availability === "out_of_stock" ? body.availability : "unknown",
      stock_quantity: typeof body.stockQuantity === "number" ? body.stockQuantity : null,
      seller: typeof body.seller === "string" ? body.seller.trim() || null : null,
      special_status: typeof body.specialStatus === "string" ? body.specialStatus.trim() || null : null,
      shipping_from: typeof body.shippingFrom === "string" ? body.shippingFrom.trim() || null : null,
      created_by: identity.user.id,
    };
    const { data: product, error: productError } = await supabase.from("catalog_products").upsert(row, { onConflict: "source,external_product_id" }).select("*, store:catalog_stores(id,name,hostname,url)").single();
    if (productError || !product) throw productError || new Error("Não foi possível cadastrar o produto.");
    return NextResponse.json({ product, store }, { status: 200 });
  } catch (error) {
    console.error("Falha ao persistir produto e loja do catálogo.");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar o produto." }, { status: 500 });
  }
}
