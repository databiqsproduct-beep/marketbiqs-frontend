"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { api, downloadReportPdf } from "@/lib/api";

export type ReportSection = {
  heading?: string;
  bullets?: string[];
};

export type ReportLike = {
  id: string;
  title?: string | null;
  summary?: string | null;
  created_at?: string | null;
  sections?: ReportSection[] | null;
  client_id?: string;
  client_name?: string;
};

function formatReportDate(raw?: string | null) {
  if (!raw) return "Date unknown";
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return "Date unknown";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReportCard({
  report,
  showClientLink = false,
  defaultExpanded = false,
  onError,
  onDeleted,
}: {
  report: ReportLike;
  showClientLink?: boolean;
  defaultExpanded?: boolean;
  onError?: (message: string) => void;
  onDeleted?: (reportId: string) => void;
}) {
  const sections = Array.isArray(report.sections) ? report.sections : [];
  const hasSections = sections.length > 0;
  const [expanded, setExpanded] = useState(defaultExpanded || !hasSections);
  const [busy, setBusy] = useState<"pdf" | "delete" | "">("");
  const title = report.title || "Untitled report";

  async function onDownload() {
    setBusy("pdf");
    try {
      await downloadReportPdf(report.id, `${title}.pdf`);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not download PDF");
    } finally {
      setBusy("");
    }
  }

  async function onDelete() {
    const ok = window.confirm(`Delete “${title}”? This cannot be undone.`);
    if (!ok) return;
    setBusy("delete");
    try {
      await api(`/api/reports/${report.id}`, { method: "DELETE" });
      onDeleted?.(report.id);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not delete report");
    } finally {
      setBusy("");
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {report.client_name ? (
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{report.client_name}</div>
          ) : null}
          <h2 className="mt-0.5 font-semibold text-[var(--ink)] break-words">{title}</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">{formatReportDate(report.created_at)}</p>
          {report.summary ? (
            <p className={`mt-2 text-sm leading-relaxed text-[var(--ink)] ${expanded ? "" : "line-clamp-3"}`}>
              {report.summary}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
          {showClientLink && report.client_id ? (
            <Link href={`/clients/${report.client_id}?tab=reports`} className="flex-1 sm:flex-none">
              <Button variant="ghost" className="w-full sm:w-auto">
                Open client
              </Button>
            </Link>
          ) : null}
          <Button
            variant="ghost"
            className="flex-1 sm:flex-none"
            disabled={!!busy}
            onClick={() => void onDownload()}
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText size={14} />
              {busy === "pdf" ? "Downloading…" : "Download PDF"}
            </span>
          </Button>
          {hasSections ? (
            <Button
              variant={expanded ? "ghost" : "primary"}
              className="flex-1 sm:flex-none"
              disabled={!!busy}
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span className="inline-flex items-center gap-1.5">
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "Hide full report" : "Read full report"}
              </span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="flex-1 sm:flex-none !border-red-200 !text-red-700 hover:!bg-red-50"
            disabled={!!busy}
            onClick={() => void onDelete()}
          >
            <span className="inline-flex items-center gap-1.5">
              <Trash2 size={14} />
              {busy === "delete" ? "Deleting…" : "Delete"}
            </span>
          </Button>
        </div>
      </div>

      {expanded && hasSections ? (
        <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
          {sections.map((section, idx) => {
            const bullets = Array.isArray(section.bullets) ? section.bullets : [];
            return (
              <div
                key={`${report.id}-sec-${idx}`}
                className="rounded-xl border border-[var(--line)] bg-white/60 px-3 py-2.5 sm:px-4"
              >
                <div className="text-sm font-medium text-[var(--ink)]">
                  {section.heading || `Section ${idx + 1}`}
                </div>
                {bullets.length ? (
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-relaxed text-[var(--muted)]">
                    {bullets.map((b, bi) => (
                      <li key={`${report.id}-${idx}-${bi}`}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-sm text-[var(--muted)]">No details in this section.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!expanded && hasSections ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          {sections.length} section{sections.length === 1 ? "" : "s"} · open to read the full write-up, or download the PDF
        </p>
      ) : null}
    </Card>
  );
}

export function ReportsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading reports">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="h-28 bg-black/[0.03]">
          {"\u00a0"}
        </Card>
      ))}
    </div>
  );
}
