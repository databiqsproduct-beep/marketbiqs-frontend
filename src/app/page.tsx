"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Sparkles,
  Search,
  Bot,
  FileSpreadsheet,
  Send,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Globe,
  Layers,
  Building2,
  Menu,
  X,
  TrendingUp,
  Target,
  FileText,
  Star,
  Radar,
} from "lucide-react";

export default function HomePage() {
  const { user, agency, loading, needsBootstrap } = useAuth();
  const router = useRouter();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Feature Showcase active tab
  const [activeTab, setActiveTab] = useState<"reports" | "matrix" | "assistant" | "portal">("reports");

  // Pricing frequency state
  const [annualBilling, setAnnualBilling] = useState(true);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (loading) return;
    if (user && needsBootstrap) {
      router.replace("/register?oauth=1");
      return;
    }
    if (user && agency) {
      router.replace(agency.onboarding_completed ? "/dashboard" : "/onboarding");
    }
  }, [user, agency, loading, needsBootstrap, router]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white relative overflow-x-hidden font-sans">
      {/* ──────────────────────────────────────────────────────────
          1. STICKY GLASS HEADER
      ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--line)]/80 bg-[var(--bg)]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm transition-transform group-hover:scale-105">
              <Radar className="h-5 w-5 !text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ink)]">
                MarketBiqs
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--accent)] -mt-1">
                Agency Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--muted)]">
            <a href="#features" className="hover:text-[var(--ink)] transition-colors">
              Capabilities
            </a>
            <a href="#showcase" className="hover:text-[var(--ink)] transition-colors">
              Platform Demo
            </a>
            <a href="#workflow" className="hover:text-[var(--ink)] transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[var(--ink)] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="btn-white rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold !text-black shadow-xs hover:!bg-neutral-50 transition inline-flex items-center justify-center"
            >
              <span className="!text-black">Sign In</span>
            </Link>
            <Link
              href="/register"
              className="btn-green inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold !text-white shadow-sm hover:brightness-110 active:scale-95 transition"
            >
              <span className="!text-white">Get Started</span>
              <ArrowRight className="h-4 w-4 !text-white" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="btn-white sm:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] !text-black hover:!bg-neutral-50 shadow-xs"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 !text-black" /> : <Menu className="h-5 w-5 !text-black" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-[var(--line)] bg-[var(--panel)] px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-3 font-medium text-[var(--ink)]">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-lg hover:bg-black/5"
              >
                Capabilities
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-lg hover:bg-black/5"
              >
                Platform Demo
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-lg hover:bg-black/5"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-lg hover:bg-black/5"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-lg hover:bg-black/5"
              >
                FAQ
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--line)] flex flex-col gap-2">
              <Link
                href="/login"
                className="btn-white w-full text-center py-2.5 rounded-xl border border-[var(--line)] text-sm font-semibold !text-black shadow-xs hover:!bg-neutral-50 block"
              >
                <span className="!text-black">Sign In</span>
              </Link>
              <Link
                href="/register"
                className="btn-green w-full text-center py-2.5 rounded-xl text-sm font-semibold !text-white shadow-sm hover:brightness-110 block"
              >
                <span className="!text-white">Start Free Onboarding</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ──────────────────────────────────────────────────────────
          2. HERO SECTION
      ────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36 overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[var(--accent)]/15 via-[#134e4a]/10 to-transparent blur-3xl -z-10 rounded-full" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)]/60 px-4 py-1.5 text-xs font-semibold text-[var(--accent)] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Next-Gen Competitive Intelligence for Agencies</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-6xl lg:text-7xl leading-[1.08]">
              Turn Competitor Chaos Into{" "}
              <span className="relative inline-block text-[var(--accent)] underline decoration-[var(--accent-soft)] decoration-wavy decoration-from-font">
                High-Retainer Strategy
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-[var(--muted)] leading-relaxed">
              Multi-client competitor tracking, AI-powered gap synthesis, white-label executive PDF decks, and automated client delivery, built specifically for high-growth marketing agencies.
            </p>

            {/* CTA Group */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/register"
                className="btn-green w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-base font-semibold !text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                <span className="!text-white">Start Free Agency Onboarding</span>
                <ArrowRight className="h-5 w-5 !text-white" />
              </Link>
              <Link
                href="/login"
                className="btn-white w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-6 py-3.5 text-base font-semibold !text-black shadow-xs hover:!bg-neutral-50 active:scale-95 transition"
              >
                <span className="!text-black">Sign In to Workspace</span>
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> White-label ready
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 2-minute client setup
              </span>
            </div>

            {/* ──────────────────────────────────────────────────────────
                HERO PREVIEW CARD (Simulated Live Agency Workspace)
            ────────────────────────────────────────────────────────── */}
            <div className="mt-14 w-full max-w-5xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3 sm:p-5 shadow-2xl transition-all">
              {/* Window Bar Header */}
              <div className="flex items-center justify-between border-b border-[var(--line)]/60 pb-3 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-xs font-mono text-[var(--muted)] hidden sm:inline">
                    marketbiqs.com/dashboard/client/acme-growth
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracker
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Metric Box 1 */}
                <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--muted)]">
                    <span>Gaps Identified</span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
                    14 New
                  </div>
                  <div className="mt-1 text-xs text-emerald-700 font-medium">
                    +4 ad angle opportunities vs. Rival A
                  </div>
                </div>

                {/* Metric Box 2 */}
                <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--muted)]">
                    <span>Ad Creative Velocity</span>
                    <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
                    38 Creatives
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Active campaigns across 3 rivals
                  </div>
                </div>

                {/* Metric Box 3 */}
                <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--muted)]">
                    <span>Report Status</span>
                    <FileText className="h-4 w-4 text-[var(--brand-secondary)]" />
                  </div>
                  <div className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
                    Ready
                  </div>
                  <div className="mt-1 text-xs text-[var(--accent)] font-medium">
                    White-label PDF ready to deliver
                  </div>
                </div>
              </div>

              {/* Mock Intel Feed Preview */}
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4 text-left shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--line)]/50 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      AI Executive Synthesis & Key Findings
                    </span>
                  </div>
                  <span className="text-xs text-[var(--muted)]">Updated 12 mins ago</span>
                </div>
                <div className="space-y-2 text-sm text-[var(--ink)]/90">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
                    <p>
                      <strong>Competitor Alpha</strong> shifted positioning to “Enterprise AI Governance” and dropped starter pricing by 15%.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <p>
                      <strong>Untapped Hook Angle</strong>: 68% of competitor reviews complain about lack of personalized onboarding. Recommend launching targeted comparison landing page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          3. STATS / SOCIAL PROOF BANNER
      ────────────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--line)] bg-[var(--panel)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            <div>
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--accent)]">
                450+
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted)]">Agency Workspaces</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--ink)]">
                18 hrs
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted)]">Saved / Client / Mo</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--accent)]">
                500k+
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted)]">Competitor Pages Scanned</div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[var(--ink)]">
                99.8%
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted)]">Client Retention Boost</div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4. CORE CAPABILITIES (6-GRID PILLARS)
      ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Enterprise Agency Arsenal
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--ink)]">
              Everything Your Agency Needs to Dominate Client Research
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[var(--muted)]">
              Replace messy spreadsheets, manual screenshots, and fragmented tools with a single automated research powerhouse.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] mb-5">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Multi-Client Sandboxing
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Manage dozens of client accounts with zero data cross-contamination. Each client gets dedicated competitor lists, scraped archives, and custom tracking schedules.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-5">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Automated Deep Crawling
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Continuous automated scraping of competitor landing pages, value propositions, pricing tables, ad angles, and search ranking changes without manual intervention.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800 mb-5">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                AI Gap & Positioning Reasoning
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Groq-powered reasoning models evaluate competitor messaging to uncover untapped customer pain points, missing features, and high-converting ad hooks.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-900 mb-5">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                1-Click White-Label Reports
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Generate polished, boardroom-ready executive PDF decks styled with your agency’s logo, brand palette, and custom typography in seconds.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 mb-5">
                <Send className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Automated Multi-Channel Dispatch
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Schedule automatic delivery of weekly or monthly intelligence briefings directly to client stakeholders via branded Email (Resend) and WhatsApp (Twilio).
              </p>
            </div>

            {/* Card 6 */}
            <div className="group relative rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-7 shadow-sm transition hover:shadow-md hover:border-[var(--accent)]/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-900 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                BYOK & Enterprise Privacy
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Plug in your own Groq/OpenAI keys for unlimited querying and cost savings. Enterprise data isolation ensures your client intel stays private and proprietary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          5. INTERACTIVE PLATFORM DEMO SHOWCASE
      ────────────────────────────────────────────────────────── */}
      <section id="showcase" className="py-20 bg-[var(--panel)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Interactive Workspace
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              See the Power of MarketBiqs in Action
            </h2>
            <p className="mt-4 text-base text-[var(--muted)]">
              Click through our core modules to experience how agencies use MarketBiqs daily.
            </p>
          </div>

          {/* Tab Controls: Green bg -> white text; White bg -> black text */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-xs ${
                activeTab === "reports"
                  ? "btn-green !text-white"
                  : "btn-white border border-[var(--line)] !text-black hover:!bg-neutral-50"
              }`}
            >
              <FileText className={`h-4 w-4 ${activeTab === "reports" ? "!text-white" : "!text-black"}`} />
              <span className={activeTab === "reports" ? "!text-white" : "!text-black"}>Executive Reports</span>
            </button>
            <button
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-xs ${
                activeTab === "matrix"
                  ? "btn-green !text-white"
                  : "btn-white border border-[var(--line)] !text-black hover:!bg-neutral-50"
              }`}
            >
              <Layers className={`h-4 w-4 ${activeTab === "matrix" ? "!text-white" : "!text-black"}`} />
              <span className={activeTab === "matrix" ? "!text-white" : "!text-black"}>Competitor Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-xs ${
                activeTab === "assistant"
                  ? "btn-green !text-white"
                  : "btn-white border border-[var(--line)] !text-black hover:!bg-neutral-50"
              }`}
            >
              <Bot className={`h-4 w-4 ${activeTab === "assistant" ? "!text-white" : "!text-black"}`} />
              <span className={activeTab === "assistant" ? "!text-white" : "!text-black"}>AI Research Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab("portal")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-xs ${
                activeTab === "portal"
                  ? "btn-green !text-white"
                  : "btn-white border border-[var(--line)] !text-black hover:!bg-neutral-50"
              }`}
            >
              <Globe className={`h-4 w-4 ${activeTab === "portal" ? "!text-white" : "!text-black"}`} />
              <span className={activeTab === "portal" ? "!text-white" : "!text-black"}>Client Portal</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-lg max-w-5xl mx-auto">
            {activeTab === "reports" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                    Boardroom Ready
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                    One-Click White-Label Executive Decks
                  </h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Stop spending 10+ hours formatting slides before client meetings. MarketBiqs compiles real-time scraping data, positioning graphs, and SWOT summaries into a beautifully branded ReportLab PDF.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Your Agency Logo, Colors, and Custom Headers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Strategic Positioning Maps & Pricing Matrices
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Download as PDF or Send Automatically
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fdfcf9] p-5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div className="text-xs font-bold text-[var(--accent)]">REPORT PREVIEW</div>
                    <div className="text-xs text-[var(--muted)]">PDF / 14 Pages</div>
                  </div>
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="h-4 bg-[var(--accent)]/20 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="border border-[var(--line)] rounded p-2 bg-white">
                        <span className="text-[10px] text-[var(--muted)]">Rival Positioning</span>
                        <div className="font-bold mt-1 text-[var(--ink)]">Heavy Enterprise Focus</div>
                      </div>
                      <div className="border border-[var(--line)] rounded p-2 bg-white">
                        <span className="text-[10px] text-[var(--muted)]">Suggested Counter</span>
                        <div className="font-bold mt-1 text-emerald-700">Push Self-Serve Speed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "matrix" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    Live Parity
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                    Deep Feature & Positioning Matrix
                  </h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Compare your client’s value proposition against all top rivals in a live, interactive matrix. Spot price drops, new landing page hooks, and tech stack shifts before anyone else.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Side-by-side landing page diffs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Pricing tier & package comparison
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Ad angle breakdown & hook analysis
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fdfcf9] p-4 text-xs">
                  <div className="font-bold mb-3 text-[var(--ink)]">Competitor Angle Matrix</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-[var(--line)]">
                      <span className="font-medium">Client Brand</span>
                      <span className="text-emerald-700 font-bold">Fastest Turnaround</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-[var(--line)]">
                      <span className="font-medium">Rival Alpha</span>
                      <span className="text-blue-700 font-bold">Enterprise Custom</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-[var(--line)]">
                      <span className="font-medium">Rival Beta</span>
                      <span className="text-amber-700 font-bold">Lowest Cost Entry</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assistant" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
                    Groq Ultra-Fast AI
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                    Conversational Client Intelligence
                  </h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Have an instant strategic dialog about any client. Ask questions like <em>“What ad hooks is Rival X running this week?”</em> or <em>“Draft a pitch counter for our next meeting.”</em>
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-700" /> Grounded exclusively in live scraped data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-700" /> Instant pitch deck and copy generation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-700" /> Streamed real-time answers in milliseconds
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fdfcf9] p-4 text-xs space-y-3">
                  <div className="bg-white border border-[var(--line)] rounded-lg p-3 text-left shadow-xs">
                    <span className="text-[10px] font-bold text-[var(--muted)]">AGENCY STRATEGIST</span>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      How can our client differentiate against Competitor X’s new Q3 campaign?
                    </p>
                  </div>
                  <div className="bg-[var(--accent-soft)]/50 border border-[var(--accent)]/20 rounded-lg p-3 text-left">
                    <span className="text-[10px] font-bold text-[var(--accent)]">BIQS AI ASSISTANT</span>
                    <p className="mt-1 text-[var(--ink)]">
                      Competitor X is currently focusing on broad brand awareness without mentioning implementation timelines. Position your client on <strong>“Launch in 48 hours vs. 6 weeks”</strong> with dedicated slack support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "portal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-900">
                    White-Label Embed
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                    Client-Facing AI Intel Portals
                  </h3>
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    Give high-tier retainer clients their own dedicated portal link or embed it inside your agency client dashboard. They can chat with AI about their competitive landscape 24/7.
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-800" /> Custom subdomains or embeddable iframes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-800" /> Zero mention of MarketBiqs (100% white-label)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-800" /> Increases monthly retainer value significantly
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fdfcf9] p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-3">
                    <span className="font-bold text-[var(--ink)]">YourAgency Intel Portal</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">Active Retainer</span>
                  </div>
                  <div className="bg-white border border-[var(--line)] rounded p-3 text-center shadow-xs">
                    <p className="text-[var(--muted)] text-xs">
                      “Welcome Acme Corp Marketing Team! Ask anything regarding your live competitor intelligence.”
                    </p>
                    <div className="mt-3 inline-block btn-green !text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="!text-white">Open Dedicated Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          6. 3-STEP AGENCY WORKFLOW ("HOW IT WORKS")
      ────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Streamlined Operations
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              How MarketBiqs Works in 3 Simple Steps
            </h2>
            <p className="mt-4 text-base text-[var(--muted)]">
              Up and running in less than 2 minutes without engineers or complicated API setup.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-8 relative shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white font-[family-name:var(--font-display)] text-2xl font-bold mb-6 shadow-md">
                01
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Add Client & Rivals
              </h3>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                Enter your client’s domain and their top 3 to 10 competitor websites. No custom code or proxy setup required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-8 relative shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-secondary)] text-white font-[family-name:var(--font-display)] text-2xl font-bold mb-6 shadow-md">
                02
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Automated AI Synthesis
              </h3>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                Our background scrapers extract positioning, pricing, and messaging, while Groq AI models extract actionable gaps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-8 relative shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-white font-[family-name:var(--font-display)] text-2xl font-bold mb-6 shadow-md">
                03
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Deliver & Retain
              </h3>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                Export branded PDFs, trigger scheduled WhatsApp/Email digests, or share an interactive portal to justify premium retainers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          7. PRICING & ROI SECTION
      ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-[var(--panel)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Transparent Pricing
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Scales Perfectly With Your Client Retainers
            </h2>
            <p className="mt-4 text-base text-[var(--muted)]">
              Simple, transparent pricing built for agencies of all sizes.
            </p>

            {/* Billing Switcher */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-xs">
              <button
                onClick={() => setAnnualBilling(false)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  !annualBilling
                    ? "btn-green !text-white shadow-xs"
                    : "btn-white !text-black hover:!bg-neutral-50"
                }`}
              >
                <span className={!annualBilling ? "!text-white" : "!text-black"}>Monthly Billing</span>
              </button>
              <button
                onClick={() => setAnnualBilling(true)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  annualBilling
                    ? "btn-green !text-white shadow-xs"
                    : "btn-white !text-black hover:!bg-neutral-50"
                }`}
              >
                <span className={annualBilling ? "!text-white" : "!text-black"}>Annual Billing</span>
                <span className="rounded-full bg-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Agency Tier */}
            <div className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Starter Agency
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">For boutique teams & solo consultants</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">
                  {annualBilling ? "$79" : "$99"}
                </span>
                <span className="text-xs text-[var(--muted)]">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink)] border-t border-[var(--line)]/60 pt-6 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Up to 5 Active Clients
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 15 Tracked Competitors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Weekly Automated Crawls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Standard PDF Reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 2 Team Seats
                </li>
              </ul>
              <Link
                href="/register"
                className="btn-white mt-8 block w-full text-center rounded-xl border border-[var(--line)] py-3 text-sm font-semibold !text-black shadow-xs hover:!bg-neutral-50 transition"
              >
                <span className="!text-black">Get Started</span>
              </Link>
            </div>

            {/* Growth Agency Tier (Featured) */}
            <div className="flex flex-col rounded-2xl border-2 border-[var(--accent)] bg-white p-7 shadow-xl relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                Most Popular for Agencies
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Growth Agency
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">For growing digital & marketing agencies</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--accent)]">
                  {annualBilling ? "$199" : "$249"}
                </span>
                <span className="text-xs text-[var(--muted)]">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink)] border-t border-[var(--line)]/60 pt-6 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Up to 20 Active Clients
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 80 Tracked Competitors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Daily Automated Intel Crawls
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 100% White-Label PDF Reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Automated WhatsApp & Email Dispatch
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> 10 Team Seats
                </li>
              </ul>
              <Link
                href="/register"
                className="btn-green mt-8 block w-full text-center rounded-xl py-3 text-sm font-semibold !text-white shadow-md hover:brightness-110 active:scale-95 transition"
              >
                <span className="!text-white">Start 14-Day Free Trial</span>
              </Link>
            </div>

            {/* Enterprise / Scale Tier */}
            <div className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm">
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                Scale & Enterprise
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">For large agencies & agency networks</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-[var(--ink)]">
                  {annualBilling ? "$399" : "$499"}
                </span>
                <span className="text-xs text-[var(--muted)]">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-[var(--ink)] border-t border-[var(--line)]/60 pt-6 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Unlimited Clients & Competitors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Custom Scraping Intervals & Webhooks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Bring Your Own Key (BYOK AI)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Custom Domain Client Portals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" /> Dedicated Slack Support & SLA
                </li>
              </ul>
              <Link
                href="/register"
                className="btn-white mt-8 block w-full text-center rounded-xl border border-[var(--line)] py-3 text-sm font-semibold !text-black shadow-xs hover:!bg-neutral-50 transition"
              >
                <span className="!text-black">Contact Sales / Start Free</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          8. TESTIMONIALS SECTION
      ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Agency Success Stories
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Trusted by Hundreds of High-Performance Agencies
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed italic">
                “MarketBiqs replaced 15+ hours of manual weekly competitor audits across our 18 client retainers. Our clients think we have a 10-person research team.”
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm">
                  AR
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">Alexander Ross</div>
                  <div className="text-xs text-[var(--muted)]">Managing Partner, HyperGrowth Media</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed italic">
                “The automated WhatsApp intelligence dispatch is a gamechanger. Our clients receive instant notifications when rivals shift pricing, keeping them locked in our high-tier tier.”
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--brand-secondary)] text-white flex items-center justify-center font-bold text-sm">
                  SL
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">Sarah Lin</div>
                  <div className="text-xs text-[var(--muted)]">Head of Performance, Peak Agency</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
              <div className="flex gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--ink)] leading-relaxed italic">
                “The white-label PDF decks look like they came from a top-3 strategy consultancy. MarketBiqs paid for itself in our very first client pitch.”
              </p>
              <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm">
                  DK
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">David Keller</div>
                  <div className="text-xs text-[var(--muted)]">Founder, Apex Digital Ops</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          9. FAQ ACCORDION SECTION
      ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-[var(--panel)] border-y border-[var(--line)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--accent)]">
              Got Questions?
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "Can I fully white-label MarketBiqs with my agency brand?",
                a: "Yes! All PDF reports, client portal links, and delivery emails reflect your agency logo, brand colors, and custom header text. There is zero mention of MarketBiqs to your clients.",
              },
              {
                q: "How does the competitor scraping work?",
                a: "MarketBiqs automatically crawls target competitor landing pages, pricing tables, public ad angles, and SERP shifts using secure background workers. You do not need proxies or technical scraping setup.",
              },
              {
                q: "Can I bring my own AI API keys (BYOK)?",
                a: "Yes! On our Growth and Scale plans, you can input your own Groq or OpenAI API keys to unlock custom token rates and tailored reasoning models.",
              },
              {
                q: "What delivery channels are supported for automated reports?",
                a: "You can automatically send scheduled weekly or monthly competitive briefings via branded HTML Emails (powered by Resend) or direct WhatsApp messages (powered by Twilio).",
              },
              {
                q: "How quickly can I onboard our first client?",
                a: "Setting up a client takes less than 2 minutes. Enter the client name, domain, and competitor URLs, and our automated engine will immediately generate the initial baseline intelligence report.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[var(--line)] bg-white overflow-hidden transition shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="btn-white w-full flex items-center justify-between p-5 text-left font-semibold !text-black hover:!bg-neutral-50"
                >
                  <span className="text-base !text-black">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-5 w-5 text-[var(--accent)] shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 !text-black/60 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--line)]/50 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          10. FINAL HIGH-CONVERTING CTA BANNER
      ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0b2e2a] via-[#123d37] to-[#1c1914] px-8 py-16 sm:px-16 sm:py-20 text-center text-white shadow-2xl overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.4),transparent_50%)] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                <Zap className="h-3.5 w-3.5" /> Instant 2-Minute Setup
              </span>
              <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                Ready to 10x Your Agency’s Research Ops?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/80">
                Join 450+ marketing agencies delivering premium competitive intelligence on autopilot.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="btn-white w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl !bg-white px-8 py-3.5 text-base font-bold !text-black shadow-lg hover:!bg-neutral-100 active:scale-95 transition"
                >
                  <span className="!text-black font-bold">Start Free Onboarding</span>
                  <ArrowRight className="h-5 w-5 !text-black" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3.5 text-base font-medium !text-white hover:!bg-white/10 transition"
                >
                  <span className="!text-white">Sign In to Workspace</span>
                </Link>
              </div>

              <div className="mt-6 text-xs text-white/60">
                No credit card required • Instant access to live sandbox
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          11. COMPREHENSIVE FOOTER
      ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--line)] bg-[var(--panel)] py-14 text-sm text-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand & Bio */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
                  <Radar className="h-4.5 w-4.5 !text-white" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ink)]">
                  MarketBiqs
                </span>
              </Link>
              <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed max-w-sm">
                Multi-client competitive intelligence and automated research platform purpose-built for high-retention marketing agencies.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-[var(--ink)]">All Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Product</h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <a href="#features" className="hover:text-[var(--ink)] transition">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-[var(--ink)] transition">
                    Platform Demo
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-[var(--ink)] transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[var(--ink)] transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[var(--ink)] transition">
                    Agency Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Solutions</h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <span className="text-[var(--muted)]">Digital Agencies</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">Performance Marketing</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">SEO & Content Studios</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">Growth Consultancies</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">White-Label Portals</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Security */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">Security & Legal</h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                <li>
                  <span className="text-[var(--muted)]">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">Terms of Service</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">Data Isolation</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">GDPR Compliance</span>
                </li>
                <li>
                  <span className="text-[var(--muted)]">BYOK Encryption</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--line)]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
            <div>
              © {new Date().getFullYear()} MarketBiqs Inc. All rights reserved. Built for agencies worldwide.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-[var(--ink)] transition">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-[var(--ink)] transition">
                Register Agency
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
