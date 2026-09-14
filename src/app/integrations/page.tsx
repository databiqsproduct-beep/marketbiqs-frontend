"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";

type JiraStatus = {
  connected?: boolean;
  base_url?: string | null;
  project_key?: string | null;
  email?: string | null;
};

const emptyForm = {
  base_url: "",
  email: "",
  api_token: "",
  project_key: "",
  epic_name_field: "",
};

export default function IntegrationsPage() {
  const [status, setStatus] = useState<JiraStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"connect" | "disconnect" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showUpdate, setShowUpdate] = useState(false);

  const connected = Boolean(status?.connected);

  const load = useCallback(async () => {
    const res = await api<JiraStatus>("/api/integrations/jira");
    setStatus(res);
    if (res?.connected) {
      setForm((f) => ({
        ...f,
        base_url: res.base_url || f.base_url,
        email: res.email || f.email,
        project_key: res.project_key || f.project_key,
        api_token: "",
      }));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load Jira status"))
      .finally(() => setLoading(false));
  }, [load]);

  async function onConnect(e: FormEvent) {
    e.preventDefault();
    const base_url = form.base_url.trim().replace(/\/$/, "");
    const email = form.email.trim();
    const api_token = form.api_token.trim();
    const project_key = form.project_key.trim().toUpperCase();
    if (!base_url || !email || !api_token || !project_key) {
      setError("Fill Jira URL, email, API token, and project key.");
      return;
    }
    setError("");
    setMessage("");
    setBusy("connect");
    try {
      const res = await api<any>("/api/integrations/jira/connect", {
        method: "POST",
        body: JSON.stringify({
          base_url,
          email,
          api_token,
          project_key,
          epic_name_field: form.epic_name_field.trim() || null,
        }),
      });
      setStatus({
        connected: true,
        project_key: res.project_key || project_key,
        base_url,
        email,
      });
      setMessage(connected ? "Jira connection updated." : "Jira is connected. Client tickets will use this workspace.");
      setShowUpdate(false);
      setForm((f) => ({ ...f, base_url, email, project_key, api_token: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy("");
    }
  }

  async function onDisconnect() {
    if (!window.confirm("Disconnect Jira for this workspace? Tickets already in Jira stay there.")) return;
    setError("");
    setMessage("");
    setBusy("disconnect");
    try {
      await api("/api/integrations/jira/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setForm(emptyForm);
      setShowUpdate(false);
      setMessage("Jira disconnected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Integrations"
        subtitle="Connect your own Jira. Biqs never uses a shared platform key, so each workspace brings its own."
      />
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {message ? <p className="text-[var(--accent)] mb-4">{message}</p> : null}

      {loading ? (
        <Card className="w-full">
          <p className="text-sm text-[var(--muted)]">Checking Jira…</p>
        </Card>
      ) : connected && !showUpdate ? (
        <Card className="w-full">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Jira</h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                  Connected
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Site</dt>
                  <dd className="mt-0.5 break-all text-[var(--ink)]">{status?.base_url || "-"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Project</dt>
                  <dd className="mt-0.5 font-medium text-[var(--ink)]">{status?.project_key || "-"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Account</dt>
                  <dd className="mt-0.5 break-all text-[var(--ink)]">{status?.email || "-"}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" disabled={!!busy} onClick={() => setShowUpdate(true)}>
                Update credentials
              </Button>
              <Button type="button" variant="danger" disabled={!!busy} onClick={() => void onDisconnect()}>
                {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="w-full">
          <h2 className="font-semibold">{connected ? "Update Jira" : "Connect Jira"}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {connected
              ? "Paste a new API token if you need to rotate keys. Site and project can change too."
              : "We’ll send build-list tickets to this Jira project using your token, never a shared Biqs key."}
          </p>
          <form onSubmit={onConnect} className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Jira base URL</Label>
              <Input
                placeholder="https://yourorg.atlassian.net"
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                required
                disabled={!!busy}
              />
            </div>
            <div>
              <Label>Atlassian email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!busy}
              />
            </div>
            <div>
              <Label>API token</Label>
              <Input
                type="password"
                value={form.api_token}
                onChange={(e) => setForm({ ...form, api_token: e.target.value })}
                required
                disabled={!!busy}
                placeholder={connected ? "New token" : undefined}
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Project key</Label>
              <Input
                placeholder="MKT"
                value={form.project_key}
                onChange={(e) => setForm({ ...form, project_key: e.target.value })}
                required
                disabled={!!busy}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
              <Button type="submit" disabled={!!busy}>
                {busy === "connect" ? "Saving…" : connected ? "Save update" : "Connect Jira"}
              </Button>
              {connected ? (
                <Button type="button" variant="ghost" disabled={!!busy} onClick={() => setShowUpdate(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      )}
    </AppShell>
  );
}
