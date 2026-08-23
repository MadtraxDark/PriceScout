import { NextResponse } from "next/server";
import { downloadDriveFile } from "@/utils/google-drive/api";
import { getDriveConnection } from "@/utils/google-drive/oauth";
import { getSupabaseServerClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return new NextResponse("Autenticação administrativa necessária.", { status: 401 });
  const fileId = new URL(request.url).searchParams.get("fileId")?.trim() || "";
  if (!fileId || fileId.length > 200) return new NextResponse("Referência de imagem inválida.", { status: 400 });
  const supabase = getSupabaseServerClient();
  if (!supabase) return new NextResponse("Persistência do catálogo não está configurada no servidor.", { status: 503 });
  const { data: file, error } = await supabase.from("google_drive_files").select("drive_file_id,mime_type").eq("user_id", identity.user.id).eq("drive_file_id", fileId).maybeSingle();
  if (error || !file) return new NextResponse("Imagem não encontrada.", { status: 404 });
  if (!file.mime_type.startsWith("image/")) return new NextResponse("O arquivo referenciado não é uma imagem.", { status: 415 });
  try {
    const connection = await getDriveConnection(identity.user.id);
    const downloaded = await downloadDriveFile(connection, file.drive_file_id);
    return new NextResponse(new Uint8Array(downloaded.bytes), { headers: { "content-type": file.mime_type, "cache-control": "private, max-age=300" } });
  } catch {
    return new NextResponse("Não foi possível carregar a imagem do Google Drive.", { status: 502 });
  }
}
