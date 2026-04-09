# Wave-I — Next Steps

Ordered build queue. Priority 1 is next. Do not skip phases.

---

## Priority 1 — Wire Movement Stats to Quote Board Selection

**Problem:** The Movement Stats panel is hardcoded to ARCC and AGNC. When the user changes the Quote Board dropdown to a different instrument, Movement Stats does not update.

**Fix:**
- Lift the selected Blue/Green ticker state up from `BucketQuoteBoard` into `WarRoom`
- Pass the selected tickers down to `MovementStats`
- `MovementStats` fetches quotes for the selected instruments (already cached by react-query)
- Update the label from `"BLUE · ARCC"` / `"GREEN · AGNC"` to reflect the actual selected ticker

**Files:** `WarRoom.tsx`, `BucketQuoteBoard.tsx`, `MovementStats.tsx`

---

## Priority 2 — Fix 52W Range, Avg Volume, Market Cap Data

**Problem:** Yahoo Finance v7 returns 401 in the browser because it requires auth cookies. These fields show `—` for most users.

**Options (in order of preference):**
1. Try Yahoo Finance v11 (`/v11/finance/quoteSummary`) — may work without cookies
2. Use a different corsproxy or self-hosted proxy that forwards cookies
3. Add a lightweight Replit API server endpoint that proxies Yahoo v7 server-side (auth cookies not needed server-side for many symbols)
4. Fall back to scraping the Yahoo HTML quote page for these fields

**Files:** `market.ts`, possibly a new `artifacts/api-server` route

---

## Priority 3 — Dividend Calendar

Build a new tab (or section under War Room) showing upcoming dividend events.

**Data required per instrument:**
- Ex-dividend date
- Pay date
- Dividend amount (declared or estimated)

**Data sources (evaluate in order):**
1. Yahoo Finance `/v7/finance/quote` has `dividendDate` and `exDividendDate` — try these
2. If unavailable: manually curated data file `src/lib/dividend-calendar.ts` with known upcoming dates, updated periodically
3. Eventually: fetch from an open dividend calendar API (Dividend.com, Quandl, etc.)

**UI:**
- Calendar view (monthly grid or list view)
- Blue and Green events color-coded
- Ex-date vs pay-date visually distinguished
- Filter by bucket

**Files to create:** `src/lib/dividend-calendar.ts`, `src/components/DividendCalendar.tsx`, `src/pages/WarRoom.tsx` (add tab or section)

---

## Priority 4 — Ex-Date / Pay-Date Truth Per Holding

**Problem:** Portfolio table shows holdings but does not surface upcoming ex-dates or pay dates for any held instrument.

**Fix:**
- After Priority 3 is complete, join dividend calendar data to portfolio holdings
- Add a column to the Portfolio Table: "Next Ex-Date" and "Next Pay Date"
- Highlight rows where ex-date is within 7 days (income incoming)

**Files:** `PortfolioTable.tsx`, `portfolio.ts`, `dividend-calendar.ts`

---

## Priority 5 — Dip History Log

**Problem:** Portfolio tracks latest dip date and DRiP amount per holding, but there is no historical dip log.

**Fix:**
- Extend `Holding` interface with `dipHistory: DipEvent[]`
- `DipEvent` = `{ date: string; price: number; shares: number; cost: number; notes: string }`
- Add a "Log Dip Buy" button per holding row that opens a form
- Dip history shown as a collapsible sub-row or modal per holding

**Files:** `portfolio.ts`, `PortfolioTable.tsx`, new `DipHistoryForm.tsx`

---

## Priority 6 — Mint DRiP Counter

**Problem:** No aggregate DRiP tracking across the portfolio.

**Fix:**
- Add a Mint panel (new section on Portfolio tab or its own tab)
- Shows per-bucket totals:
  - Total DRiP shares accumulated (sum of `dripAmount` per holding)
  - Total dividends reinvested
  - Projected next DRiP event per instrument (based on dividend calendar)
- Visual counter / progress bar per bucket

**Files:** New `src/components/MintPanel.tsx`, `WarRoom.tsx`

---

## Priority 7 — Payout History Per Instrument

**Problem:** No historical dividend payout data is shown for any instrument.

**Fix:**
- Fetch or curate dividend history per instrument
- Show a sparkline or table of last 8–12 payouts per instrument
- Highlight any cuts or increases

**Data source:**
- Yahoo Finance `/v8/finance/chart` with a longer range includes dividend events in the `events.dividends` field — parse these
- Or: Macrotrends data (manual scrape/curate for key tickers)

**Files:** `market.ts` (extend `fetchQuote` or add `fetchDividendHistory`), new `src/components/DividendHistory.tsx`

---

## Priority 8 — Publish-Ready Build

**Problem:** Currently Replit-dev-server only. Cannot be deployed as a static site or to a CDN.

**Fix:**
- Confirm `vite build` produces a clean dist with correct `BASE_URL`
- Add `preview` script to `package.json`
- Document deployment path (Netlify, Vercel, Replit Deploy)
- Test that localStorage portfolio survives a production build
- Remove `corsproxy.io` dependency if a backend proxy endpoint is built (Priority 2)

**Files:** `vite.config.ts`, `package.json`, `artifacts/wave-i/`

---

## Priority 9 — Push Back to Replit

When the above priorities are complete or reach a stable state:

1. `git push` from this repo to main
2. Replit will detect the push (if connected) or: manually import the repo as a new Replit
3. Run `pnpm install` in the Replit shell
4. Restart the `artifacts/wave-i: web` workflow
5. Confirm the preview at `/` shows the updated app

**Replit artifact path:** `artifacts/wave-i`
**Replit workflow:** `pnpm --filter @workspace/wave-i run dev`
**Preview path:** `/`

---

## Full Instrument Universe — Reference

These are already defined in `src/lib/instruments.ts`. No changes needed unless a new instrument is added.

**Blue (20):** ARCC, MAIN, ORCC, BXSL, GBDC, HTGC, FSK, PSEC, NMFC, GAIN, GLAD, CSWC, TPVG, BBDC, SLRC, OBDC, CGBD, PFLT, PNNT, FDUS

**Green (17):** AGNC, NLY, RITM, TWO, ORC, NYMT, MFA, DX, IVR, EARN, EFC, PMT, MITT, WMC, ARR, CIM, REM
