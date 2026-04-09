# Wave-I — War Room

**Truth-first operator dashboard for Blue Bucket (BDC) and Green Bucket (mREIT) only.**

This repo is the canonical build archive for Wave-I. It is the single source of truth for the current app state, scope, and next steps. The intent is to optimize here and push back into Replit when ready.

---

## What Wave-I Is

Wave-I is a focused income-investor operator surface. It is **not** a general market dashboard. It covers exactly two buckets:

- **Blue Bucket** — Business Development Companies (BDCs), primary instrument: ARCC
- **Green Bucket** — Mortgage REITs (mREITs) + related ETFs, primary instrument: AGNC

Wave-I replaced the old WaveRider dashboard, which was regime-heavy, over-engineered, and full of complexity that had nothing to do with the actual job: tracking BDC/mREIT income, dips, DRiP, and portfolio state.

---

## What This Repo Is For

This repo exists so Wave-I can be:

1. Developed and optimized outside of Replit
2. Version-controlled with intent
3. Pushed back into Replit when a phase is complete

All source code, configuration, assets, and documentation needed to recreate the running app are here.

---

## How to Run It

### Prerequisites

- Node.js 18+
- pnpm 8+

### Install

```bash
pnpm install
```

### Run (Wave-I web app only)

```bash
pnpm --filter @workspace/wave-i run dev
```

The app runs on the port defined by `$PORT` (default: 24667 in Replit). Open `http://localhost:24667` in your browser.

### Run (full workspace)

```bash
pnpm --filter @workspace/api-server run dev   # API server (not required for Wave-I)
pnpm --filter @workspace/wave-i run dev        # Wave-I frontend
```

---

## What the Current App Does

### War Room tab (default)

- **Live scrolling market tape** — 17 symbols: SPY, QQQ, IWM, TLT, HYG, XLF, ARCC, AGNC, BX, KKR, ARES, FSK, MAIN, ORCC, NLY, RITM, TWO. Auto-refreshes every 90 seconds via Yahoo Finance v8 chart API through corsproxy.io.
- **Bucket Quote Board** — Two panels (BLUE / GREEN), each with a full instrument dropdown. BLUE: 20 BDCs. GREEN: 17 mREITs/ETFs. Fetches live quotes (price, change %, day range, 52W range, volume, after-hours price) per selection. Defaults to ARCC / AGNC.
- **Movement Stats** — Day range position bar, 52W range position bar, distance from 52W low and 52W high for both ARCC and AGNC.
- **Calculators** — Three deterministic calculators: Yield (annual/monthly income + yield-on-price), Dip Target (price at % below current, shares for budget), DRiP Reinvestment Projector (compound share growth over N months).
- **Research Links** — Categorized external links for ARCC (SEC filings, 10-K/10-Q, Yahoo, Seeking Alpha, Macrotrends, BDC Reporter, Ares IR, Finviz) and AGNC (same categories, AGNC IR).

### Portfolio tab

- **Add Holding Form** — Collapsible. Bucket + instrument dropdown, shares, entry date, entry price, dividends collected, latest dip date, DRiP amount, expected annual income, notes. Validated before save.
- **Portfolio Table** — Full holdings table with live current price per ticker (via react-query), computed current value, cost basis, unrealized G/L + %, dividends collected, dip date, DRiP amount, expected income, notes. All data columns are sortable. Bucket filter (ALL / BLUE / GREEN). Inline row editing. Delete with confirm. Footer totals: cost basis, dividends collected, expected income.
- **Persistence** — localStorage (`wavei_portfolio_v1`). Survives page reload. No backend required.

---

## What Is Not Done Yet

See `NEXT_STEPS.md` for the full ordered build queue.

Short version of what is missing:

- Dividend calendar (ex-dates, pay dates)
- Dip history log
- Mint DRiP counter
- Payout history per instrument
- Full 52W range data (currently missing from Yahoo v8 for some tickers — v7 endpoint returns 401 in browser without auth)
- Avg volume and market cap (same auth issue on v7)
- Deployment-ready build (currently Replit-only dev server)

---

## How This Differs from Old WaveRider

| WaveRider | Wave-I |
|---|---|
| Multi-instrument universe, all sectors | Blue + Green only |
| Complex regime logic | Removed entirely |
| Mocked/placeholder data | All data is live (Yahoo Finance) |
| No portfolio tracker | Full portfolio tracker with G/L, DRiP, dividends |
| Heavy dashboard patterns | Flat, plain, operator-focused |
| No localStorage | localStorage persistence |
| Fixed ARCC/AGNC only | Full-bucket instrument dropdown (20 BDCs, 17 mREITs) |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (custom dark theme) |
| Data fetching | TanStack Query (react-query) |
| Market data | Yahoo Finance v8/v7 via corsproxy.io |
| Persistence | localStorage |
| Monorepo | pnpm workspaces |
| Icons | Lucide React |

No backend required. No API keys. No auth.

---

## Repository Structure

```
artifacts/wave-i/           ← Wave-I React+Vite app
  src/
    components/             ← UI components
      AddHoldingForm.tsx
      BucketQuoteBoard.tsx
      Calculators.tsx
      Header.tsx
      MarketTape.tsx
      MovementStats.tsx
      PortfolioTable.tsx
      QuoteCard.tsx
      ResearchLinks.tsx
      ui/                   ← shadcn/ui primitives
    lib/
      instruments.ts        ← Full Blue/Green instrument universe
      market.ts             ← Yahoo Finance fetch layer
      portfolio.ts          ← localStorage CRUD + calc helpers
      research-links.ts     ← Research link definitions
      utils.ts              ← Formatting helpers
    pages/
      WarRoom.tsx           ← Main page (War Room + Portfolio tabs)
  index.html
  vite.config.ts
  package.json
README.md                   ← This file
WAVE_I_SCOPE.md             ← Scope definition
CURRENT_STATE.md            ← Precise current build status
NEXT_STEPS.md               ← Ordered build queue
```
