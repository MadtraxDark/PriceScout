import { NextResponse } from "next/server";
import { getRequestUser } from "@/utils/supabase/request-user";
import { uploadProductImages } from "@/utils/google-drive/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { source?: unknown; productId?: unknown; productUrl?: unknown; productName?: unknown; brand?: unknown; images?: unknown };

export async function POST(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Faça login antes de enviar imagens para o Google Drive." }, { status: 401 });
  try {
    const body = await request.json() as Body;
    const source = typeof body.source === "string" ? body.source.trim() : "";
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const productUrl = typeof body.productUrl === "string" ? body.productUrl.trim() : "";
    const productName = typeof body.productName === "string" ? body.productName.trim() : "";
    const brand = typeof body.brand === "string" ? body.brand.trim() || null : null;
    const images = Array.isArray(body.images) ? body.images.filter((item): item is { url: string; alt?: string | null } => Boolean(item && typeof item === "object" && typeof (item as { url?: unknown }).url === "string" && (item as { url: string }).url.trim())) : [];
    if (!source || !productId || !productUrl || !productName || images.length === 0) return NextResponse.json({ error: "Produto ou imagens incompletos." }, { status: 400 });
    const result = await uploadProductImages({ userId: identity.user.id, source, productId, productUrl, productName, brand, images });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Falha ao armazenar imagens no Google Drive.");
    const message = error instanceof Error ? error.message : "Não foi possível armazenar as imagens.";
    const reauthorizationRequired = message.includes("renovar o acesso") || message.includes("Conecte uma conta Google Drive");
    return NextResponse.json({ error: reauthorizationRequired ? "A autorização do Google Drive precisa ser renovada." : "Não foi possível armazenar as imagens no Google Drive.", reauthorizationRequired }, { status: reauthorizationRequired ? 409 : 500 });
  }
}
