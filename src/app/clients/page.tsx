"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Radar, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntelProgressOverlay, IntelRunPhase, useIntelProgress } from "@/components/IntelProgress";
import { IntelSetupDialog, IntelSetupOptions } from "@/components/IntelSetupDialog";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { ApiRequestError, api, runClientIntel } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { individualBrandHref, isIndividualWorkspace, pickIndividualBrand } from "@/lib/workspace";

type Client = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  niche?: string | null;
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
    website: "",
    delivery_emails: "",
  });
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelPhase, setIntelPhase] = useState<IntelRunPhase>("running");
  const [intelName, setIntelName] = useState("");
  const [intelSuccess, setIntelSuccess] = useState("");
  const [intelError, setIntelError] = useState("");
  const intelProgress = useIntelProgress(intelOpen && intelPhase === "running");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupClient, setSetupClient] = useState<Client | null>(null);
  const [pendingCreate, setPendingCreate] = useState(false);

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
    if (!individual || loading) return;
    const brand = pickIndividualBrand(clients);
    if (brand) router.replace(individualBrandHref(brand.id));
  }, [individual, loading, clients, router]);

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
            industry: form.industry || null,
            website: form.website || null,
            delivery_emails: form.delivery_emails
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        });
        setIntelName(created.name);
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
        setForm({ name: "", industry: "", website: "", delivery_emails: "" });
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
    if (
      !window.confirm(
        `Archive “${label}”? Tracking stops and it leaves your active list. Reports stay saved.`,
      )
    ) {
      return;
    }
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

  async function deleteClient(clientId: string, name: string) {
    const label = name || "this client";
    if (
      !window.confirm(
        `Permanently delete “${label}”? This will remove the brand, all competitors, features, and reports forever. This action cannot be undone.`,
      )
    ) {
      return;
    }
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


  const isBusy = busy || !!busyId;
  const individualBrand = pickIndividualBrand(clients);
  const individualRedirecting = individual && (loading || !!individualBrand);

  return (
    <AppShell>
      <IntelSetupDialog
        open={setupOpen}
        clientName={setupClient?.name || form.name}
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
                required
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
                required
              />
            </div>
            <div>
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
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
    </AppShell>
  );
}
