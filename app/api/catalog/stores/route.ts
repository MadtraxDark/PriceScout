import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Persistência do catálogo não está configurada no servidor." }, { status: 503 });
  const { data, error } = await supabase.from("catalog_stores").select("*, products:catalog_products(id)").order("updated_at", { ascending: false });
  if (error) {
    console.error("Falha ao listar lojas do catálogo.");
    return NextResponse.json({ error: "Não foi possível carregar as lojas." }, { status: 500 });
  }
  return NextResponse.json({ stores: (data ?? []).map((store) => ({ ...store, productCount: Array.isArray(store.products) ? store.products.length : 0, products: undefined })) });
}

export async function POST(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor." }, { status: 503 });
  try {
    const body = await request.json() as { name?: unknown; url?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const parsed = new URL(url);
    if (!name || !["http:", "https:"].includes(parsed.protocol)) return NextResponse.json({ error: "Nome ou URL da loja inválida." }, { status: 400 });
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const { data, error } = await supabase.from("catalog_stores").upsert({ name, hostname, url, created_by: identity.user.id }, { onConflict: "hostname" }).select("id,name,hostname,url,updated_at").single();
    if (error || !data) throw error || new Error("Não foi possível cadastrar a loja.");
    return NextResponse.json({ store: { ...data, productCount: 0 } });
  } catch (error) {
    console.error("Falha ao persistir loja do catálogo.");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível salvar a loja." }, { status: 500 });
  }
}
