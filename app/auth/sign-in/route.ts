import { NextResponse } from "next/server";
import { getSupabaseAuthServerClient } from "@/utils/supabase/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const nextPath = requestUrl.searchParams.get("next");
    const safeNextPath = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/admin";
    const supabase = await getSupabaseAuthServerClient();
    const redirectTo = new URL("/auth/callback", request.url).toString();
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error || !data.url) throw new Error("Não foi possível iniciar o login administrativo.");
    const response = NextResponse.redirect(data.url);
    response.cookies.set("pricescout_auth_next", safeNextPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?auth=error", request.url));
  }
}
