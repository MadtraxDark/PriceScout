import { NextResponse } from "next/server";
import { encryptRefreshToken, verifyOAuthState } from "@/utils/google-drive/crypto";
import { getGoogleDriveConfig } from "@/utils/google-drive/config";
import { exchangeGoogleAuthorizationCode } from "@/utils/google-drive/oauth";
import { getSupabaseServerClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithStatus(request: Request, status: "connected" | "error") {
  const url = new URL("/", request.url);
  url.searchParams.set("drive", status);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError || !code || !state) return redirectWithStatus(request, "error");
  try {
    const config = getGoogleDriveConfig();
    const cookieState = request.headers.get("cookie")?.match(/(?:^|;\s*)google_drive_oauth_state=([^;]+)/)?.[1];
    const verified = verifyOAuthState(state, config.tokenEncryptionKey);
    if (!verified || !cookieState || cookieState !== state) return redirectWithStatus(request, "error");
    const token = await exchangeGoogleAuthorizationCode(code);
    const refreshToken = token.refresh_token;
    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase não está configurado no servidor.");
    const { data: previous } = await supabase.from("google_drive_connections").select("refresh_token_ciphertext").eq("user_id", verified.userId).maybeSingle();
    if (!refreshToken && !previous?.refresh_token_ciphertext) throw new Error("O Google não retornou um refresh token. Revogue a autorização anterior e tente novamente.");
    const googleAccountEmail = await fetchGoogleAccountEmail(token.access_token!);
    const encrypted = refreshToken ? encryptRefreshToken(refreshToken, config.tokenEncryptionKey) : previous!.refresh_token_ciphertext;
    const { error } = await supabase.from("google_drive_connections").upsert({ user_id: verified.userId, google_account_email: googleAccountEmail, refresh_token_ciphertext: encrypted, scope: token.scope || config.scopes, root_folder_id: config.rootFolderId }, { onConflict: "user_id" });
    if (error) throw error;
    const response = redirectWithStatus(request, "connected");
    response.cookies.delete("google_drive_oauth_state");
    return response;
  } catch {
    console.error("Falha no callback Google Drive.");
    return redirectWithStatus(request, "error");
  }
}

async function fetchGoogleAccountEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) return null;
  const data = await response.json() as { email?: string };
  return data.email || null;
}
