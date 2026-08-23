import { getSupabaseAuthServerClient } from "@/utils/supabase/auth-server";

export async function getRequestUser() {
  const supabase = await getSupabaseAuthServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { app_metadata?: { role?: unknown; is_admin?: unknown } } | undefined;
  if (!claims || (claims.app_metadata?.role !== "admin" && claims.app_metadata?.is_admin !== true)) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user };
}
