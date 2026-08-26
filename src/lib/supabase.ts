import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = Boolean(url && publishableKey);

/** Survives Google OAuth redirect in the same tab (more reliable than cookies for PKCE). */
export const OAUTH_FLOW_ID_KEY = "biqs_oauth_flow_id";

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client with localStorage PKCE/session storage.
 * OAuth callback is handled in a client page, so cookies are not required.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage,
      },
    });
  }
  return browserClient;
}

export function getSupabaseConfig() {
  return {
    url,
    configured: isSupabaseConfigured,
  };
}
