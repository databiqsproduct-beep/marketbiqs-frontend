"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

const providers = [
  { id: "groq", label: "Groq (LLM)" },
  { id: "apify", label: "Apify" },
  { id: "serpapi", label: "SerpAPI" },
  { id: "firecrawl", label: "Firecrawl" },
];

export default function ByokPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "remove" | "">("");
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [k, b] = await Promise.all([api<any[]>("/api/billing/byok"), api("/api/billing/budget")]);
    setKeys(Array.isArray(k) ? k : []);
    setBudget(b);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load BYOK keys"))
      .finally(() => setLoading(false));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) {
      setError("Paste an API key before saving.");
      return;
    }
    setError("");
    setMessage("");
    setBusy("save");
    try {
      await api("/api/billing/byok", {
        method: "PUT",
        body: JSON.stringify({ provider, api_key: key }),
      });
      setApiKey("");
      setMessage("API key saved. Billing price updated with BYOK discount.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy("");
    }
  }

  async function remove(p: string) {
    setError("");
    setMessage("");
    setBusy("remove");
    setRemoving(p);
    try {
      await api(`/api/billing/byok/${p}`, { method: "DELETE" });
      setMessage(`Removed ${p} key`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove key");
    } finally {
      setBusy("");
      setRemoving("");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Bring your own API keys"
        subtitle="Lower subscription cost by plugging in your own Groq, Apify, SerpAPI, or Firecrawl keys."
      />
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {message ? <p className="text-[var(--accent)] mb-4">{message}</p> : null}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold mb-4">Add / update key</h2>
          <form onSubmit={onSave} className="space-y-3">
            <div>
              <Label>Provider</Label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm disabled:opacity-50"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={!!busy}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>API key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                disabled={!!busy}
              />
            </div>
            <Button type="submit" disabled={!!busy}>
              {busy === "save" ? "Saving…" : "Save encrypted key"}
            </Button>
          </form>
          {budget ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Current BYOK discount: {budget.byok_discount_percent ?? 0}% · Est. monthly{" "}
              {budget.byok_discount_percent && (budget.list_price_cents || 0) > (budget.estimated_monthly_cents || 0)
                ? `$${(((budget.estimated_monthly_cents ?? 0) as number) / 100).toFixed(0)} (was $${(((budget.list_price_cents ?? 0) as number) / 100).toFixed(0)})`
                : `$${(((budget.estimated_monthly_cents ?? 0) as number) / 100).toFixed(0)}`}
              . Billing tab uses this discounted total.
            </p>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">Stored keys</h2>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading keys…</p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <div>
                    <div className="font-medium">{k.provider}</div>
                    <div className="text-sm text-[var(--muted)]">{k.key_hint}</div>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={!!busy}
                    onClick={() => void remove(k.provider)}
                  >
                    {removing === k.provider ? "Removing…" : "Remove"}
                  </Button>
                </div>
              ))}
              {keys.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No BYOK keys yet. Platform defaults are used.</p>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
