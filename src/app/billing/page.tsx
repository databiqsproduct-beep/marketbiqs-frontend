"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Card, PageHeader, Stat } from "@/components/ui";
import { api } from "@/lib/api";

function BillingInner() {
  const search = useSearchParams();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBudget(await api("/api/billing/budget"));
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load billing"))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (search.get("success") === "1" || search.get("success") === "true") {
      setMessage("Payment received — your packs and quotas are updated.");
      load().catch(() => undefined);
    } else if (search.get("canceled") === "1" || search.get("canceled") === "true") {
      setMessage("Checkout canceled — no charges were made.");
    }
  }, [search, load]);

  async function checkout() {
    const packCount = Number.isFinite(packs) ? Math.max(0, Math.floor(packs)) : 0;
    if (packCount < 1) {
      setError("Enter at least 1 pack to check out.");
      return;
    }
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await api<any>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ add_client_packs: packCount }),
      });
      if (res.url && res.mode === "stripe") {
        window.location.href = res.url;
        return;
      }
      setMessage(res.message || "Billing updated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {message ? <p className="text-[var(--accent)] mb-4">{message}</p> : null}
      {loading && !budget ? (
        <div className="text-[var(--muted)]">Loading billing…</div>
      ) : budget ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Plan" value={budget.plan || "—"} />
            <Stat label="Clients" value={`${budget.active_clients ?? 0}/${budget.max_clients ?? 0}`} />
            <Stat label="Reports" value={`${budget.reports_used ?? 0}/${budget.reports_quota ?? 0}`} />
            <Stat
              label="Monthly est."
              value={`$${(((budget.estimated_monthly_cents ?? 0) as number) / 100).toFixed(0)}`}
            />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-semibold">Base Agency · $450/mo</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                Includes {budget.included_clients ?? 0} clients. Status: {budget.billing_status || "—"}. BYOK discount:{" "}
                {budget.byok_discount_percent ?? 0}%.
              </p>
              <div className="mt-4 text-sm">
                Scrape units: {budget.scrape_units_used ?? 0}/{budget.scrape_quota ?? 0}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Lower your bill by adding your own keys under{" "}
                <Link href="/byok" className="text-[var(--accent)] hover:underline">
                  BYOK
                </Link>
                .
              </p>
            </Card>
            <Card>
              <h2 className="font-semibold">Per-client add-on packs</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                $49 per pack. Each pack adds 1 client seat + 8 reports + 800 scrape units.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="w-full sm:w-24 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-50"
                  value={packs}
                  disabled={busy}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPacks(Number.isFinite(next) ? next : 1);
                  }}
                />
                <Button onClick={checkout} className="w-full sm:w-auto" disabled={busy}>
                  {busy ? "Working…" : "Add packs / Stripe checkout"}
                </Button>
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                Current packs: {budget.client_pack_count ?? 0} · meters: reports {budget.reports_used ?? 0}/
                {budget.reports_quota ?? 0}, scrapes {budget.scrape_units_used ?? 0}/{budget.scrape_quota ?? 0}
              </p>
              <p className="text-xs text-[var(--muted)] mt-2">
                Set STRIPE_SECRET_KEY + price IDs for live Agency + pack checkout; otherwise packs apply locally in
                development.
              </p>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">Could not load billing details. Refresh and try again.</p>
          <Button className="mt-3" disabled={busy} onClick={() => {
            setError("");
            setLoading(true);
            load()
              .catch((err) => setError(err instanceof Error ? err.message : "Could not load billing"))
              .finally(() => setLoading(false));
          }}>
            Retry
          </Button>
        </Card>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Agency billing"
        subtitle="Transparent monthly Agency plan with per-client add-on packs and usage-aware quotas."
      />
      <Suspense fallback={<div className="text-[var(--muted)]">Loading billing…</div>}>
        <BillingInner />
      </Suspense>
    </AppShell>
  );
}
