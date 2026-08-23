import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logProductRouteError(stage: string, productId: string, error: { code?: string; message?: string; details?: string; hint?: string } | null) {
  console.error("Falha na API de gerenciamento do produto", {
    stage,
    productId,
    code: error?.code || "unknown",
    message: error?.message || "unknown",
    details: error?.details || null,
    hint: error?.hint || null,
  });
}

function imagePayload(image: { id: string; drive_file_id: string; sort_order: number }, file?: { drive_file_id: string; name: string; mime_type: string }) {
  const driveFileId = file?.drive_file_id || image.drive_file_id;
  return { ...image, name: file?.name || "Imagem do produto", mime_type: file?.mime_type || "application/octet-stream", source_image_url: null, image_url: `/api/integrations/google-drive/image?fileId=${encodeURIComponent(driveFileId)}` };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  const { data: product, error } = await supabase.from("catalog_products").select("*, store:catalog_stores(id,name,hostname,url)").eq("id", id).maybeSingle();
  if (error) { logProductRouteError("load_product", id, error); return NextResponse.json({ error: "Não foi possível carregar o produto." }, { status: 500 }); }
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  let { data: images, error: imageError } = await supabase.from("google_drive_product_files").select("id,drive_file_id,sort_order").eq("catalog_product_id", id).order("sort_order", { ascending: true });
  let { data: taxonomy, error: taxonomyError } = await supabase.from("product_category_assignments").select("level,category:product_categories(id,name,slug,level,source_url)").eq("catalog_product_id", id).order("level", { ascending: true });
  if (imageError) {
    logProductRouteError("load_images_by_internal_id", id, imageError);
    const fallback = await supabase.from("google_drive_product_files").select("id,drive_file_id,sort_order").eq("user_id", product.created_by).eq("product_source", product.source).eq("external_product_id", product.external_product_id).order("sort_order", { ascending: true });
    images = fallback.data;
    imageError = fallback.error;
    if (imageError) logProductRouteError("load_images_by_source_id", id, imageError);
  }
  if (taxonomyError) {
    logProductRouteError("load_taxonomy_by_internal_id", id, taxonomyError);
    const fallback = await supabase.from("product_category_assignments").select("level,category:product_categories(id,name,slug,level,source_url)").eq("product_source", product.source).eq("external_product_id", product.external_product_id).order("level", { ascending: true });
    taxonomy = fallback.data;
    taxonomyError = fallback.error;
    if (taxonomyError) logProductRouteError("load_taxonomy_by_source_id", id, taxonomyError);
  }
  // A relação por ID interno é a fonte preferencial; o fallback preserva compatibilidade com bancos antigos.
  if (imageError || taxonomyError) { logProductRouteError("load_relations", id, imageError || taxonomyError); return NextResponse.json({ error: "Não foi possível carregar as relações do produto." }, { status: 500 }); }
  const fileIds = (images ?? []).map((image) => image.drive_file_id);
  const { data: files, error: filesError } = fileIds.length > 0 ? await supabase.from("google_drive_files").select("id,drive_file_id,name,mime_type").in("id", fileIds) : { data: [], error: null };
  if (filesError) { logProductRouteError("load_drive_files", id, filesError); return NextResponse.json({ error: "Não foi possível carregar as imagens do produto." }, { status: 500 }); }
  const filesById = new Map((files ?? []).map((file) => [file.id, file]));
  return NextResponse.json({ product, images: (images ?? []).map((image) => imagePayload(image, filesById.get(image.drive_file_id))), taxonomy: taxonomy ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const allowed = ["name", "brand", "product_url", "availability", "stock_quantity", "seller", "special_status", "shipping_from", "original_price", "pix_price", "pix_discount_percent", "card_price", "installments_quantity", "installment_amount", "price_difference_pix_to_card"];
    const updates: Record<string, unknown> = {};
    for (const field of allowed) if (field in body) updates[field] = body[field] === "" ? null : body[field];
    if (typeof updates.name === "string" && updates.name.trim() === "") return NextResponse.json({ error: "O nome do produto é obrigatório." }, { status: 400 });
    if (updates.availability !== undefined && !["in_stock", "out_of_stock", "unknown"].includes(String(updates.availability))) return NextResponse.json({ error: "Disponibilidade inválida." }, { status: 400 });
    const { data: product, error } = await supabase.from("catalog_products").update(updates).eq("id", id).select("*, store:catalog_stores(id,name,hostname,url)").single();
    if (error || !product) return NextResponse.json({ error: "Não foi possível salvar as alterações." }, { status: 500 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Dados de atualização inválidos." }, { status: 400 });
  }
}
