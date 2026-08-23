import { NextResponse } from "next/server";
import { detectStoreFromUrl } from "@/utils/scraping/store-detector";
import { scrapeKabumProduct } from "@/utils/scraping/kabum";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await getRequestUser()) return NextResponse.json({ error: "Autenticação administrativa necessária." }, { status: 401 });
  try {
    const body = await request.json() as { url?: unknown };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const detection = detectStoreFromUrl(url);

    if (!detection) {
      return NextResponse.json({ error: "Informe uma URL válida usando http:// ou https://." }, { status: 400 });
    }
    if (!detection.supported || detection.hostname !== "kabum.com.br") {
      return NextResponse.json({ error: `Não há scraper disponível para ${detection.hostname}.` }, { status: 422 });
    }

    const product = await scrapeKabumProduct(url);
    return NextResponse.json({
      product,
      store: {
        hostname: detection.hostname,
        name: "KaBuM!",
        url: "https://www.kabum.com.br",
        persistence: "not_configured",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar a página do produto.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
