import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/utils/supabase/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?auth=error", request.url));
  try {
    const supabase = await getSupabaseAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const nextPath = requestUrl.searchParams.get("next");
    const cookieNextPath = request.headers.get("cookie")?.match(/(?:^|;\s*)pricescout_auth_next=([^;]*)/)?.[1];
    const decodedCookieNextPath = cookieNextPath ? decodeURIComponent(cookieNextPath) : null;
    const candidatePath = nextPath || decodedCookieNextPath;
    const safeNextPath = candidatePath && candidatePath.startsWith("/") && !candidatePath.startsWith("//") ? candidatePath : "/admin";
    const response = NextResponse.redirect(new URL(safeNextPath, request.url));
    response.cookies.delete("pricescout_auth_next");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?auth=error", request.url));
  }
}
