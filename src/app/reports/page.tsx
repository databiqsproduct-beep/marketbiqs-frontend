"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReportCard, ReportsSkeleton } from "@/components/ReportCard";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type SortOrder = "newest" | "oldest";

function reportTime(r: { created_at?: string | null }) {
  if (!r.created_at) return 0;
  const t = new Date(r.created_at).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function ReportsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await api<any[]>("/api/clients");
      setClients(list);
      if (!list.length) {
        setReports([]);
        return;
      }
      const all = await Promise.all(
        list.map((c) =>
          api<any[]>(`/api/clients/${c.id}/reports`).catch(() => [] as any[]),
        ),
      );
      setReports(
        all.flat().map((r, idx) => ({
          ...r,
          client_name: list.find((c) => c.id === r.client_id)?.name || "Client",
          _k: `${r.id}-${idx}`,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let rows = reports;
    if (clientFilter !== "all") {
      rows = rows.filter((r) => r.client_id === clientFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.summary || "").toLowerCase().includes(q) ||
          (r.client_name || "").toLowerCase().includes(q),
      );
    }
    rows = [...rows].sort((a, b) => {
      const diff = reportTime(a) - reportTime(b);
      return sortOrder === "newest" ? -diff : diff;
    });
    return rows;
  }, [reports, clientFilter, sortOrder, query]);

  const selectedClientName =
    clientFilter === "all" ? null : clients.find((c) => c.id === clientFilter)?.name || null;

  return (
    <AppShell>
      <PageHeader
        title="All reports"
        subtitle="Every client’s reports in one place — read the full write-up here, open the client workspace, or download a PDF."
        actions={
          clients.length ? (
            <Link href={`/clients/${clients[0].id}?tab=reports`}>
              <Button variant="ghost">Go to a client</Button>
            </Link>
          ) : (
            <Link href="/clients">
              <Button>Add a client</Button>
            </Link>
          )
        }
      />
      {error ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <Button
            type="button"
            variant="ghost"
            className="!border-red-200 !bg-white !py-1.5 text-xs"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Retrying…" : "Retry"}
          </Button>
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <Label>Search</Label>
            <div className="relative mt-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, summary, or company…"
                className="pl-9"
                aria-label="Search reports"
              />
            </div>
          </div>
          <div>
            <Label>Company</Label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              title="Show reports for one company, or all"
            >
              <option value="all">All companies</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Sort by date</Label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              title="Newest first or oldest first"
            >
              <option value="newest">Newest → oldest</option>
              <option value="oldest">Oldest → newest</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Showing {filtered.length} report{filtered.length === 1 ? "" : "s"}
          {selectedClientName ? ` for ${selectedClientName}` : ""}
          {reports.length !== filtered.length ? ` (of ${reports.length} total)` : ""}
        </p>
      </Card>

      {loading ? (
        <ReportsSkeleton rows={4} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReportCard
              key={r._k}
              report={r}
              showClientLink
              onError={(msg) => setError(msg)}
            />
          ))}
          {reports.length === 0 ? (
            <Card className="py-8 text-center">
              <h2 className="font-semibold text-[var(--ink)]">No reports yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                {clients.length === 0
                  ? "Add a client first, then run Check competitors to generate a report."
                  : "Open a client and run Check competitors to generate a written summary you can share."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/clients">
                  <Button>{clients.length === 0 ? "Add a client" : "Go to clients"}</Button>
                </Link>
              </div>
            </Card>
          ) : null}
          {reports.length > 0 && filtered.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--muted)]">
                No reports match these filters. Try clearing search or choose “All companies”.
              </p>
              <Button
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  setQuery("");
                  setClientFilter("all");
                }}
              >
                Clear filters
              </Button>
            </Card>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
