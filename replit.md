# Wave-I War Room

## Overview

pnpm workspace monorepo using TypeScript. The main deliverable is the **Wave-I War Room** — a truth-first operator surface for tracking Blue (ARCC) and Green (AGNC) only.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/wave-i)
- **API framework**: Express 5 (artifacts/api-server, unused for now)
- **Database**: PostgreSQL + Drizzle ORM (provisioned but not yet used)
- **Market data**: Yahoo Finance via corsproxy.io (no API key required)

## Artifacts

### Wave-I War Room (`artifacts/wave-i`)
- **Preview path**: `/`
- **Port**: 24667
- **Type**: react-vite (frontend only, no backend needed)

Sections:
1. **Live Market Tape** — SPY, QQQ, IWM, TLT, HYG, XLF + peers scrolling tape
2. **Quote Board** — ARCC (Blue) and AGNC (Green) live quotes, after-hours, full stats
3. **Movement** — Day range and 52W range position bars, from-high/low stats
4. **Calculators** — Yield, Dip Target, DRiP Reinvestment projector (tabbed)
5. **Research Links** — Direct links to SEC filings, Seeking Alpha, Macrotrends, IR sites, Finviz

## Planned (future phases)
- Dividend calendar with ex-dates and pay dates
- Dip event view
- Mint bucket DRiP counter
- Payout history
- DRiP event view

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/wave-i run dev` — run Wave-I frontend locally

## Architecture Notes

- All market data fetches from Yahoo Finance via corsproxy.io for CORS bypass
- Primary chart data: `/v8/finance/chart/{symbol}` (price, change, day range, volume)
- Extended data: `/v7/finance/quote?symbols={symbol}` (52W range, avg volume, market cap, after-hours)
- Tape fetches ~17 symbols every 90 seconds
- No backend required for this version — fully static React app

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
