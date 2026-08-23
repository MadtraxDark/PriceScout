import { NextResponse } from "next/server";
import { getDriveConnection, getGoogleAccessToken } from "@/utils/google-drive/oauth";
import { getRequestUser } from "@/utils/supabase/request-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getRequestUser();
  if (!identity) return NextResponse.json({ error: "Faça login antes de consultar o Google Drive." }, { status: 401 });
  try {
    const connection = await getDriveConnection(identity.user.id);
    await getGoogleAccessToken(connection.refresh_token_ciphertext);
    return NextResponse.json({ connected: true, connection: { email: connection.google_account_email } });
  } catch {
    return NextResponse.json({ connected: false, reauthorizationRequired: true, connection: null });
  }
}
