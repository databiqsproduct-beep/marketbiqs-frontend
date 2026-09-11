"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser, OAUTH_FLOW_ID_KEY } from "@/lib/supabase";

function friendlyAuthError(message: string): string {
  if (/PKCE code verifier not found/i.test(message)) {
    return "Google sign-in could not finish (login code expired). Close other MarketBiqs tabs, use http://localhost:3000 (not 127.0.0.1), then try Continue with Google once more.";
  }
  if (/redirect|not allowed|whitelist|allow list|allowlist/i.test(message)) {
    return "Auth redirect URL is not allowed. In Supabase → Authentication → URL Configuration add: http://localhost:3000/auth/callback";
  }
  return message;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const oauthError = searchParams.get("error_description") || searchParams.get("error");
      if (oauthError) {
        router.replace(`/login?error=${encodeURIComponent(friendlyAuthError(oauthError))}`);
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace(
          `/login?error=${encodeURIComponent("Missing auth code. Start Google sign-in again from the login page.")}`,
        );
        return;
      }

      const sb = getSupabaseBrowser();
      if (!sb) {
        router.replace(`/login?error=${encodeURIComponent("Supabase is not configured.")}`);
        return;
      }

      let flowId: string | undefined;
      try {
        flowId =
          searchParams.get("sb_flow_id") ||
          sessionStorage.getItem(OAUTH_FLOW_ID_KEY) ||
          undefined;
      } catch {
        flowId = searchParams.get("sb_flow_id") || undefined;
      }

      let { error } = await sb.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );

      // Stale/mismatched flow id must not block the legacy verifier dual-write.
      if (error && flowId && /PKCE code verifier not found/i.test(error.message)) {
        ({ error } = await sb.auth.exchangeCodeForSession(code));
      }

      try {
        sessionStorage.removeItem(OAUTH_FLOW_ID_KEY);
      } catch {
        /* ignore */
      }

      if (cancelled) return;
      if (error) {
        router.replace(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
        return;
      }

      setMessage("Signed in. Opening workspace…");
      router.replace("/auth/complete");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <p className="animate-pulse text-sm tracking-wide uppercase opacity-70">{message}</p>
    </div>
  );
}

/** Google / email-confirm returns here with ?code= — exchange on the client via localStorage PKCE. */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center px-4">
          <p className="animate-pulse text-sm tracking-wide uppercase opacity-70">Finishing sign-in…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
