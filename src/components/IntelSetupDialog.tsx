"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { detectClientNiche } from "@/lib/api";
import { getIndustries, getNichesForIndustry } from "@/lib/taxonomy";

export type CompetitorRunMode = "update" | "add" | "replace";

export type IntelSetupOptions = {
  competitor_scope: "global" | "local";
  competitor_country?: string;
  competitor_city?: string;
  primary_offering?: string;
  customer_type?: string;
  industry?: string;
  niche?: string;
  competitor_count: number;
  /** update = refresh existing; add = find N new and keep previous; replace = clear auto rivals and find a fresh set */
  competitor_mode: CompetitorRunMode;
  /** Opt-in: white-label report uses 1 report credit */
  generate_report: boolean;
};

type IntelSetupDialogProps = {
  open: boolean;
  clientName?: string;
  clientWebsite?: string;
  defaultCountry?: string;
  defaultCity?: string;
  defaultPrimaryOffering?: string;
  defaultCustomerType?: string;
  defaultIndustry?: string;
  defaultNiche?: string;
  existingCompetitorCount?: number;
  /** Individual stored-rival cap. Agency omits this (10 per run only). */
  maxTrackedRivals?: number | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (options: IntelSetupOptions) => void;
};

const COUNTRY_SUGGESTIONS = [
  "United States",
  "United Kingdom",
  "Pakistan",
  "India",
  "UAE",
  "Saudi Arabia",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
];

export function IntelSetupDialog({
  open,
  clientName,
  clientWebsite,
  defaultCountry = "",
  defaultCity = "",
  defaultPrimaryOffering = "",
  defaultCustomerType = "",
  defaultIndustry = "",
  defaultNiche = "",
  existingCompetitorCount = 0,
  maxTrackedRivals = null,
  busy = false,
  onCancel,
  onConfirm,
}: IntelSetupDialogProps) {
  const hasExisting = existingCompetitorCount > 0;
  const storedCap = maxTrackedRivals && maxTrackedRivals > 0 ? maxTrackedRivals : null;
  const [scope, setScope] = useState<"global" | "local">("local");
  const [country, setCountry] = useState(defaultCountry);
  const [city, setCity] = useState(defaultCity);
  const [primaryOffering, setPrimaryOffering] = useState(defaultPrimaryOffering);
  const [customerType, setCustomerType] = useState(defaultCustomerType);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [niche, setNiche] = useState(defaultNiche);
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<CompetitorRunMode>("add");
  const [generateReport, setGenerateReport] = useState(false);
  const [error, setError] = useState("");
  const [detectingNiche, setDetectingNiche] = useState(false);
  const [detectedNicheMeta, setDetectedNicheMeta] = useState<{
    confidence: number;
    evidence: string;
    alternatives: string[];
  } | null>(null);
  const [nicheDetectError, setNicheDetectError] = useState("");

  const sliderMax = Math.max(1, Math.min(10, storedCap ?? 10));
  const lastClientRef = useRef<string | undefined>(undefined);

  async function handleAutoDetectNiche() {
    if (!clientName?.trim()) return;
    setDetectingNiche(true);
    setNicheDetectError("");
    try {
      const res = await detectClientNiche({
        name: clientName,
        website: clientWebsite || null,
        country: scope === "local" && country.trim() ? country.trim() : undefined,
        city: scope === "local" && city.trim() ? city.trim() : undefined,
        primary_offering: primaryOffering.trim() || undefined,
      });
      setNiche(res.niche);
      if ((!industry.trim() || industry.toLowerCase() === "other") && res.industry) {
        setIndustry(res.industry);
      }
      if (!primaryOffering.trim() && res.primary_offering) {
        setPrimaryOffering(res.primary_offering);
      }
      if (!customerType && res.customer_type) {
        setCustomerType(res.customer_type);
      }
      setDetectedNicheMeta({
        confidence: res.confidence,
        evidence: res.evidence,
        alternatives: res.suggested_alternatives || [],
      });
    } catch (err) {
      setNicheDetectError(err instanceof Error ? err.message : "Niche detection failed");
    } finally {
      setDetectingNiche(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const isNewTarget = lastClientRef.current !== clientName;
    lastClientRef.current = clientName;

    if (isNewTarget) {
      setCountry(defaultCountry);
      setCity(defaultCity);
      setPrimaryOffering(defaultPrimaryOffering);
      setCustomerType(defaultCustomerType);
      setIndustry(defaultIndustry);
      setNiche(defaultNiche);
      setMode("add");
      setGenerateReport(false);
      setError("");
      setDetectedNicheMeta(null);
      setNicheDetectError("");
    } else {
      setCountry((prev) => prev.trim() || defaultCountry);
      setCity((prev) => prev.trim() || defaultCity);
      setPrimaryOffering((prev) => prev.trim() || defaultPrimaryOffering);
      setCustomerType((prev) => prev || defaultCustomerType);
      setIndustry((prev) => prev.trim() || defaultIndustry);
      setNiche((prev) => prev.trim() || defaultNiche);
    }
  }, [open, clientName, defaultCountry, defaultCity, defaultPrimaryOffering, defaultCustomerType, defaultIndustry, defaultNiche]);

  useEffect(() => {
    if (count > sliderMax) setCount(sliderMax);
  }, [count, sliderMax]);

  const suggestedNiches = useMemo(() => getNichesForIndustry(industry), [industry]);

  const title = useMemo(
    () => (clientName ? `Run intel for ${clientName}` : "Run intelligence"),
    [clientName],
  );

  const countLabel = "Number of competitors to track";

  const modeHelp =
    mode === "add"
      ? `We’ll track exactly ${count} competitors (keeping your top existing rivals and adding new peers).${storedCap ? ` Cap: ${storedCap} tracked.` : ""}`
      : mode === "replace"
        ? `We’ll clear auto-found rivals and find exactly ${count} fresh competitors. Manually pinned competitors stay.${storedCap ? ` Max ${storedCap} tracked.` : ""}`
        : `We’ll refresh up to ${count} of your current rivals (no new names added).`;

  const submitLabel =
    mode === "add"
      ? `Track ${count} & run`
      : mode === "replace"
        ? `Replace with ${count} & run`
        : `Update ${count} & run`;

  if (!open) return null;

  function submit() {
    setError("");
    if (scope === "local" && !country.trim()) {
      setError("Country is required for local competitor discovery.");
      return;
    }
    if (!clientWebsite?.trim() && !primaryOffering.trim()) {
      setError("Please describe what this company primarily sells or does.");
      return;
    }
    if (mode === "update" && !hasExisting) {
      setError("No competitors to update yet. Choose “Add new” or “Replace all” first.");
      return;
    }
    if (storedCap && count > storedCap) {
      setError(`Individual plans track up to ${storedCap} competitors.`);
      return;
    }
    onConfirm({
      competitor_scope: scope,
      competitor_country: scope === "local" ? country.trim() : undefined,
      competitor_city: scope === "local" && city.trim() ? city.trim() : undefined,
      primary_offering: primaryOffering.trim() || undefined,
      customer_type: customerType || undefined,
      industry: industry.trim() || undefined,
      niche: niche.trim() || undefined,
      competitor_count: count,
      competitor_mode: mode,
      generate_report: generateReport,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(20,35,31,0.42)] p-3 sm:p-4 backdrop-blur-[2px] overflow-y-auto">
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(20,35,31,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intel-setup-title"
      >
        <div className="shrink-0 border-b border-[var(--line)] px-5 py-3.5 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Before we scan</p>
          <h2 id="intel-setup-title" className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Update current rivals, add more, or replace the list with a fresh set.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 px-5 py-4 overscroll-contain">
          <div>
            <Label>What should this run do?</Label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60"
              value={mode}
              onChange={(e) => setMode(e.target.value as CompetitorRunMode)}
              disabled={busy}
            >
              <option value="update" disabled={!hasExisting}>
                Update current: refresh rivals you already have
              </option>
              <option value="add">
                {hasExisting
                  ? "Keep & add: track top rivals plus new peers"
                  : "Add new: discover competitors from scratch"}
              </option>
              <option value="replace">
                Replace all: clear auto-found list and find all-new rivals
              </option>
            </select>
            <p className="mt-2 text-xs text-[var(--muted)]">{modeHelp}</p>
          </div>

          <div>
            <Label>Competitor type</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope("local")}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                  scope === "local"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:bg-black/5"
                }`}
              >
                <div className="font-medium text-[var(--ink)]">Local / country</div>
                <div className="mt-0.5 text-xs">Only rivals in the country you pick</div>
              </button>
              <button
                type="button"
                onClick={() => setScope("global")}
                className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                  scope === "global"
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:bg-black/5"
                }`}
              >
                <div className="font-medium text-[var(--ink)]">Global</div>
                <div className="mt-0.5 text-xs">International peers only</div>
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {scope === "local"
                ? "We’ll fetch and show competitors for that country instead of other markets."
                : "We’ll fetch and show international peers instead of a single-country list."}
            </p>
          </div>

          {scope === "local" ? (
            <div className="space-y-3">
              <div>
                <Label>Country (Required for local)</Label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Pakistan, United States, UAE"
                  list="intel-country-suggestions"
                  autoFocus
                />
                <datalist id="intel-country-suggestions">
                  {COUNTRY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>City / Region (Optional)</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, New York, Riyadh"
                />
                <p className="mt-1 text-[11px] text-[var(--muted)]">Focuses search on competitors in this specific metropolitan area.</p>
              </div>
            </div>
          ) : null}

          {!clientWebsite?.trim() ? (
            <div>
              <Label>What does this company primarily sell or do? (Required)</Label>
              <textarea
                className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                rows={2}
                value={primaryOffering}
                onChange={(e) => setPrimaryOffering(e.target.value)}
                placeholder="e.g. Premium women's ready-to-wear clothing sold online and through retail outlets."
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Because no website is provided, this description grounds competitor discovery in your actual offerings.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <Label>Industry (Optional)</Label>
                <span className="text-[11px] text-[var(--muted)]">Focuses market sector</span>
              </div>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Food & Hospitality, Software & Technology"
                list="intel-industry-suggestions"
              />
              <datalist id="intel-industry-suggestions">
                {getIndustries().map((ind) => (
                  <option key={ind} value={ind} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="mb-0">Market Niche (Optional)</Label>
                {clientName ? (
                  <button
                    type="button"
                    onClick={() => void handleAutoDetectNiche()}
                    disabled={detectingNiche || busy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 transition"
                    title="Detect exact commercial niche using AI & web intelligence"
                  >
                    {detectingNiche ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Detecting niche…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Auto-detect niche</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--muted)]">e.g. Pizza & Fast Food Delivery</span>
                )}
              </div>
              <Input
                value={niche}
                onChange={(e) => {
                  setNiche(e.target.value);
                  if (detectedNicheMeta) setDetectedNicheMeta(null);
                }}
                placeholder="e.g. Pizza & Fast Food Delivery, B2B SaaS"
              />
              {detectedNicheMeta ? (
                <div className="mt-2 flex flex-col gap-1 rounded-xl bg-emerald-500/10 p-2.5 text-xs text-emerald-900 border border-emerald-500/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      Auto-detected ({detectedNicheMeta.confidence}% confidence)
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      High Precision
                    </span>
                  </div>
                  {detectedNicheMeta.evidence ? (
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                      {detectedNicheMeta.evidence}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {nicheDetectError ? (
                <p className="mt-1 text-xs text-red-600">{nicheDetectError}</p>
              ) : null}
              {detectedNicheMeta && detectedNicheMeta.alternatives.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--muted)]">Suggested alternatives:</span>
                  {detectedNicheMeta.alternatives.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setNiche(alt)}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                        niche.toLowerCase() === alt.toLowerCase()
                          ? "bg-[var(--accent)] text-white"
                          : "bg-black/5 text-[var(--ink)] hover:bg-black/10"
                      }`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              ) : suggestedNiches.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {suggestedNiches.slice(0, 5).map((sNiche) => (
                    <button
                      key={sNiche}
                      type="button"
                      onClick={() => setNiche(sNiche)}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                        niche.toLowerCase() === sNiche.toLowerCase()
                          ? "bg-[var(--accent)] text-white"
                          : "bg-black/5 text-[var(--ink)] hover:bg-black/10"
                      }`}
                    >
                      {sNiche}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <Label>Customer type (Optional)</Label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
            >
              <option value="">Not sure / Infer automatically</option>
              <option value="b2c">B2C (Consumers)</option>
              <option value="b2b">B2B (Businesses)</option>
              <option value="both">Both B2B & B2C</option>
            </select>
          </div>


          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label>{countLabel}</Label>
              <span className="text-sm font-semibold tabular-nums text-[var(--ink)]">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={sliderMax}
              step={1}
              value={Math.min(count, sliderMax)}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
              disabled={busy}
            />
            <div className="mt-1 flex justify-between text-[11px] text-[var(--muted)]">
              <span>1</span>
              <span>{sliderMax}</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={generateReport}
              disabled={busy}
              onChange={(e) => setGenerateReport(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-[var(--ink)]">
                Also generate a client report
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Optional. Uses 1 report credit. Leave unchecked to save quota; you can make a report later from the
                Reports tab.
              </span>
            </span>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="shrink-0 flex gap-2 border-t border-[var(--line)] bg-[var(--panel)] px-5 py-3.5 sm:py-4">
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={submit} disabled={busy}>
            {busy ? "Starting…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
