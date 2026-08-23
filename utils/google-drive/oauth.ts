import { decryptRefreshToken } from "@/utils/google-drive/crypto";
import { getGoogleDriveConfig } from "@/utils/google-drive/config";
import { getSupabaseServerClient } from "@/utils/supabase/server";

type TokenResponse = { access_token?: string; refresh_token?: string; scope?: string; error?: string; error_description?: string };

export async function exchangeGoogleAuthorizationCode(code: string) {
  const config = getGoogleDriveConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
    cache: "no-store",
  });
  const result = await response.json() as TokenResponse;
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "O Google não autorizou a conexão com o Drive.");
  return result;
}

export async function getGoogleAccessToken(refreshTokenCiphertext: string) {
  const config = getGoogleDriveConfig();
  const refreshToken = decryptRefreshToken(refreshTokenCiphertext, config.tokenEncryptionKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: config.clientId, client_secret: config.clientSecret, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const result = await response.json() as TokenResponse;
  if (!response.ok || !result.access_token) throw new Error(result.error_description || "Não foi possível renovar o acesso ao Google Drive.");
  return result.access_token;
}

export async function getDriveConnection(userId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não está configurado no servidor.");
  const { data, error } = await supabase.from("google_drive_connections").select("id, google_account_email, refresh_token_ciphertext, scope, root_folder_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Conecte uma conta Google Drive antes de enviar imagens.");
  return data;
}
