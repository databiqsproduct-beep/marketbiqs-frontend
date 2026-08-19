import { NextResponse } from "next/server";
import { publicSiteOrigin } from "@/lib/site-url";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Google / OAuth returns here with ?code=.
 * Exchange must run on the server so the PKCE verifier cookie is readable.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicSiteOrigin(request);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/complete`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message || "Could not complete sign-in")}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Missing auth code. Start Google sign-in again from the login page.")}`,
  );
}
