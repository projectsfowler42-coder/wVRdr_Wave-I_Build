# Wave-I — Current Build State

**As of:** 2026-04-09
**Replit artifact:** `artifacts/wave-i`
**Preview path:** `/` (port 24667)
**Stack:** React 18 + Vite + TypeScript + Tailwind + TanStack Query

---

## Pages / Views

| View | Status | Notes |
|---|---|---|
| War Room tab | ✅ Built | Default view. Contains all operator surfaces. |
| Portfolio tab | ✅ Built | Full CRUD holding tracker with live prices. |
| 404 / not-found | ✅ Built | Minimal fallback page. |

---

## Components Built

| Component | File | Status |
|---|---|---|
| App shell + routing | `src/App.tsx` | ✅ |
| Header with tab toggle | `src/components/Header.tsx` | ✅ |
| Market tape | `src/components/MarketTape.tsx` | ✅ |
| Bucket quote board | `src/components/BucketQuoteBoard.tsx` | ✅ |
| Quote card | `src/components/QuoteCard.tsx` | ✅ |
| Movement stats | `src/components/MovementStats.tsx` | ✅ |
| Calculators (3 tabs) | `src/components/Calculators.tsx` | ✅ |
| Research links | `src/components/ResearchLinks.tsx` | ✅ |
| Add holding form | `src/components/AddHoldingForm.tsx` | ✅ |
| Portfolio table | `src/components/PortfolioTable.tsx` | ✅ |

---

## Data: Real vs Mocked

| Data point | Source | Real? |
|---|---|---|
| Market tape prices | Yahoo Finance v8 chart API via corsproxy.io | ✅ Real, live |
| Quote price, change, day range, volume | Yahoo Finance v8 chart API via corsproxy.io | ✅ Real, live |
| After-hours / pre-market price | Yahoo Finance v8 (postMarket/preMarket meta) | ✅ Real when available |
| 52W range, avg volume, market cap | Yahoo Finance v7 quote API (via corsproxy.io) | ⚠️ Returns 401 in browser — shown as `—` when unavailable |
| Portfolio holdings | localStorage | ✅ Real (user-entered) |
| Dividend history | Not fetched | ❌ Not yet implemented |
| Ex-dates / pay-dates | Not fetched | ❌ Not yet implemented |

**No data is mocked or fabricated.** When data is unavailable, it displays `—`.

---

## Instrument Universe Support

### Blue Bucket (BDCs)
All 20 instruments are defined and selectable in the dropdown:

| Ticker | Name | Div Freq |
|---|---|---|
| ARCC | Ares Capital Corp | Quarterly |
| MAIN | Main Street Capital | Monthly |
| ORCC | Blue Owl Capital Corp | Quarterly |
| BXSL | Blackstone Secured Lending | Quarterly |
| GBDC | Golub Capital BDC | Quarterly |
| HTGC | Hercules Capital | Quarterly |
| FSK | FS KKR Capital Corp | Quarterly |
| PSEC | Prospect Capital Corp | Monthly |
| NMFC | New Mountain Finance | Quarterly |
| GAIN | Gladstone Investment | Monthly |
| GLAD | Gladstone Capital | Monthly |
| CSWC | Capital Southwest Corp | Quarterly |
| TPVG | TriplePoint Venture Growth | Quarterly |
| BBDC | Barings BDC | Quarterly |
| SLRC | SLR Investment Corp | Quarterly |
| OBDC | Blue Owl Capital Corp II | Quarterly |
| CGBD | Carlyle Secured Lending | Quarterly |
| PFLT | PennantPark Floating Rate | Monthly |
| PNNT | PennantPark Investment | Quarterly |
| FDUS | Fidus Investment Corp | Quarterly |

### Green Bucket (mREITs + ETFs)
All 17 instruments are defined and selectable:

| Ticker | Name | Type | Div Freq |
|---|---|---|---|
| AGNC | AGNC Investment Corp | mREIT | Monthly |
| NLY | Annaly Capital Management | mREIT | Quarterly |
| RITM | Rithm Capital Corp | mREIT | Quarterly |
| TWO | Two Harbors Investment | mREIT | Quarterly |
| ORC | Orchid Island Capital | mREIT | Monthly |
| NYMT | New York Mortgage Trust | mREIT | Quarterly |
| MFA | MFA Financial | mREIT | Quarterly |
| DX | Dynex Capital | mREIT | Quarterly |
| IVR | Invesco Mortgage Capital | mREIT | Quarterly |
| EARN | Ellington Residential Mortgage | mREIT | Monthly |
| EFC | Ellington Financial | mREIT | Monthly |
| PMT | PennyMac Mortgage Trust | mREIT | Quarterly |
| MITT | AG Mortgage Investment Trust | mREIT | Quarterly |
| WMC | Western Asset Mortgage Capital | mREIT | Quarterly |
| ARR | ARMOUR Residential REIT | mREIT | Monthly |
| CIM | Chimera Investment Corp | mREIT | Quarterly |
| REM | iShares Mortgage RE ETF | ETF | Monthly |

Live quote fetching works for **any ticker** via `fetchQuote(symbol)`. The dropdown drives which instrument is fetched per panel.

---

## Portfolio Tracker

| Feature | Status |
|---|---|
| Add holding (all fields) | ✅ Built |
| View holdings table | ✅ Built |
| Inline edit holding | ✅ Built |
| Delete holding | ✅ Built |
| Live current price per row | ✅ Built (via useQueries) |
| Computed cost basis | ✅ Built |
| Computed current value | ✅ Built |
| Unrealized G/L ($ and %) | ✅ Built |
| Dividends collected field | ✅ Built |
| Latest dip date field | ✅ Built |
| DRiP amount field | ✅ Built |
| Expected annual income field | ✅ Built |
| Notes field | ✅ Built |
| Sort by any column | ✅ Built |
| Filter by bucket | ✅ Built |
| Footer totals | ✅ Built |
| localStorage persistence | ✅ Built (`wavei_portfolio_v1`) |

---

## Dropdown Bucket Selectors

✅ **Yes, implemented.** Both the Blue and Green panels in the Quote Board have full-bucket instrument dropdowns. Changing the selection fetches a live quote for the chosen instrument immediately.

---

## Dividend Calendar

❌ **Not yet built.** No ex-date or pay-date data is fetched or displayed.

---

## Dip Date / DRiP / Mint Logic

| Feature | Status |
|---|---|
| Dip date field (manual, per holding) | ✅ Stored in portfolio |
| DRiP amount field (manual, per holding) | ✅ Stored in portfolio |
| DRiP Reinvestment Projector (calculator) | ✅ Built (deterministic, not live-connected) |
| Mint DRiP counter | ❌ Not yet built |
| Dip history log | ❌ Not yet built |
| Automatic dip detection | ❌ Not yet built |

---

## Known Gaps / Issues

| Issue | Impact | Notes |
|---|---|---|
| Yahoo v7 returns 401 in browser | 52W range, avg vol, market cap show `—` | v8 chart fills price/day range. v7 used as secondary; fails in browser without auth cookies. |
| Movement stats hardcoded to ARCC/AGNC | Shows movement for primary instruments only | Does not reflect quote board dropdown selection |
| No `.env.example` | Minor | No secrets needed — no template required |
| pnpm-lock.yaml is large | Minor | Normal for pnpm monorepo |
