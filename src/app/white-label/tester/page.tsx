"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";

type ClientRow = {
  id: string;
  name: string;
  industry?: string | null;
  niche?: string | null;
  website?: string | null;
};

async function wlFetch(path: string, apiKey: string, method: "GET" | "POST" = "GET") {
  const res = await fetch(path, {
    method,
    headers: {
      "X-API-Key": apiKey,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
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

export default function WhiteLabelTesterPage() {
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [data, setData] = useState<unknown>(null);

  const keyReady = apiKey.trim().length > 8;
  const selectedName = useMemo(
    () => clients.find((c) => c.id === clientId)?.name,
    [clients, clientId],
  );

  async function run(label: string, path: string, method: "GET" | "POST" = "GET") {
    setError("");
    setBusy(true);
    setEndpoint(`${method} ${path}`);
    setData(null);
    try {
      const body = await wlFetch(path, apiKey.trim(), method);
      setData(body);
      if (label === "clients" && Array.isArray(body)) {
        setClients(body as ClientRow[]);
        if (!clientId && body.length) {
          setClientId((body as ClientRow[])[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <PageHeader
          title="White-label API tester"
          subtitle="Paste your embed API key and see what data it returns — no MarketBiqs login required for these calls."
          actions={
            <Link href="/white-label" className="text-sm text-[var(--accent)] underline-offset-2 hover:underline">
              Create / manage keys
            </Link>
          }
        />

        <Card className="space-y-4">
          <div>
            <Label>White-label API key</Label>
            <Input
              type="password"
              autoComplete="off"
              placeholder="mb_… (from White-Label API → Generate)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!keyReady || busy}
              onClick={() => run("clients", "/api/v1/clients")}
            >
              1. Load my clients
            </Button>
          </div>

          {clients.length > 0 ? (
            <div>
              <Label>Client</Label>
              <select
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.industry ? ` · ${c.industry}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted)]">
                ID: <code className="break-all">{clientId}</code>
                {selectedName ? ` · ${selectedName}` : ""}
              </p>
            </div>
          ) : (
            <div>
              <Label>Or paste client ID</Label>
              <Input
                placeholder="uuid from Clients page URL"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={!keyReady || !clientId || busy}
              onClick={() => run("snapshot", `/api/v1/intelligence/${clientId}/snapshot`)}
            >
              Snapshot (rivals + features)
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!keyReady || !clientId || busy}
              onClick={() => run("trends", `/api/v1/intelligence/${clientId}/trends`)}
            >
              Trends
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!keyReady || !clientId || busy}
              onClick={() => run("report", `/api/v1/intelligence/${clientId}/report`, "POST")}
            >
              Generate report
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!keyReady || !clientId || busy}
              onClick={() => run("run", `/api/v1/intelligence/${clientId}/run`, "POST")}
            >
              Run intelligence
            </Button>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Header used: <code>X-API-Key</code>. Snapshot is read-only (fast). Report / Run call AI and use
            quota.
          </p>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50 text-red-800">
            <p className="text-sm font-medium">Error</p>
            <p className="mt-1 text-sm break-words">{error}</p>
          </Card>
        ) : null}

        {endpoint || data !== null ? (
          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Response</h2>
              {endpoint ? <code className="text-xs text-[var(--muted)]">{endpoint}</code> : null}
            </div>
            {busy ? (
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            ) : (
              <pre className="max-h-[28rem] overflow-auto rounded-xl bg-[var(--bg)] p-3 text-xs leading-relaxed">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
