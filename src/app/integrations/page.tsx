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
      setMessage(
        status?.connected
          ? "Jira connection updated for your agency."
          : "Jira connected for your agency. Each client ticket uses your credentials.",
      );
      setForm((f) => ({ ...f, base_url, email, project_key, api_token: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy("");
    }
  }

  async function onDisconnect() {
    if (!window.confirm("Disconnect Jira for this agency? Existing pushed tickets stay in Jira.")) return;
    setError("");
    setMessage("");
    setBusy("disconnect");
    try {
      await api("/api/integrations/jira/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setForm(emptyForm);
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
        subtitle="Connect your own Jira. Biqs never uses a shared platform Jira key — agencies bring their own."
      />
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {message ? <p className="text-[var(--accent)] mb-4">{message}</p> : null}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold mb-2">Jira status</h2>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Checking connection…</p>
          ) : status?.connected ? (
            <div className="space-y-3">
              <div className="text-sm text-[var(--muted)] space-y-1">
                <div className="font-medium text-[var(--accent)]">Connected</div>
                <div>Site: {status.base_url || "—"}</div>
                <div>Project: {status.project_key || "—"}</div>
                <div>Email: {status.email || "—"}</div>
              </div>
              <Button variant="ghost" disabled={!!busy} onClick={() => void onDisconnect()}>
                {busy === "disconnect" ? "Disconnecting…" : "Disconnect Jira"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Not connected yet.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold mb-4">{status?.connected ? "Update Jira connection" : "Connect your Jira"}</h2>
          <form onSubmit={onConnect} className="space-y-3">
            <div>
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
                placeholder={status?.connected ? "Paste a new token to update" : undefined}
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
            <div>
              <Label>Epic name field (optional)</Label>
              <Input
                placeholder="customfield_10011"
                value={form.epic_name_field}
                onChange={(e) => setForm({ ...form, epic_name_field: e.target.value })}
                disabled={!!busy}
              />
            </div>
            <Button type="submit" disabled={!!busy}>
              {busy === "connect"
                ? "Saving…"
                : status?.connected
                  ? "Update Jira connection"
                  : "Save Jira connection"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
