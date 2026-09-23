"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Radar, Search, Sparkles, Trash2 } from "lucide-react";
import { IntelProgressOverlay, IntelRunPhase, useIntelProgress } from "@/components/IntelProgress";
import { IntelSetupDialog, IntelSetupOptions } from "@/components/IntelSetupDialog";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { ApiRequestError, api, detectClientNiche, runClientIntel } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useConfirm } from "@/components/ConfirmDialog";
import { individualBrandHref, isIndividualWorkspace, pickIndividualBrand } from "@/lib/workspace";
import { getIndustries, getNichesForIndustry } from "@/lib/taxonomy";

type Client = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  niche?: string | null;
  notes?: string | null;
  is_active: boolean;
  delivery_channel: string;
  rivals_count?: number;
  features_count?: number;
  reports_count?: number;
  tickets_count?: number;
  alerts_open?: number;
};

type StatusFilter = "active" | "archived" | "all";

export default function ClientsPage() {
  const router = useRouter();
  const { agency } = useAuth();
  const confirm = useConfirm();
  const individual = isIndividualWorkspace(agency);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    niche: "",
    website: "",
    primary_offering: "",
    delivery_emails: "",
  });
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelPhase, setIntelPhase] = useState<IntelRunPhase>("running");
  const [intelName, setIntelName] = useState("");
  const [intelClientId, setIntelClientId] = useState("");
  const [intelSuccess, setIntelSuccess] = useState("");
  const [intelError, setIntelError] = useState("");
  const intelProgress = useIntelProgress(intelOpen && intelPhase === "running");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupClient, setSetupClient] = useState<Client | null>(null);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [detectingNiche, setDetectingNiche] = useState(false);
  const [detectedNicheMeta, setDetectedNicheMeta] = useState<{
    confidence: number;
    evidence: string;
    alternatives: string[];
  } | null>(null);
  const [nicheDetectError, setNicheDetectError] = useState("");

  async function handleAutoDetectNiche() {
    if (!form.name.trim()) return;
    setDetectingNiche(true);
    setNicheDetectError("");
    try {
      const res = await detectClientNiche({
        name: form.name,
        website: form.website || null,
        primary_offering: form.primary_offering || null,
      });
      setForm((prev) => ({
        ...prev,
        niche: res.niche || prev.niche,
        industry:
          (!prev.industry || prev.industry.toLowerCase() === "other") && res.industry
            ? res.industry
            : prev.industry,
        primary_offering:
          !prev.primary_offering && res.primary_offering
            ? res.primary_offering
            : prev.primary_offering,
      }));
      setDetectedNicheMeta({
        confidence: res.confidence,
        evidence: res.evidence,
        alternatives: res.suggested_alternatives || [],
      });
    } catch (err) {
      setNicheDetectError(err instanceof Error ? err.message : "Niche detection failed");
    } finally {
      setDetectingNiche(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await api<Client[]>("/api/clients?include_inactive=true");
      setClients(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!individual || loading || open || pendingCreate) return;
    const brand = pickIndividualBrand(clients);
    if (brand) router.replace(individualBrandHref(brand.id));
  }, [individual, loading, open, pendingCreate, clients, router]);

  const filtered = useMemo(() => {
    let rows = clients;
    if (statusFilter === "active") rows = rows.filter((c) => c.is_active);
    if (statusFilter === "archived") rows = rows.filter((c) => !c.is_active);
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.industry || "").toLowerCase().includes(q) ||
          (c.website || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [clients, statusFilter, query]);

  const activeCount = clients.filter((c) => c.is_active).length;
  const archivedCount = clients.filter((c) => !c.is_active).length;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPendingCreate(true);
    setSetupClient({
      id: "",
      name: form.name,
      industry: form.industry || null,
      niche: form.niche || null,
      website: form.website || null,
      is_active: true,
      delivery_channel: "email",
      rivals_count: 0,
    });
    setSetupOpen(true);
  }

  async function startIntelForClient(client: Client, options: IntelSetupOptions) {
    setSetupOpen(false);
    setBusyId(client.id);
    setIntelName(client.name);
    setIntelClientId(client.id);
    setError("");
    setMessage("");
    setIntelSuccess("");
    setIntelError("");
    setIntelPhase("running");
    setIntelOpen(true);
    try {
      const job = await runClientIntel(client.id, options);
      const pack = job.result_meta?.pack;
      const enrich = job.result_meta?.enrich;
      const summary = `Intel complete for ${client.name} · features ${enrich?.features || 0} · rivals ${pack?.competitors || 0}`;
      setMessage(summary);
      setIntelSuccess(summary);
      setIntelPhase("success");
      await load();
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Intel run failed";
      setError(detail);
      setIntelError(detail);
      setIntelPhase("error");
    } finally {
      setBusyId("");
    }
  }

  async function onConfirmSetup(options: IntelSetupOptions) {
    if (pendingCreate) {
      setSetupOpen(false);
      setPendingCreate(false);
      setBusy(true);
      try {
        const created = await api<Client>("/api/clients", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            industry: options.industry || form.industry || null,
            niche: options.niche || form.niche || null,
            website: form.website || null,
            primary_offering: form.primary_offering || options.primary_offering || null,
            customer_type: options.customer_type || null,
            country: options.competitor_country || null,
            city: options.competitor_city || null,
            delivery_emails: form.delivery_emails
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        });
        setIntelName(created.name);
        setIntelClientId(created.id);
        setIntelSuccess("");
        setIntelError("");
        setIntelPhase("running");
        setIntelOpen(true);
        const job = await runClientIntel(created.id, options);
        const pack = job.result_meta?.pack;
        const enrich = job.result_meta?.enrich;
        const summary = `“${created.name}” ready · ${enrich?.features || 0} features · ${pack?.competitors || 0} rivals`;
        setMessage(summary);
        setIntelSuccess(summary);
        setIntelPhase("success");
        setForm({ name: "", industry: "", niche: "", website: "", primary_offering: "", delivery_emails: "" });
        setDetectedNicheMeta(null);
        setNicheDetectError("");
        setOpen(false);
        await load();
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Failed";
        const billingBlocked = err instanceof ApiRequestError && err.status === 402;
        setError(detail);
        if (billingBlocked) {
          setIntelOpen(false);
        } else {
          setIntelError(detail);
          setIntelPhase("error");
        }
        await load().catch(() => undefined);
      } finally {
        setBusy(false);
        setSetupClient(null);
      }
      return;
    }

    if (setupClient?.id) {
      await startIntelForClient(setupClient, options);
      setSetupClient(null);
    }
  }

  function runIntel(client: Client) {
    setPendingCreate(false);
    setSetupClient(client);
    setSetupOpen(true);
  }

  async function archiveClient(clientId: string, name: string) {
    const label = name || "this client";
    const ok = await confirm({
      title: `Archive “${label}”?`,
      message: `Tracking stops and it leaves your active list. Reports stay saved.`,
      confirmText: "Archive Client",
      cancelText: "Cancel",
      variant: "warning",
    });
    if (!ok) return;
    setBusyId(`archive-${clientId}`);
    setError("");
    setMessage("");
    try {
      await api(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      });
      setMessage(`“${label}” archived`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive client");
    } finally {
      setBusyId("");
    }
  }

  async function deleteClient(clientId: string, name: string) {
    const label = name || "this client";
    const ok = await confirm({
      title: `Permanently delete “${label}”?`,
      message: `This will remove the brand, all competitors, features, and reports forever. This action cannot be undone.`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setBusyId(`delete-${clientId}`);
    setError("");
    setMessage("");
    try {
      await api(`/api/clients/${clientId}`, { method: "DELETE" });
      setMessage(`“${label}” permanently deleted`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete client");
    } finally {
      setBusyId("");
    }
  }

  async function restoreClient(clientId: string, name: string) {
    setBusyId(`restore-${clientId}`);
    setError("");
    setMessage("");
    try {
      await api(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      });
      setMessage(`“${name}” restored to active clients`);
      setStatusFilter("active");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore client");
    } finally {
      setBusyId("");
    }
  }


  const isBusy = busy || !!busyId;
  const individualBrand = pickIndividualBrand(clients);
  const individualRedirecting = individual && (loading || !!individualBrand) && !open && !pendingCreate;

  const setupClientCountry = useMemo(() => {
    if (pendingCreate) return "";
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("market:") || low.startsWith("country:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return "";
  }, [pendingCreate, setupClient?.notes]);

  const setupClientCity = useMemo(() => {
    if (pendingCreate) return "";
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("city:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return "";
  }, [pendingCreate, setupClient?.notes]);

  const setupClientOffering = useMemo(() => {
    if (pendingCreate) return form.primary_offering;
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("primary offering:") || low.startsWith("offering:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return form.primary_offering;
  }, [pendingCreate, setupClient?.notes, form.primary_offering]);

  const setupClientCustomerType = useMemo(() => {
    if (pendingCreate) return "";
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("customer type:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return "";
  }, [pendingCreate, setupClient?.notes]);

  const setupClientIndustry = useMemo(() => {
    if (pendingCreate) return form.industry;
    if (setupClient?.industry) return setupClient.industry;
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("industry:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return form.industry;
  }, [pendingCreate, setupClient?.industry, setupClient?.notes, form.industry]);

  const setupClientNiche = useMemo(() => {
    if (pendingCreate) return form.niche;
    if (setupClient?.niche) return setupClient.niche;
    for (const ln of (setupClient?.notes || "").split("\n")) {
      const low = ln.toLowerCase().trim();
      if (low.startsWith("niche:")) {
        return ln.split(":", 2)[1]?.trim() || "";
      }
    }
    return form.niche;
  }, [pendingCreate, setupClient?.niche, setupClient?.notes, form.niche]);

  const clientSuggestedNiches = useMemo(() => getNichesForIndustry(form.industry), [form.industry]);

  return (
    <>
      <IntelSetupDialog
        open={setupOpen}
        clientName={setupClient?.name || form.name}
        clientWebsite={setupClient?.website || form.website || undefined}
        defaultCountry={setupClientCountry}
        defaultCity={setupClientCity}
        defaultPrimaryOffering={setupClientOffering}
        defaultCustomerType={setupClientCustomerType}
        defaultIndustry={setupClientIndustry}
        defaultNiche={setupClientNiche}
        existingCompetitorCount={setupClient?.rivals_count ?? 0}
        busy={isBusy}
        onCancel={() => {
          setSetupOpen(false);
          setPendingCreate(false);
          setSetupClient(null);
        }}
        onConfirm={onConfirmSetup}
      />
      <IntelProgressOverlay
        open={intelOpen}
        phase={intelPhase}
        clientName={intelName}
        stepIndex={intelProgress.stepIndex}
        progress={intelProgress.progress}
        elapsedMs={intelProgress.elapsedMs}
        tipIndex={intelProgress.tipIndex}
        successMessage={intelSuccess}
        errorMessage={intelError}
        onDismiss={() => setIntelOpen(false)}
        onViewResults={() => {
          setIntelOpen(false);
          if (intelClientId) {
            router.push(`/clients/${intelClientId}`);
          }
        }}
      />
      {individualRedirecting ? (
        <p className="text-sm text-[var(--muted)]">Opening your competitors…</p>
      ) : (
        <PageHeader
          title={individual ? "Your brand" : "Clients"}
          subtitle={
            individual
              ? "Set up the brand you want to track, then we’ll take you to your competitors."
              : "Add a brand, open its workspace, or check competitors directly from here."
          }
          actions={
            individual ? null : (
              <Button onClick={() => setOpen((v) => !v)}>{open ? "Close form" : "Add client"}</Button>
            )
          }
        />
      )}
      {error ? (
        <p className="mb-4 text-red-600">
          {error}{" "}
          {/billing|client limit|payg/i.test(error) ? (
            <Link href="/billing" className="underline">
              Open Billing
            </Link>
          ) : null}
        </p>
      ) : null}
      {message ? <p className="mb-4 text-[var(--accent)]">{message}</p> : null}

      {open || (individual && !individualRedirecting) ? (
        <Card className="mb-6 w-full">
          <h2 className="mb-4 font-semibold">{individual ? "Your brand" : "New client"}</h2>
          <form onSubmit={onCreate} className="w-full space-y-4">
            <div>
              <Label>{individual ? "Brand name" : "Client name"}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Studio"
                required
              />
            </div>
            <div>
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. Food & Hospitality, Software & Technology, Healthcare"
                list="client-create-industry-suggestions"
                required
              />
              <datalist id="client-create-industry-suggestions">
                {getIndustries().map((ind) => (
                  <option key={ind} value={ind} />
                ))}
              </datalist>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Sub-Niche / Category (Optional)</Label>
                <button
                  type="button"
                  onClick={() => void handleAutoDetectNiche()}
                  disabled={detectingNiche || !form.name.trim()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 transition"
                  title={!form.name.trim() ? "Enter brand name first" : "Detect exact commercial niche using AI & web intelligence"}
                >
                  {detectingNiche ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Detecting niche…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Auto-detect niche</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                value={form.niche}
                onChange={(e) => {
                  setForm({ ...form, niche: e.target.value });
                  if (detectedNicheMeta) setDetectedNicheMeta(null);
                }}
                placeholder="e.g. Pizza & Fast Food Delivery, B2B SaaS"
              />
              {detectedNicheMeta ? (
                <div className="mt-2 flex flex-col gap-1 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-900 border border-emerald-500/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      Auto-detected ({detectedNicheMeta.confidence}% confidence)
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      High Precision
                    </span>
                  </div>
                  {detectedNicheMeta.evidence ? (
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      {detectedNicheMeta.evidence}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {nicheDetectError ? (
                <p className="mt-1 text-xs text-red-600">{nicheDetectError}</p>
              ) : null}
              {detectedNicheMeta && detectedNicheMeta.alternatives.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--muted)]">Suggested alternatives:</span>
                  {detectedNicheMeta.alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setForm({ ...form, niche: alt })}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                        form.niche.toLowerCase() === alt.toLowerCase()
                          ? "bg-[var(--accent)] text-white"
                          : "bg-black/5 text-[var(--ink)] hover:bg-black/10"
                      }`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              ) : clientSuggestedNiches.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {clientSuggestedNiches.slice(0, 5).map((sNiche) => (
                    <button
                      key={sNiche}
                      type="button"
                      onClick={() => setForm({ ...form, niche: sNiche })}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                        form.niche.toLowerCase() === sNiche.toLowerCase()
                          ? "bg-[var(--accent)] text-white"
                          : "bg-black/5 text-[var(--ink)] hover:bg-black/10"
                      }`}
                    >
                      {sNiche}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <Label>Website (Optional)</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            {!form.website.trim() ? (
              <div>
                <Label>What does this company primarily sell or do? (Required)</Label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  rows={2}
                  value={form.primary_offering}
                  onChange={(e) => setForm({ ...form, primary_offering: e.target.value })}
                  placeholder="e.g. Premium women's ready-to-wear clothing sold online and through retail outlets."
                  required
                />
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Since no website is provided, this description grounds competitor discovery in your actual offerings.
                </p>
              </div>
            ) : null}
            <div>
              <Label>Delivery emails</Label>
              <Input
                value={form.delivery_emails}
                onChange={(e) => setForm({ ...form, delivery_emails: e.target.value })}
                placeholder="client@brand.com, am@agency.com"
              />
            </div>
            <p className="text-sm text-[var(--muted)]">
              Next you’ll choose how many competitors to find and where to look before tracking begins.
            </p>
            <Button type="submit" disabled={isBusy}>
              {busy ? "Working…" : "Continue to competitor setup"}
            </Button>
          </form>
        </Card>

      ) : null}

      {individual ? null : (
      <Card className="w-full overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] px-4 py-4 sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="font-semibold">
              {filtered.length} client{filtered.length === 1 ? "" : "s"}
              {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
            </div>
            <div className="mt-0.5 text-xs text-[var(--muted)]">
              {activeCount} active · {archivedCount} archived
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients…"
                className="pl-9"
                aria-label="Search clients"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
              {(
                [
                  ["active", "Active"],
                  ["archived", "Archived"],
                  ["all", "All"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={statusFilter === id ? "primary" : "ghost"}
                  className="!px-3 !py-2 text-xs"
                  onClick={() => setStatusFilter(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {loading ? (
            <div className="space-y-3 px-5 py-5 animate-pulse" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-black/[0.04]" />
              ))}
            </div>
          ) : null}
          {!loading &&
            filtered.map((c) => (
              <div key={c.id} className="px-4 py-4 transition hover:bg-black/[0.02] sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/clients/${c.id}`}
                        className="truncate font-semibold hover:text-[var(--accent)]"
                      >
                        {c.name}
                      </Link>
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          c.is_active ? "text-[var(--accent)]" : "text-red-500"
                        }`}
                      >
                        {c.is_active ? "Active" : "Archived"}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm text-[var(--muted)]">
                      {c.industry || "Industry TBD"} · {c.website || "No website"} · delivery{" "}
                      {c.delivery_channel}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                      <span>
                        <strong className="text-[var(--ink)]">{c.rivals_count ?? 0}</strong> competitors
                      </span>
                      <span>
                        <strong className="text-[var(--ink)]">{c.features_count ?? 0}</strong> features
                      </span>
                      <span>
                        <strong className="text-[var(--ink)]">{c.alerts_open ?? 0}</strong> warnings
                      </span>
                      <span>
                        <strong className="text-[var(--ink)]">{c.reports_count ?? 0}</strong> reports
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:shrink-0">
                    <Link href={`/clients/${c.id}`} className="col-span-1">
                      <Button variant="ghost" className="w-full !px-3 !py-2 text-sm sm:w-auto">
                        Open
                      </Button>
                    </Link>
                    {c.is_active ? (
                      <>
                        <Button
                          className="col-span-1 w-full !px-3 !py-2 text-sm sm:w-auto"
                          onClick={() => runIntel(c)}
                          disabled={isBusy}
                          title="Check competitors"
                        >
                          {busyId === c.id ? (
                            "Working…"
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <Radar size={14} /> Check
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="col-span-1 w-full !px-3 !py-2 text-sm !border-amber-200 !text-amber-800 hover:!bg-amber-50 sm:w-auto"
                          disabled={isBusy}
                          onClick={() => void archiveClient(c.id, c.name)}
                          title="Archive client"
                        >
                          {busyId === `archive-${c.id}` ? "Archiving…" : "Archive"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="col-span-2 w-full !px-3 !py-2 text-sm !border-red-200 !text-red-700 hover:!bg-red-50 sm:col-span-1 sm:w-auto"
                          disabled={isBusy}
                          onClick={() => void deleteClient(c.id, c.name)}
                          title="Delete client permanently"
                        >
                          {busyId === `delete-${c.id}` ? (
                            "Deleting…"
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Trash2 size={13} /> Delete
                            </span>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="col-span-1 w-full !px-3 !py-2 text-sm sm:w-auto"
                          disabled={isBusy}
                          onClick={() => void restoreClient(c.id, c.name)}
                        >
                          {busyId === `restore-${c.id}` ? "Restoring…" : "Restore"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="col-span-1 w-full !px-3 !py-2 text-sm !border-red-200 !text-red-700 hover:!bg-red-50 sm:w-auto"
                          disabled={isBusy}
                          onClick={() => void deleteClient(c.id, c.name)}
                          title="Delete client permanently"
                        >
                          {busyId === `delete-${c.id}` ? (
                            "Deleting…"
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Trash2 size={13} /> Delete
                            </span>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {!loading && !filtered.length ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--muted)]">
              {query
                ? "No clients match your search."
                : statusFilter === "archived"
                  ? "No archived clients."
                  : "No clients yet. Add your first brand above."}
            </div>
          ) : null}
        </div>
      </Card>
      )}
    </>
  );
}
