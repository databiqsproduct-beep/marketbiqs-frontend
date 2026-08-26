"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, HelpCircle, LifeBuoy, X } from "lucide-react";
import { Button } from "@/components/ui";
import { api, streamHelpdeskChat } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isIndividualWorkspace } from "@/lib/workspace";

const AGENCY_GUIDE_STEPS = [
  {
    title: "1. Add your clients",
    body: "Go to Clients and create each brand you manage. We’ll start tracking rivals automatically.",
    href: "/clients",
  },
  {
    title: "2. Check competitors",
    body: "Open Clients and click Check competitors on a brand. You’ll get competitors, missing features, warnings, and a report.",
    href: "/clients",
  },
  {
    title: "3. Review this overview",
    body: "Start with red Health rows, use Next action, then open the brand to dig in.",
    href: "/dashboard",
  },
  {
    title: "4. Share with your client",
    body: "Download a white-label PDF from Reports, or open the Client GPT portal for a branded chat.",
    href: "/reports",
  },
  {
    title: "5. Deliver updates",
    body: "Set email or WhatsApp delivery and send scheduled or one-off updates from Delivery.",
    href: "/delivery",
  },
];

const INDIVIDUAL_GUIDE_STEPS = [
  {
    title: "1. Set up your brand",
    body: "Open Competitors to confirm your brand details, then add the rivals you want to track.",
    href: "/clients",
  },
  {
    title: "2. Run a competitor check",
    body: "Use Check competitors to pull rivals, missing features, warnings, and a report for your brand.",
    href: "/clients",
  },
  {
    title: "3. Review reports",
    body: "Open Reports to download or revisit the latest competitive summaries.",
    href: "/reports",
  },
  {
    title: "4. Deliver updates",
    body: "Set email or WhatsApp delivery and send scheduled or one-off updates from Delivery.",
    href: "/delivery",
  },
];

export function WorkspaceHelp() {
  const { agency } = useAuth();
  const individual = isIndividualWorkspace(agency);
  const guideSteps = useMemo(
    () => (individual ? INDIVIDUAL_GUIDE_STEPS : AGENCY_GUIDE_STEPS),
    [individual],
  );

  const [guideOpen, setGuideOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [quickOptions, setQuickOptions] = useState<{ label: string; ask: string }[]>([]);
  const [thread, setThread] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: individual
        ? "Hi — ask how to use MarketBiqs, fix a problem, or ask about your competitors."
        : "Hi — ask how to use MarketBiqs, fix a problem, or ask about a client’s competitors. Pick a client below for rival/intel answers.",
    },
  ]);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guideOpen && !supportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGuideOpen(false);
        setSupportOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guideOpen, supportOpen]);

  useEffect(() => {
    if (!supportOpen) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportOpen, thread, busy]);

  useEffect(() => {
    if (!supportOpen) return;
    api<{ id: string; name: string }[]>("/api/clients")
      .then((data) => setClients(data || []))
      .catch(() => setClients([]));
    api<{ faqs: { question: string }[]; common_issues: { symptom: string }[] }>("/api/helpdesk/knowledge")
      .then((data) => {
        const faqs = (data.faqs || []).slice(0, 4).map((f) => ({
          label: f.question,
          ask: f.question,
        }));
        const issues = (data.common_issues || []).slice(0, 3).map((i) => ({
          label: `Fix: ${i.symptom}`,
          ask: `I'm hitting this issue: ${i.symptom}. How do I fix it?`,
        }));
        setQuickOptions([...faqs, ...issues]);
      })
      .catch(() => setQuickOptions([]));
  }, [supportOpen]);

  function openSupport() {
    setGuideOpen(false);
    setSupportOpen((v) => !v);
    setError("");
  }

  async function askHelpDesk(text: string) {
    const cleaned = text.trim();
    if (!cleaned || busy) return;
    setError("");
    setMessage("");
    setBusy(true);
    const history = thread
      .filter((m) => m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));
    setThread((prev) => [...prev, { role: "user", content: cleaned }, { role: "assistant", content: "" }]);
    try {
      await streamHelpdeskChat(cleaned, {
        clientId: clientId || undefined,
        history,
        onDelta: (delta) => {
          setThread((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: last.content + delta };
            }
            return next;
          });
        },
        onDone: (msg) => {
          setThread((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: msg.content || last.content };
            }
            return next;
          });
        },
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Help desk failed";
      setError(detail);
      setThread((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content.trim()) {
          next[next.length - 1] = { role: "assistant", content: `Sorry — ${detail}` };
        }
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  async function submitHelp(e: FormEvent) {
    e.preventDefault();
    await askHelpDesk(message);
  }

  const quickStartAsk = individual
    ? "How do I add competitors and run intel for my brand?"
    : "How do I add my first client and run intel?";

  return (
    <>
      <div className="fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-2 safe-bottom sm:bottom-6 sm:right-6">
        {supportOpen ? (
          <div className="mb-1 flex max-h-[min(34rem,calc(100vh-6rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_16px_48px_rgba(20,35,31,0.18)]">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--accent-soft)]/60 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <LifeBuoy size={18} />
                  <h3 className="font-semibold text-[var(--ink)]">Help desk</h3>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {individual ? "Product help · competitors & reports" : "Product help · clients & competitors"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close support"
                onClick={() => setSupportOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {thread.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "ml-6 bg-[var(--accent-soft)]/70 text-[var(--ink)]"
                        : "mr-2 bg-black/[0.03] text-[var(--ink)]"
                    }`}
                  >
                    {m.content || (busy && i === thread.length - 1 ? "…" : "")}
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              {error ? <p className="text-xs text-red-600">{error}</p> : null}
            </div>

            <div className="shrink-0 space-y-2 border-t border-[var(--line)] px-4 py-3">
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={busy}
                aria-label={individual ? "Brand for competitor questions" : "Client for competitor questions"}
              >
                <option value="">
                  {individual ? "Your brand (or name rivals in chat)" : "All clients (or name one in chat)"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {quickOptions.length ? (
                <select
                  className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--muted)]"
                  defaultValue=""
                  disabled={busy}
                  aria-label="Quick ask"
                  onChange={(e) => {
                    const ask = e.target.value;
                    e.target.value = "";
                    if (ask) void askHelpDesk(ask);
                  }}
                >
                  <option value="" disabled>
                    Quick ask…
                  </option>
                  {quickOptions.map((opt) => (
                    <option key={opt.ask} value={opt.ask}>
                      {opt.label.length > 64 ? `${opt.label.slice(0, 61)}…` : opt.label}
                    </option>
                  ))}
                </select>
              ) : null}

              <form onSubmit={(e) => void submitHelp(e)} className="space-y-2">
                <textarea
                  className="min-h-[64px] w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  placeholder="Ask a FAQ, issue, or “who are rivals for …?”"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={busy}
                />
                <Button type="submit" className="w-full" disabled={busy || !message.trim()}>
                  {busy ? "Thinking…" : "Ask help desk"}
                </Button>
              </form>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 !py-2 text-xs"
                  onClick={() => {
                    setSupportOpen(false);
                    setGuideOpen(true);
                  }}
                >
                  App Guide
                </Button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void askHelpDesk(quickStartAsk)}
                >
                  Quick start
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSupportOpen(false);
              setGuideOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2.5 text-sm font-medium shadow-sm hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <BookOpen size={16} className="text-[var(--accent)]" />
            App Guide
          </button>
          <button
            type="button"
            aria-label="Open help desk"
            onClick={openSupport}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_10px_28px_rgba(15,118,110,0.35)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      {guideOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(20,35,31,0.4)] backdrop-blur-[1px]"
            aria-label="Close guide"
            onClick={() => setGuideOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(24rem,100vw)] flex-col bg-[var(--panel)] shadow-[-12px_0_40px_rgba(20,35,31,0.16)]">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Quick tour</p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">App Guide</h2>
              </div>
              <button
                type="button"
                aria-label="Close App Guide"
                onClick={() => setGuideOpen(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {guideSteps.map((step) => (
                <div key={step.title} className="rounded-xl border border-[var(--line)] p-4">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--muted)]">{step.body}</p>
                  <Link
                    href={step.href}
                    onClick={() => setGuideOpen(false)}
                    className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    Go there →
                  </Link>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
