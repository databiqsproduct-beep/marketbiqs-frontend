# MarketBiqs Frontend

Next.js 15 web client for **MarketBiqs** — an AI-powered competitive intelligence and market monitoring platform designed for digital marketing agencies, consultants, and growth teams.

---

## 🚀 Overview

MarketBiqs enables automated competitor tracking, multi-industry benchmarking, feature parity matrices, positioning strategy insights, and executive PDF reporting for clients across global and local markets.

### Key Capabilities
- **Landing Page & Value Demo**: Modern hero overview and automated onboarding flow.
- **Client Intelligence Workspace**:
  - **Overview**: Executive summary, positioning strategy, and high-threat warnings.
  - **Competitors & Matrix**: Feature parity comparison, threat level scoring, and pinned competitor management.
  - **Market Demand & Trends**: Live search trends, keyword demand, and sentiment signals.
  - **Strategy & Recommendations**: Actionable tactical playbooks and Jira task integration.
  - **Reports & Delivery**: Single-click Executive PDF reports and scheduled email deliveries.
- **Multi-Workspace Modes**: Agency workspace with multi-client support and dedicated Individual Client workspace mode.
- **Supabase Authentication**: Secure session management, Google OAuth PKCE, and JWT verification.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: TailwindCSS & Lucide React icons
- **State & Auth**: Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- **Markdown Rendering**: `react-markdown` with `remark-gfm`

---

## ⚙️ Environment Configuration

Create a `.env` or `.env.local` file based on `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Build & Linting checks:
   ```bash
   npm run lint
   npm run build
   ```
