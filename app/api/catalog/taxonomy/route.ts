import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import type { KabumTaxonomyNode } from "@/utils/scraping/kabum";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  try {
    const body = await request.json() as { source?: unknown; productId?: unknown; productUrl?: unknown; taxonomy?: unknown };
    const source = typeof body.source === "string" ? body.source.trim() : "";
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const productUrl = typeof body.productUrl === "string" ? body.productUrl.trim() : "";
    const taxonomy = Array.isArray(body.taxonomy) ? body.taxonomy as KabumTaxonomyNode[] : [];
    if (!source || !productId || !productUrl || taxonomy.length === 0) {
      return NextResponse.json({ error: "Produto ou taxonomia incompleta." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor para persistir a taxonomia." }, { status: 503 });
    }

    const { data, error } = await supabase.rpc("upsert_product_taxonomy", {
      p_product_source: source,
      p_external_product_id: productId,
      p_product_url: productUrl,
      p_taxonomy: taxonomy,
    });
    if (error) throw error;
    return NextResponse.json({ taxonomy: data ?? [] });
  } catch (error) {
    console.error("Falha ao persistir taxonomia do produto:", error);
    const message = error instanceof Error ? error.message : "Não foi possível salvar a taxonomia.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
