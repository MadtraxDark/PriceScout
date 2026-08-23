import { NextResponse } from "next/server";
import { uploadProductImages } from "@/utils/google-drive/storage";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function context(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Persistência do catálogo não está configurada no servidor.");
  const { data, error } = await supabase.from("catalog_products").select("id,source,external_product_id,product_url,name,brand,created_by").eq("id", id).single();
  if (error || !data) throw new Error("Produto não encontrado.");
  return { supabase, product: data };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  try {
    const { id } = await params;
    const { supabase, product } = await context(id);
    const body = await request.json() as { imageUrl?: unknown; alt?: unknown };
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!imageUrl) return NextResponse.json({ error: "Informe a URL da nova imagem." }, { status: 400 });
    const { data: last } = await supabase.from("google_drive_product_files").select("sort_order").eq("catalog_product_id", id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const result = await uploadProductImages({ userId: identity.user.id, source: product.source, productId: product.external_product_id, productUrl: product.product_url, productName: product.name, brand: product.brand, images: [{ url: imageUrl, alt: typeof body.alt === "string" ? body.alt : null }] });
    const uploaded = result.files[0];
    await supabase.from("google_drive_product_files").update({ catalog_product_id: id, sort_order: (last?.sort_order ?? -1) + 1 }).eq("user_id", identity.user.id).eq("product_source", product.source).eq("external_product_id", product.external_product_id).eq("drive_file_id", uploaded.fileId);
    const { data: image } = await supabase.from("google_drive_product_files").select("id,drive_file_id,sort_order,source_image_url,created_at").eq("catalog_product_id", id).eq("drive_file_id", uploaded.fileId).single();
    const { data: file } = image ? await supabase.from("google_drive_files").select("drive_file_id,name,mime_type").eq("id", image.drive_file_id).maybeSingle() : { data: null };
    return NextResponse.json({ image: image ? { ...image, name: file?.name || "Imagem do produto", mime_type: file?.mime_type || "application/octet-stream", image_url: `/api/integrations/google-drive/image?fileId=${encodeURIComponent(file?.drive_file_id || uploaded.driveFileId)}` } : null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível adicionar a imagem." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  const body = await request.json() as { imageIds?: unknown; primaryImageId?: unknown };
  const imageIds = Array.isArray(body.imageIds) ? body.imageIds.filter((value): value is string => typeof value === "string") : [];
  if (imageIds.length > 0) {
    await Promise.all(imageIds.map((imageId, index) => supabase.from("google_drive_product_files").update({ sort_order: index }).eq("id", imageId).eq("catalog_product_id", id)));
  }
  if (typeof body.primaryImageId === "string") {
    const { data: image } = await supabase.from("google_drive_product_files").select("id").eq("id", body.primaryImageId).eq("catalog_product_id", id).maybeSingle();
    if (!image) return NextResponse.json({ error: "A imagem principal selecionada não pertence ao produto." }, { status: 400 });
    const { error } = await supabase.from("catalog_products").update({ primary_image_id: image.id }).eq("id", id);
    if (error) return NextResponse.json({ error: "Não foi possível definir a imagem principal." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const { id } = await params;
  const imageId = new URL(request.url).searchParams.get("imageId") || "";
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  const { error } = await supabase.from("google_drive_product_files").delete().eq("id", imageId).eq("catalog_product_id", id);
  if (error) return NextResponse.json({ error: "Não foi possível excluir a imagem." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
