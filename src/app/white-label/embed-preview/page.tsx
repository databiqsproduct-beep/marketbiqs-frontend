"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ClientRow = {
  id: string;
  name: string;
  industry?: string | null;
  niche?: string | null;
  website?: string | null;
  tagline?: string | null;
};

type Snapshot = {
  client: ClientRow;
  competitors: Array<{
    id: string;
    name: string;
    website?: string | null;
    overlap_score?: number | null;
    threat_level?: string | null;
    is_pinned?: boolean;
  }>;
  features: Array<{
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
  }>;
  trends: Array<{
    id: string;
    topic: string;
    platform?: string | null;
    summary?: string | null;
    velocity_score?: number | null;
  }>;
  reports: Array<{
    id: string;
    title: string;
    summary?: string | null;
    created_at?: string | null;
  }>;
};

async function wlFetch(path: string, apiKey: string) {
  const res = await fetch(path, {
    method: "GET",
    headers: { "X-API-Key": apiKey },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* raw */
  }
  if (!res.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : text || res.statusText;
    throw new Error(`${res.status}: ${detail}`);
  }
  return body;
}

export default function WhiteLabelEmbedPreviewPage() {
  const [apiKey, setApiKey] = useState("");
  const [portalName, setPortalName] = useState("Northstar Agency");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientId, setClientId] = useState("");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const selected = useMemo(
    () => clients.find((c) => c.id === clientId) || snap?.client,
    [clients, clientId, snap],
  );

  async function connect() {
    setError("");
    setBusy(true);
    setSnap(null);
    try {
      const list = (await wlFetch("/api/v1/clients", apiKey.trim())) as ClientRow[];
      setClients(list);
      setUnlocked(true);
      const first = list[0]?.id || "";
      setClientId(first);
      if (first) {
        const pack = (await wlFetch(
          `/api/v1/intelligence/${first}/snapshot`,
          apiKey.trim(),
        )) as Snapshot;
        setSnap(pack);
      }
    } catch (err) {
      setUnlocked(false);
      setError(err instanceof Error ? err.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  }

  async function loadClient(id: string) {
    setClientId(id);
    setError("");
    setBusy(true);
    try {
      const pack = (await wlFetch(
        `/api/v1/intelligence/${id}/snapshot`,
        apiKey.trim(),
      )) as Snapshot;
      setSnap(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load snapshot");
      setSnap(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c1222] text-[#e8eef8]">
      {/* Fake browser chrome — this is THEIR website */}
      <div className="border-b border-white/10 bg-[#080c16]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-xs text-white/50 sm:px-6">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <div className="flex-1 truncate rounded-md bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/60">
            https://{portalName.toLowerCase().replace(/\s+/g, "")}.com/client-intel
          </div>
          <Link href="/white-label" className="shrink-0 text-[11px] text-teal-300/80 hover:text-teal-200">
            ← MarketBiqs keys
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Setup strip — only for you testing */}
        <section className="mb-10 rounded-2xl border border-dashed border-teal-400/30 bg-teal-400/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/90">
            Demo setup — not shown on a real customer site
          </p>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Yeh preview dikhata hai: agar koi agency apni website pe MarketBiqs white-label key
            lagaye, unke client ko kya nazar aata hai — rivals, features, trends, reports — bina
            MarketBiqs login ke.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
                Their portal brand name
              </span>
              <input
                className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-3 py-2.5 text-sm outline-none focus:border-teal-400/50"
                value={portalName}
                onChange={(e) => setPortalName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
                White-label API key
              </span>
              <input
                type="password"
                autoComplete="off"
                placeholder="Paste key from /white-label"
                className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-3 py-2.5 text-sm outline-none focus:border-teal-400/50"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={busy || apiKey.trim().length < 8}
                onClick={connect}
                className="w-full rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-[#06201c] disabled:opacity-40 sm:w-auto"
              >
                {busy ? "Loading…" : "Power this page"}
              </button>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {/* === Simulated customer website === */}
        <header className="mb-10">
          <p className="text-sm font-medium tracking-[0.2em] text-teal-300/90 uppercase">
            {portalName}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight text-white sm:text-5xl">
            {selected?.name?.trim() || "Your client brand"}
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/60">
            {selected?.tagline ||
              selected?.niche ||
              "Live competitive picture — rivals, what they offer, and what’s moving this week."}
          </p>
          {unlocked && clients.length > 1 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => loadClient(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    c.id === clientId
                      ? "bg-teal-400 text-[#06201c]"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </header>

        {!unlocked ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-lg text-white/80">Portal locked</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              Upar white-label key paste karke <strong className="text-white/70">Power this page</strong>{" "}
              dabao — phir yahan real client data load hoga, jaise kisi company ki website pe embed
              hota.
            </p>
          </div>
        ) : busy && !snap ? (
          <p className="text-sm text-white/50">Fetching intelligence…</p>
        ) : snap ? (
          <div className="space-y-12">
            {/* Competitors */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
                Competitors watched
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Peers tracked for this brand — overlap score = how close the fight is.
              </p>
              {snap.competitors.length ? (
                <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
                  {snap.competitors.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3.5">
                      <div>
                        <span className="text-base text-white">{c.name}</span>
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 text-xs text-teal-300/80 hover:underline"
                          >
                            site
                          </a>
                        ) : null}
                      </div>
                      <div className="text-sm text-white/55">
                        {c.overlap_score != null ? (
                          <span className="text-teal-200">{Math.round(Number(c.overlap_score))}%</span>
                        ) : (
                          "—"
                        )}{" "}
                        overlap
                        {c.threat_level ? (
                          <span className="ml-2 text-white/35">· {c.threat_level}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-white/45">
                  Abhi koi tracked rival nahi — pehle MarketBiqs mein intel run karo.
                </p>
              )}
            </section>

            {/* Features */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
                What they offer
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Product / menu features pulled for this client.
              </p>
              {snap.features.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {snap.features.slice(0, 8).map((f) => (
                    <div key={f.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-medium text-white">{f.name}</div>
                      {f.category ? (
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-teal-300/70">
                          {f.category}
                        </div>
                      ) : null}
                      {f.description ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/50">
                          {f.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/45">Features abhi empty hain.</p>
              )}
            </section>

            {/* Trends */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
                What’s moving
              </h2>
              <p className="mt-1 text-sm text-white/50">Recent trend signals for this brand.</p>
              {snap.trends.length ? (
                <ul className="mt-5 space-y-4">
                  {snap.trends.slice(0, 5).map((t) => (
                    <li key={t.id} className="border-l-2 border-teal-400/40 pl-4">
                      <div className="text-sm font-medium text-white">{t.topic}</div>
                      <p className="mt-1 text-xs leading-relaxed text-white/50">{t.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-white/45">
                  Trends tab empty — radar / intel run ke baad fill hota hai.
                </p>
              )}
            </section>

            {/* Reports */}
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
                Latest brief
              </h2>
              <p className="mt-1 text-sm text-white/50">White-label report summaries for the account team.</p>
              {snap.reports.length ? (
                <div className="mt-5 space-y-4">
                  {snap.reports.slice(0, 3).map((r) => (
                    <article
                      key={r.id}
                      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5"
                    >
                      <h3 className="text-base font-medium text-white">{r.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{r.summary}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/45">
                  Koi report nahi — API se “generate report” ya app mein report banao.
                </p>
              )}
            </section>

            <footer className="border-t border-white/10 pt-6 text-center text-[11px] text-white/30">
              Powered quietly by MarketBiqs white-label API · their customers never see MarketBiqs
              branding unless you want it
            </footer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
