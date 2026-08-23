import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" }));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin")) {
    const claims = data?.claims as { app_metadata?: { role?: unknown; is_admin?: unknown } } | undefined;
    if (!claims) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(loginUrl);
    }
    if (claims.app_metadata?.role !== "admin" && claims.app_metadata?.is_admin !== true) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/forbidden";
      forbiddenUrl.search = "";
      return NextResponse.redirect(forbiddenUrl);
    }
  }
  return response;
}
