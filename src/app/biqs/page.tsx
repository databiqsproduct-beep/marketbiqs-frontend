"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

type BiqsStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

type BiqsTicket = {
  id: string;
  feature_id?: string | null;
  source_ticket_id?: string | null;
  heading: string;
  body: string;
  acceptance_criteria: string[];
  priority: string;
  ticket_type: string;
  labels: string[];
  estimated_effort: string;
  story_points?: number | null;
  why_useful: string;
  competitor_context: string;
  status: BiqsStatus;
  board_order: number;
};

const COLUMNS: { id: BiqsStatus; label: string; hint: string; tint: string }[] = [
  { id: "backlog", label: "Backlog", hint: "Ideas waiting", tint: "bg-[#f7f2e8]" },
  { id: "todo", label: "To do", hint: "Ready to start", tint: "bg-[#f3f6f1]" },
  { id: "in_progress", label: "In progress", hint: "Being built", tint: "bg-[var(--accent-soft)]" },
  { id: "in_review", label: "In review", hint: "Needs a look", tint: "bg-[#eef4f8]" },
  { id: "done", label: "Done", hint: "Shipped", tint: "bg-[#e8f3ea]" },
];

const PRIORITY_STYLES: Record<string, string> = {
  highest: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-800 border-orange-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-emerald-50 text-emerald-800 border-emerald-200",
  lowest: "bg-slate-50 text-slate-600 border-slate-200",
};

function PriorityTag({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[(priority || "").toLowerCase()] || PRIORITY_STYLES.medium;
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${style}`}>
      {priority || "medium"}
    </span>
  );
}

export default function BiqsPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState("");
  const [tickets, setTickets] = useState<BiqsTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BiqsStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ id: string; name: string }[]>("/api/clients")
      .then((data) => {
        setClients(data);
        const fromQuery = new URLSearchParams(window.location.search).get("client");
        if (fromQuery && data.some((c) => c.id === fromQuery)) setClientId(fromQuery);
        else if (data[0]) setClientId(data[0].id);
        else setClientId("");
      })
      .catch((err) => setError(errMsg(err, "Failed to load clients")));
  }, []);

  useEffect(() => {
    if (!clientId) {
      setTickets([]);
      return;
    }
    setLoading(true);
    setError("");
    api<BiqsTicket[]>(`/api/clients/${clientId}/biqs-tickets`)
      .then(setTickets)
      .catch((err) => setError(errMsg(err, "Failed to load Biqs board")))
      .finally(() => setLoading(false));
  }, [clientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clients, clientId],
  );

  const byStatus = useMemo(() => {
    const grouped: Record<BiqsStatus, BiqsTicket[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const ticket of tickets) {
      (grouped[ticket.status] || grouped.backlog).push(ticket);
    }
    for (const key of Object.keys(grouped) as BiqsStatus[]) {
      grouped[key].sort((a, b) => a.board_order - b.board_order);
    }
    return grouped;
  }, [tickets]);

  const doneCount = byStatus.done.length;
  const activeCount = tickets.length - doneCount;

  async function moveTicket(ticketId: string, status: BiqsStatus) {
    if (!clientId) return;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === status) return;

    const previous = tickets;
    const boardOrder = byStatus[status].length;
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status, board_order: boardOrder } : t)));
    setError("");
    try {
      await api(`/api/clients/${clientId}/biqs-tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, board_order: boardOrder }),
      });
    } catch (err) {
      setTickets(previous);
      setError(err instanceof Error ? err.message : "Could not move ticket");
    }
  }

  function onDrop(status: BiqsStatus) {
    setOverColumn(null);
    const id = dragId;
    setDragId(null);
    if (id) void moveTicket(id, status);
  }

  function onClientChange(id: string) {
    setClientId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("client", id);
    else url.searchParams.delete("client");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <AppShell>
      <PageHeader
        title="Biqs board"
        subtitle="Wishlist plans land here instead of Jira. Pick a client, then drag tickets across the workflow."
        actions={
          clients.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {clientId ? (
                <Link href={`/clients/${clientId}?tab=wishlist`}>
                  <Button variant="ghost">Open wishlist</Button>
                </Link>
              ) : null}
              {clientId ? (
                <Link href={`/clients/${clientId}`}>
                  <Button variant="ghost">Client page</Button>
                </Link>
              ) : null}
            </div>
          ) : null
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!clients.length ? (
        <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
          <div className="border-b border-[var(--line)] bg-gradient-to-br from-[var(--accent-soft)]/70 to-transparent px-6 py-8 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Get started
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Add a brand first
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
              Biqs tracks development work per client. Once a brand exists, push wishlist tickets here and
              move them from backlog to done.
            </p>
            <Link href="/clients" className="mt-5 inline-flex">
              <Button>Go to clients</Button>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Workspace bar */}
          <section className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                  Working on
                </label>
                <select
                  className="w-full max-w-md rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  value={clientId}
                  onChange={(e) => onClientChange(e.target.value)}
                  disabled={loading}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {tickets.length > 0 ? (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">On board</div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--ink)]">
                      {tickets.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Active</div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--accent)]">
                      {activeCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Done</div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--ink)]">
                      {doneCount}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-5 py-10">
              <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                Loading {selectedClient?.name || "board"}…
              </div>
              <div className="mt-6 flex gap-3 overflow-hidden">
                {COLUMNS.map((c) => (
                  <div
                    key={c.id}
                    className="h-40 w-[17rem] shrink-0 animate-pulse rounded-2xl bg-black/[0.04]"
                  />
                ))}
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="px-6 py-8 sm:px-8 sm:py-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    Empty board
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--ink)]">
                    No tickets for {selectedClient?.name || "this client"} yet
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                    Build a development plan from wishlist features, then send those tickets here. Drag them
                    across columns as work moves.
                  </p>
                  <ol className="mt-6 space-y-3">
                    {[
                      "Open the client wishlist",
                      "Build a development plan for a feature",
                      "Click “Add tickets to Biqs”",
                    ].map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm text-[var(--ink)]">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {clientId ? (
                      <Link href={`/clients/${clientId}?tab=wishlist`}>
                        <Button>Open wishlist</Button>
                      </Link>
                    ) : null}
                    {clientId ? (
                      <Link href={`/clients/${clientId}`}>
                        <Button variant="ghost">View client</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="relative border-t border-[var(--line)] bg-gradient-to-br from-[var(--accent-soft)]/50 via-transparent to-[#e8f0ec] px-6 py-8 sm:px-8 lg:border-l lg:border-t-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    How it feels once filled
                  </p>
                  <div className="mt-4 flex gap-2 overflow-hidden opacity-80">
                    {COLUMNS.slice(0, 3).map((col) => (
                      <div
                        key={col.id}
                        className={`w-[7.5rem] shrink-0 rounded-xl border border-[var(--line)] ${col.tint} p-2`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                          {col.label}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          <div className="h-10 rounded-lg border border-[var(--line)] bg-white/80" />
                          <div className="h-8 rounded-lg border border-dashed border-[var(--line)] bg-white/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
                    Desktop: drag cards between columns. Mobile: use the quick-move buttons on each card.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
              <div className="flex min-w-max gap-3">
                {COLUMNS.map((column) => {
                  const count = byStatus[column.id].length;
                  const isOver = overColumn === column.id;
                  return (
                    <div
                      key={column.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setOverColumn(column.id);
                      }}
                      onDragLeave={() => setOverColumn((c) => (c === column.id ? null : c))}
                      onDrop={() => onDrop(column.id)}
                      className={`flex min-h-[22rem] w-[17.5rem] shrink-0 flex-col rounded-2xl border p-3 transition duration-150 ${
                        isOver
                          ? "scale-[1.01] border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_12px_40px_rgba(15,118,110,0.12)]"
                          : `border-[var(--line)] ${column.tint}`
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2 px-1">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                            {column.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[var(--muted)]">{column.hint}</div>
                        </div>
                        <span className="rounded-lg bg-white/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--muted)] ring-1 ring-[var(--line)]">
                          {count}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-2">
                        {byStatus[column.id].map((ticket) => (
                          <article
                            key={ticket.id}
                            draggable
                            onDragStart={() => setDragId(ticket.id)}
                            onDragEnd={() => setDragId(null)}
                            className={`group cursor-grab rounded-xl border border-[var(--line)] bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-[var(--accent)]/40 hover:shadow-sm active:cursor-grabbing ${
                              dragId === ticket.id ? "opacity-45 ring-2 ring-[var(--accent)]" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                                {ticket.ticket_type}
                                {ticket.estimated_effort ? ` · ${ticket.estimated_effort}` : ""}
                              </div>
                              <span
                                className="text-[10px] text-[var(--muted)] opacity-0 transition group-hover:opacity-100"
                                aria-hidden
                              >
                                drag
                              </span>
                            </div>
                            <h3 className="mt-1 text-sm font-medium leading-snug break-words text-[var(--ink)]">
                              {ticket.heading}
                            </h3>
                            {ticket.why_useful ? (
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                                {ticket.why_useful}
                              </p>
                            ) : null}
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              <PriorityTag priority={ticket.priority} />
                              {ticket.story_points != null ? (
                                <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--muted)]">
                                  {ticket.story_points} pts
                                </span>
                              ) : null}
                              {(ticket.labels || []).slice(0, 2).map((label) => (
                                <span
                                  key={label}
                                  className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
                              {COLUMNS.filter((c) => c.id !== ticket.status).map((c) => (
                                <Button
                                  key={c.id}
                                  variant="ghost"
                                  className="!px-2 !py-1 !text-[11px]"
                                  onClick={() => moveTicket(ticket.id, c.id)}
                                >
                                  → {c.label}
                                </Button>
                              ))}
                            </div>
                          </article>
                        ))}
                        {count === 0 ? (
                          <div
                            className={`flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-10 text-center text-xs transition ${
                              isOver
                                ? "border-[var(--accent)] bg-white/70 text-[var(--accent)]"
                                : "border-[var(--line)] text-[var(--muted)]"
                            }`}
                          >
                            {isOver ? "Drop to move here" : "Drop tickets here"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 hidden text-xs text-[var(--muted)] sm:block">
                Tip: drag a card onto another column to update status. Changes save instantly.
              </p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
