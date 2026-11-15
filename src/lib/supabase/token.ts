import { createClient, User as SupabaseAuthUser } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Verifies a Bearer access token directly against the Supabase Auth server.
 * Never trusts unverified or decoded JWTs.
 */
export async function verifySupabaseToken(
  token: string
): Promise<SupabaseAuthUser | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    console.error("Token verification exception:", err);
    return null;
  }
}
