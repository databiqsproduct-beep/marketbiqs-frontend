"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { Button, Card, PageHeader } from "@/components/ui";
import { ChatMessage, api } from "@/lib/api";

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function AssistantPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("client");
    api<any[]>("/api/clients")
      .then((data) => {
        setClients(data);
        if (fromQuery && data.some((c) => c.id === fromQuery)) setClientId(fromQuery);
        else if (data[0]) setClientId(data[0].id);
      })
      .catch((err) => setError(errMsg(err, "Failed to load clients")));
  }, []);

  useEffect(() => {
    if (!clientId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingChat(true);
    setError("");
    setMessages([]);
    api<ChatMessage[]>(`/api/clients/${clientId}/chat`)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errMsg(err, "Failed to load chat"));
      })
      .finally(() => {
        if (!cancelled) setLoadingChat(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <>
      <PageHeader
        title="Agency AI assistant"
        subtitle="ChatGPT-style briefings with streaming answers. Pick a client and ask what’s changing."
      />
      {!clients.length ? (
        <Card className="py-8 text-center">
          <h2 className="font-semibold">No clients yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Add a client first, then come back here to ask about rivals, gaps, and reports.
          </p>
          <Link href="/clients" className="mt-4 inline-flex">
            <Button>Go to clients</Button>
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <label className="text-xs uppercase tracking-wide text-[var(--muted)]">Client workspace</label>
            <select
              className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingChat}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Card>
          {error ? <p className="mb-4 text-red-600">{error}</p> : null}
          <Card>
            {clientId ? (
              loadingChat ? (
                <p className="text-sm text-[var(--muted)]">Loading chat…</p>
              ) : (
                <ChatPanel
                  clientId={clientId}
                  messages={messages}
                  onMessagesChange={setMessages}
                  emptyHint="No messages yet. Run intelligence first for richer answers, then ask away."
                  placeholder="Ask about competitor changes, trends, or sentiment..."
                />
              )
            ) : (
              <p className="text-sm text-[var(--muted)]">Select a client to start chatting.</p>
            )}
          </Card>
        </>
      )}
    </>
  );
}
