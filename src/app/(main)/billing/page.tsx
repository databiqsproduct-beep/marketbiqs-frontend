"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, PageHeader, Stat } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  included_clients: number;
  included_reports: number;
  included_scrapes: number;
  included_rivals?: number;
  checkout_ready: boolean;
};

type BillingBudget = {
  plan: string;
  plan_name: string;
  billing_status: string;
  cancel_at_period_end: boolean;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  base_price_cents: number;
  client_pack_count: number;
  client_pack_price_cents: number;
  scrape_pack_count: number;
  scrape_pack_price_cents: number;
  scrape_pack_units: number;
  extra_scrape_units: number;
  included_clients: number;
  max_clients: number;
  active_clients: number;
  reports_used: number;
  reports_quota: number;
  scrape_units_used: number;
  scrape_quota: number;
  max_tracked_rivals?: number | null;
  included_scrape_units?: number;
  scrape_overage_lots?: number;
  intel_runs_used?: number;
  usage_lines?: {
    key: string;
    label: string;
    quantity: number;
    unit_cents: number;
    amount_cents: number;
  }[];
  payg_rates?: {
    client_cents: number;
    intel_run_cents: number;
    report_cents: number;
    scrape_unit_cents: number;
  } | null;
  byok_discount_percent: number;
  list_price_cents?: number;
  estimated_monthly_cents: number;
  stripe_configured: boolean;
  has_subscription: boolean;
  billing_model: string;
  payg_available: boolean;
  amount_paid_cents?: number;
  upcoming_invoice_cents?: number;
  catalog: {
    plans: Plan[];
    pack: {
      name: string;
      price_cents: number;
      extra_clients: number;
      extra_reports: number;
      extra_scrapes: number;
      checkout_ready: boolean;
    };
      scrape_pack: {
      name: string;
      price_cents: number;
      units: number;
      options: number[];
      checkout_ready: boolean;
    };
    payg?: {
      name: string;
      checkout_ready: boolean;
      client_cents: number;
      intel_run_cents: number;
      report_cents: number;
      scrape_unit_cents: number;
    };
  };
};

function money(cents: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format((cents || 0) / 100);
}

function BillingInner() {
  const search = useSearchParams();
  const { role } = useAuth();
  const canManage = role === "owner" || role === "admin";
  const [budget, setBudget] = useState<BillingBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState(1);
  const [scrapeUnits, setScrapeUnits] = useState(0);
  const [busy, setBusy] = useState<"checkout" | "packs" | "scrapes" | "portal" | "verify" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const next = await api<BillingBudget>("/api/billing/budget");
    setBudget(next);
    setScrapeUnits(next.extra_scrape_units || 0);
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load billing"))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const sessionId = search.get("session_id");
    if (search.get("checkout") === "canceled") {
      setMessage("Checkout canceled; no charges were made.");
      return;
    }
    if (!sessionId || !canManage) return;

    let stopped = false;
    async function verify() {
      setBusy("verify");
      setError("");
      for (let attempt = 0; attempt < 6 && !stopped; attempt += 1) {
        try {
          const result = await api<{ ready: boolean; payment_status: string }>(
            `/api/billing/checkout-session/${encodeURIComponent(sessionId!)}`,
          );
          await load();
          if (result.ready) {
            setMessage("Payment confirmed. Your subscription and quotas are active.");
            setBusy("");
            return;
          }
        } catch (err) {
          try {
            await load();
          } catch {
            /* keep verify error */
          }
          if (attempt === 5) {
            setError(err instanceof Error ? err.message : "Could not verify checkout");
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (!stopped) setBusy("");
    }
    void verify();
    return () => {
      stopped = true;
    };
  }, [search, load, canManage]);

  async function checkout(packCount = 0, billingModel = "plan", extraScrapeUnits = 0) {
    if (!budget || !canManage) return;
    setError("");
    setMessage("");
    setBusy("checkout");
    try {
      const res = await api<any>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          add_client_packs: Math.max(0, Math.floor(packCount)),
          add_scrape_units: Math.max(0, Math.floor(extraScrapeUnits)),
          billing_model: billingModel,
          request_id: crypto.randomUUID(),
          success_url: `${window.location.origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/billing?checkout=canceled`,
        }),
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error("Stripe did not return a checkout URL.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy("");
    }
  }

  async function addPacks() {
    if (!budget || !canManage) return;
    if (budget.billing_model === "payg") {
      setError("PAYG bills usage directly; client add-on packs are only for the $450 Agency plan.");
      return;
    }
    const packCount = Number.isFinite(packs) ? Math.max(0, Math.floor(packs)) : 0;
    if (packCount < 1) {
      setError("Enter at least 1 pack to check out.");
      return;
    }
    if (!budget.has_subscription) {
      await checkout(packCount, budget.payg_available && budget.billing_model === "payg" ? "payg" : "plan");
      return;
    }
    setBusy("packs");
    setError("");
    setMessage("");
    try {
      const quantity = budget.client_pack_count + packCount;
      await api("/api/billing/packs", {
        method: "POST",
        body: JSON.stringify({ client_pack_count: quantity }),
      });
      await load();
      setMessage(`${packCount} pack${packCount === 1 ? "" : "s"} added. Stripe will prorate the change.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add packs");
    } finally {
      setBusy("");
    }
  }

  async function updateScrapes() {
    if (!budget || !canManage) return;
    if (budget.billing_model === "payg") {
      setError("PAYG already bills scrape units from usage; extra scrape packs are only for the Agency plan.");
      return;
    }
    if (!budget.has_subscription) {
      if (!scrapeUnits) {
        setError("Choose extra scrape units, then check out with the Individual plan.");
        return;
      }
      await checkout(0, "plan", scrapeUnits);
      return;
    }
    setBusy("scrapes");
    setError("");
    setMessage("");
    try {
      await api("/api/billing/scrape-units", {
        method: "POST",
        body: JSON.stringify({ scrape_units: scrapeUnits }),
      });
      await load();
      setMessage(
        scrapeUnits
          ? `${scrapeUnits.toLocaleString()} extra scrape units added. Stripe will prorate ${money(
              (scrapeUnits / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents,
            )}/month.`
          : "Extra scrape units removed.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update scrape units");
    } finally {
      setBusy("");
    }
  }

  async function openPortal() {
    if (!canManage) return;
    setBusy("portal");
    setError("");
    try {
      const result = await api<{ url: string }>("/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({ return_url: `${window.location.origin}/billing` }),
      });
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal");
      setBusy("");
    }
  }

  const isSubscribed = Boolean(
    budget?.has_subscription &&
      budget?.billing_status !== "not_subscribed" &&
      budget?.billing_status !== "canceled" &&
      budget?.billing_status !== "inactive",
  );

  const statusTone = !isSubscribed
    ? "text-[var(--muted)]"
    : budget?.billing_status === "active" || budget?.billing_status === "trialing"
      ? "text-[var(--accent)]"
      : budget?.billing_status === "past_due" || budget?.billing_status === "unpaid"
        ? "text-red-600"
        : "text-amber-700";

  const displayStatus =
    busy === "verify"
      ? "Confirming payment…"
      : !isSubscribed
        ? "Not subscribed"
        : (budget?.billing_status || "Not subscribed").replaceAll("_", " ");

  return (
    <>
      <PageHeader
        title={`${budget?.plan_name || "Workspace"} billing`}
        subtitle={
          budget?.billing_model === "payg"
            ? "No fixed $49 plan. Card on file: month-end bill reflects clients, intel runs, reports, and scrapes you actually used."
            : budget?.plan === "creator"
              ? "Individual: $99/month for your brand (10 reports, 500 scrape units, up to 10 competitors). Extra scrape units $5 per 100. No client packs and no PAYG."
              : "Monthly Agency plan, or usage-based PAYG if you do not want the $450 subscription."
        }
      />
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {message ? <p className="text-[var(--accent)] mb-4">{message}</p> : null}
      {loading && !budget ? (
        <div className="text-[var(--muted)]">Loading billing…</div>
      ) : budget ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {budget.billing_model === "payg" ? (
              <>
                <Stat label="Clients" value={String(budget.active_clients ?? 0)} />
                <Stat label="Intel runs" value={String(budget.intel_runs_used ?? 0)} />
                <Stat label="Reports" value={String(budget.reports_used ?? 0)} />
                <Stat label="Scrapes" value={String(budget.scrape_units_used ?? 0)} />
              </>
            ) : (
              <>
                <Stat
                  label={budget.plan === "creator" ? "Your brand" : "Clients"}
                  value={`${budget.active_clients ?? 0}/${budget.max_clients ?? 0}`}
                />
                <Stat label="Reports" value={`${budget.reports_used ?? 0}/${budget.reports_quota ?? 0}`} />
                <Stat
                  label="Scrape units"
                  value={`${(budget.scrape_units_used ?? 0).toLocaleString()}/${(budget.scrape_quota ?? 0).toLocaleString()}`}
                />
                <Stat
                  label="Monthly total"
                  value={isSubscribed ? money(budget.estimated_monthly_cents) : "$0"}
                />
              </>
            )}
          </div>
          {budget.billing_model === "payg" ? (
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Stat label="Bill so far" value={money(budget.estimated_monthly_cents, 2)} />
              <Stat
                label="Month-end invoice"
                value={money(budget.estimated_monthly_cents, 2)}
              />
            </div>
          ) : null}

          <Card className="mb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Subscription status</h2>
                <p className={`mt-1 text-sm font-medium capitalize ${statusTone}`}>
                  {displayStatus}
                  {budget.cancel_at_period_end ? " · cancels at period end" : ""}
                </p>
                {isSubscribed && budget.billing_period_end ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Current period ends {new Date(budget.billing_period_end).toLocaleDateString()}.
                  </p>
                ) : !isSubscribed ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    No active subscription. Subscribe to a plan or start PAYG below.
                  </p>
                ) : null}
              </div>
              {budget.has_subscription && canManage ? (
                <Button variant="ghost" disabled={!!busy} onClick={() => void openPortal()}>
                  {busy === "portal" ? "Opening…" : "Manage payment & invoices"}
                </Button>
              ) : null}
            </div>
            {!canManage ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Billing is read-only for your role. Ask an owner or admin to make changes.
              </p>
            ) : null}
          </Card>

          {budget.billing_model === "payg" ? (
            <div className="grid lg:grid-cols-2 gap-4 mb-4">
              <Card className="border-[var(--accent)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Bill so far this period</h2>
                    <div className="mt-1 text-2xl font-semibold">
                      {money(budget.estimated_monthly_cents, 2)}
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent)]">
                    Usage PAYG
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  No fixed plan. Stripe charges this total at period end
                  {budget.billing_period_end
                    ? ` (${new Date(budget.billing_period_end).toLocaleDateString()})`
                    : ""}
                  .
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                    {(budget.usage_lines || []).map((line) => (
                    <li key={line.key} className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">
                        {line.label} · {line.quantity.toLocaleString()} × {money(line.unit_cents, 2)}
                      </span>
                      <span className="font-medium">{money(line.amount_cents, 2)}</span>
                    </li>
                  ))}
                  {budget.byok_discount_percent && (budget.list_price_cents || 0) > budget.estimated_monthly_cents ? (
                    <li className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-2">
                      <span className="text-[var(--muted)]">BYOK {budget.byok_discount_percent}% off</span>
                      <span className="font-medium">
                        −{money((budget.list_price_cents || 0) - budget.estimated_monthly_cents, 2)}
                      </span>
                    </li>
                  ) : null}
                </ul>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Month-end invoice equals this usage total
                  {budget.billing_period_end
                    ? ` · due ${new Date(budget.billing_period_end).toLocaleDateString()}`
                    : ""}
                  .
                </p>
              </Card>
              <Card>
                <h2 className="font-semibold">Usage this period</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  These meters drive the bill. Add a client, run intel, or generate a report and the running total updates.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between gap-3">
                    <span className="text-[var(--muted)]">Active clients</span>
                    <span className="font-medium">{budget.active_clients ?? 0}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-[var(--muted)]">Intel runs</span>
                    <span className="font-medium">{budget.intel_runs_used ?? 0}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-[var(--muted)]">Reports generated</span>
                    <span className="font-medium">{budget.reports_used ?? 0}</span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-[var(--muted)]">Scrape units used</span>
                    <span className="font-medium">{(budget.scrape_units_used ?? 0).toLocaleString()}</span>
                  </li>
                </ul>
                {budget.payg_rates || budget.catalog.payg ? (
                  <p className="mt-4 text-xs text-[var(--muted)]">
                    Rates: {money((budget.payg_rates || budget.catalog.payg)!.client_cents, 2)}/client ·{" "}
                    {money((budget.payg_rates || budget.catalog.payg)!.intel_run_cents, 2)}/intel run ·{" "}
                    {money((budget.payg_rates || budget.catalog.payg)!.report_cents, 2)}/report ·{" "}
                    {money((budget.payg_rates || budget.catalog.payg)!.scrape_unit_cents, 2)}/scrape
                  </p>
                ) : null}
              </Card>
            </div>
          ) : budget.has_subscription ? (
            budget.catalog.plans
              .filter((plan) => plan.id === budget.plan)
              .map((plan) => (
                <Card key={plan.id} className="mb-4 border-[var(--accent)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{plan.name}</h2>
                      <div className="mt-1 text-2xl font-semibold">
                        {budget.byok_discount_percent && (budget.list_price_cents || 0) > budget.estimated_monthly_cents ? (
                          <>
                            <span className="mr-2 text-lg font-normal text-[var(--muted)] line-through">
                              {money(budget.list_price_cents || plan.price_cents)}
                            </span>
                            {money(budget.estimated_monthly_cents)}
                          </>
                        ) : (
                          money(plan.price_cents)
                        )}
                        <span className="text-sm font-normal text-[var(--muted)]">/month</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent)]">
                      Your plan
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {plan.id === "creator"
                      ? `${plan.included_clients} brand · ${plan.included_reports} reports/month · ${plan.included_scrapes.toLocaleString()} scrape units · up to ${plan.included_rivals ?? budget.max_tracked_rivals ?? 10} competitors`
                      : `${plan.included_clients} client${plan.included_clients === 1 ? "" : "s"} · ${plan.included_reports} reports · ${plan.included_scrapes.toLocaleString()} scrape units · 10 rivals per intel run`}
                  </p>
                  {plan.id === "creator" ? (
                    <ul className="mt-4 space-y-1.5 text-sm text-[var(--muted)]">
                      <li>Your brand workspace only (no extra client packs).</li>
                      <li>10 reports per month included.</li>
                      <li>500 scrape units per month included. Extra lots are $5 per 100 units.</li>
                      <li>Track up to 10 competitors. Each intel run can refresh or add within that cap (max 10 per run).</li>
                      <li>PAYG is Agency-only and is not available on Individual.</li>
                    </ul>
                  ) : null}
                </Card>
              ))
          ) : budget.payg_available ? (
            <div className="grid lg:grid-cols-2 gap-4 mb-4">
              <Card>
                <h2 className="font-semibold">Agency subscription</h2>
                <div className="mt-1 text-2xl font-semibold">$450<span className="text-sm font-normal text-[var(--muted)]">/month</span></div>
                <p className="mt-3 text-sm text-[var(--muted)]">10 clients · 40 reports · 5,000 scrape units. Best from ~10 clients.</p>
                {canManage ? (
                  <Button className="mt-4" disabled={!!busy || !budget.stripe_configured} onClick={() => void checkout(0, "plan")}>
                    {busy === "checkout" ? "Opening Stripe…" : "Subscribe for $450/month"}
                  </Button>
                ) : null}
              </Card>
              <Card>
                <h2 className="font-semibold">Agency PAYG</h2>
                <div className="mt-1 text-2xl font-semibold">Usage
                  <span className="text-sm font-normal text-[var(--muted)]"> · billed at month end</span>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  No $450 and no $49 plan. Save a card, then pay only for clients, intel runs, reports, and scrape units you use.
                  {budget.catalog.payg
                    ? ` ${money(budget.catalog.payg.client_cents, 2)}/client · ${money(budget.catalog.payg.intel_run_cents, 2)}/intel · ${money(budget.catalog.payg.report_cents, 2)}/report · ${money(budget.catalog.payg.scrape_unit_cents, 2)}/scrape.`
                    : ""}
                </p>
                {canManage ? (
                  <Button
                    className="mt-4"
                    disabled={!!busy || !budget.stripe_configured || !budget.catalog.payg?.checkout_ready}
                    onClick={() => void checkout(0, "payg")}
                  >
                    {busy === "checkout" ? "Opening Stripe…" : "Start PAYG (pay for usage)"}
                  </Button>
                ) : null}
              </Card>
            </div>
          ) : (
            budget.catalog.plans
              .filter((plan) => plan.id === budget.plan)
              .map((plan) => (
                <Card key={plan.id} className="mb-4 border-[var(--accent)]">
                  <h2 className="font-semibold">{plan.name}</h2>
                  <div className="mt-1 text-2xl font-semibold">{money(plan.price_cents)}<span className="text-sm font-normal text-[var(--muted)]">/month</span></div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {plan.id === "creator"
                      ? "1 brand · 10 reports · 500 scrape units · up to 10 competitors. Extra scrapes $5/100. No packs, no PAYG."
                      : `${plan.included_clients} clients · ${plan.included_reports} reports · ${plan.included_scrapes.toLocaleString()} scrape units.`}
                  </p>
                </Card>
              ))
          )}

          {(budget.has_subscription || budget.plan === "creator") && budget.billing_model !== "payg" ? (
          <>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="font-semibold">
                {`${budget.plan_name} subscription`}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                {budget.plan === "creator"
                  ? `Includes your brand, ${budget.reports_quota} reports, ${(budget.included_scrape_units || 500).toLocaleString()} scrape units, and up to ${budget.max_tracked_rivals ?? 10} tracked competitors.`
                  : `Includes ${budget.included_clients} client${budget.included_clients === 1 ? "" : "s"}, ${budget.reports_quota - budget.client_pack_count * budget.catalog.pack.extra_reports} reports, and ${(
                    budget.scrape_quota
                    - budget.client_pack_count * budget.catalog.pack.extra_scrapes
                    - (budget.extra_scrape_units || 0)
                  ).toLocaleString()} scrape units.`}
              </p>
              {!budget.has_subscription && canManage && !budget.payg_available ? (
                <Button className="mt-4" disabled={!!busy || !budget.stripe_configured} onClick={() => void checkout(0, "plan")}>
                  {busy === "checkout" ? "Opening Stripe…" : `Subscribe for ${money(budget.base_price_cents)}/month`}
                </Button>
              ) : null}
              {!budget.stripe_configured ? (
                <p className="mt-3 text-sm text-amber-700">Stripe is not configured on this environment.</p>
              ) : null}
            </Card>
            {budget.plan === "creator" ? (
            <Card>
              <h2 className="font-semibold">Extra scrape units</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                {money(budget.scrape_pack_price_cents)} per {budget.scrape_pack_units} units/month.
                No extra clients or reports (only scrape quota).
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  className="w-full sm:w-56 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-50 bg-white"
                  value={scrapeUnits}
                  disabled={!!busy || !canManage}
                  onChange={(e) => setScrapeUnits(Number(e.target.value) || 0)}
                >
                  {(budget.catalog.scrape_pack?.options || [0, 100, 200, 500, 1000, 2000, 5000])
                    .concat(budget.extra_scrape_units || 0)
                    .filter((units, idx, all) => all.indexOf(units) === idx)
                    .sort((a, b) => a - b)
                    .map((units) => (
                    <option key={units} value={units}>
                      {units === 0
                        ? "No extra units"
                        : `${units.toLocaleString()} units · ${money((units / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents)}/mo`}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => void updateScrapes()}
                  className="w-full sm:w-auto"
                  disabled={
                    !!busy
                    || !canManage
                    || !budget.stripe_configured
                    || !budget.catalog.scrape_pack?.checkout_ready
                    || scrapeUnits === (budget.extra_scrape_units || 0)
                  }
                >
                  {busy === "scrapes" || busy === "checkout"
                    ? "Working…"
                    : !budget.has_subscription && scrapeUnits
                      ? `Checkout ${money((scrapeUnits / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents)}/month extra`
                      : scrapeUnits
                        ? `Pay ${money((scrapeUnits / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents)}/month`
                        : "Remove extra units"}
                </Button>
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                Current extra: {(budget.extra_scrape_units || 0).toLocaleString()} · scrapes {budget.scrape_units_used}/
                {budget.scrape_quota}
              </p>
            </Card>
            ) : (
            <Card>
              <h2 className="font-semibold">
                Per-client add-on packs
              </h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                {`${money(budget.catalog.pack.price_cents)} per pack/month. Each adds ${budget.catalog.pack.extra_clients} client seat + ${budget.catalog.pack.extra_reports} reports + ${budget.catalog.pack.extra_scrapes} scrape units.`}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  className="w-full sm:w-24 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-50"
                  value={packs}
                  disabled={!!busy || !canManage}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setPacks(Number.isFinite(next) ? Math.max(1, Math.min(50, next)) : 1);
                  }}
                />
                <Button
                  onClick={() => void addPacks()}
                  className="w-full sm:w-auto"
                  disabled={!!busy || !canManage || !budget.stripe_configured}
                >
                  {busy === "packs" || busy === "checkout" ? "Working…" : "Add packs / Stripe checkout"}
                </Button>
              </div>
              <p className="text-xs text-[var(--muted)] mt-3">
                Current packs: {budget.client_pack_count} · meters: reports {budget.reports_used}/
                {budget.reports_quota}, scrapes {budget.scrape_units_used}/{budget.scrape_quota}
              </p>
            </Card>
            )}
          </div>
          {budget.plan !== "creator" ? (
          <Card className="mt-4">
            <h2 className="font-semibold">Extra scrape units</h2>
            <p className="text-sm text-[var(--muted)] mt-2">
              {money(budget.scrape_pack_price_cents)} per {budget.scrape_pack_units} units/month.
              No extra clients or reports (only scrape quota).
            </p>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                className="w-full sm:w-56 rounded-xl border border-[var(--line)] px-3 py-2 disabled:opacity-50 bg-white"
                value={scrapeUnits}
                disabled={!!busy || !canManage}
                onChange={(e) => setScrapeUnits(Number(e.target.value) || 0)}
              >
                {(budget.catalog.scrape_pack?.options || [0, 100, 200, 500, 1000, 2000, 5000])
                  .concat(budget.extra_scrape_units || 0)
                  .filter((units, idx, all) => all.indexOf(units) === idx)
                  .sort((a, b) => a - b)
                  .map((units) => (
                  <option key={units} value={units}>
                    {units === 0
                      ? "No extra units"
                      : `${units.toLocaleString()} units · ${money((units / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents)}/mo`}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => void updateScrapes()}
                className="w-full sm:w-auto"
                disabled={
                  !!busy
                  || !canManage
                  || !budget.stripe_configured
                  || !budget.catalog.scrape_pack?.checkout_ready
                  || scrapeUnits === (budget.extra_scrape_units || 0)
                }
              >
                {busy === "scrapes" ? "Updating…" : scrapeUnits ? `Pay ${money((scrapeUnits / (budget.scrape_pack_units || 100)) * budget.scrape_pack_price_cents)}/month` : "Remove extra units"}
              </Button>
            </div>
            <p className="text-xs text-[var(--muted)] mt-3">
              Current extra: {(budget.extra_scrape_units || 0).toLocaleString()} · scrapes {budget.scrape_units_used}/
              {budget.scrape_quota}
            </p>
          </Card>
          ) : null}
          </>
          ) : null}
          {budget.byok_discount_percent ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              BYOK {budget.byok_discount_percent}% applied: {money(budget.list_price_cents || budget.estimated_monthly_cents, 2)} →{" "}
              <span className="font-medium text-[var(--ink)]">{money(budget.estimated_monthly_cents, 2)}</span>
              {budget.has_subscription ? " on this period’s bill." : "."}
            </p>
          ) : null}
        </>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">Could not load billing details. Refresh and try again.</p>
          <Button className="mt-3" disabled={!!busy} onClick={() => {
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
    <>
      <Suspense fallback={<div className="text-[var(--muted)]">Loading billing…</div>}>
        <BillingInner />
      </Suspense>
    </>
  );
}
