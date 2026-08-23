import { NextResponse } from "next/server";
import { createOAuthState } from "@/utils/google-drive/crypto";
import { getGoogleDriveConfig } from "@/utils/google-drive/config";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin(request: Request) {
  const response = NextResponse.redirect(new URL("/login?next=/admin", request.url));
  response.headers.set("Clear-Site-Data", '"storage"');
  return response;
}

export async function GET(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return redirectToLogin(request);
  try {
    const config = getGoogleDriveConfig();
    const state = createOAuthState({ userId: identity.user.id, expiresAt: Date.now() + 10 * 60 * 1000 }, config.tokenEncryptionKey);
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code", access_type: "offline", prompt: "consent", include_granted_scopes: "true", scope: config.scopes, state }).toString();
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set("google_drive_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
    return response;
  } catch {
    console.error("Falha ao iniciar autorização Google Drive.");
    return NextResponse.redirect(new URL("/?drive=error", request.url));
  }
}
