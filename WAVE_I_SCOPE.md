# Wave-I — Scope Definition

This document is the authoritative scope boundary for Wave-I. Anything outside this scope does not belong in Wave-I.

---

## What Wave-I Is

Wave-I is a **truth-first, plain-UI operator dashboard** for two specific investment buckets:

- **Blue Bucket** — Business Development Companies (BDCs)
- **Green Bucket** — Mortgage REITs (mREITs) and mREIT-adjacent ETFs

Wave-I is a focused operator tool. It is not a general stock screener, not a portfolio management platform, and not a regime-analysis dashboard. Every feature either helps the operator track income, assess entry points, or understand the current position in these two buckets.

---

## Buckets

### Blue Bucket — BDC Universe

Primary instrument: **ARCC** (Ares Capital Corp)

Full universe (20 instruments):
ARCC, MAIN, ORCC, BXSL, GBDC, HTGC, FSK, PSEC, NMFC, GAIN, GLAD, CSWC, TPVG, BBDC, SLRC, OBDC, CGBD, PFLT, PNNT, FDUS

All quarterly dividend unless noted. Monthly: MAIN, PSEC, GAIN, GLAD, PFLT.

### Green Bucket — mREIT Universe

Primary instrument: **AGNC** (AGNC Investment Corp)

Full universe (17 instruments):
AGNC, NLY, RITM, TWO, ORC, NYMT, MFA, DX, IVR, EARN, EFC, PMT, MITT, WMC, ARR, CIM, REM

Monthly: AGNC, ORC, EARN, EFC, ARR, REM. Quarterly: NLY, RITM, TWO, NYMT, MFA, DX, IVR, PMT, MITT, WMC, CIM.

---

## Design Philosophy

**Truth-first**: All market data is live. No mocked data in production features. If data is unavailable, it is shown as `—`, never fabricated.

**Plain and usable**: Dark theme, monospace numbers, no decorative chrome. Operator surface, not a marketing page.

**No old regime logic**: WaveRider's regime classification, sector rotation logic, and macro overlay are not part of Wave-I and must not be imported or reimplemented.

**No backend required**: Wave-I is a fully static frontend. Market data is fetched client-side via Yahoo Finance + CORS proxy. Portfolio data is stored in localStorage.

---

## War Room Page

The War Room is the primary view. It contains:

### Live Market Tape
- Scrolling ticker tape at the top of every view
- 17 symbols covering macro (SPY, QQQ, IWM, TLT, HYG, XLF) and key BDC/mREIT names
- Auto-refreshes every 90 seconds

### Quote Board
- Two panels: Blue and Green
- Each panel has a full-bucket instrument dropdown
- Fetches live quote data for the selected instrument
- Shows: price, change, change %, after-hours price (when available), prev close, open, day range, 52W range, volume, avg volume, market cap

### After-Hours Numbers
- After-hours and pre-market prices shown automatically when Yahoo returns postMarket/preMarket data
- Labeled with session type and color-coded

### Movement Numbers
- Day range position (bar + %)
- 52W range position (bar + %)
- Distance from 52W low and 52W high
- Shown for both primary instruments (ARCC / AGNC)

### Research Links
- Categorized external links per bucket
- Categories: SEC filings, analysis, news, data, dividend
- Static. Always visible. Open in new tab.

### Deterministic Calculators
Three calculators, all purely deterministic (no random/simulated data):

1. **Yield Calculator** — Given shares and dividend per period, computes annual income, yield on price, combined income for both buckets
2. **Dip Target Calculator** — Given a dip % and buy budget, shows what price that dip would hit and how many shares the budget buys
3. **DRiP Reinvestment Projector** — Given current shares and dividend rate, projects share accumulation and dividend reinvested over N months (quarterly for Blue, monthly for Green)

---

## Portfolio Tracker

The portfolio tracker is the second tab. It is a full CRUD holding tracker.

### Holding fields (per position):
- Bucket (BLUE / GREEN)
- Ticker (dropdown filtered to bucket)
- Shares (supports fractional)
- Entry date
- Entry price
- Dividend collected ($)
- Latest dip date
- DRiP amount ($)
- Expected annual income ($)
- Notes (free text)

### Computed fields (auto from live price):
- Cost basis (shares × entry price)
- Current value (shares × current price)
- Unrealized G/L ($)
- Unrealized G/L (%)

### Table features:
- Sort by any column
- Filter by bucket (ALL / BLUE / GREEN)
- Inline edit
- Delete with confirm
- Footer totals (cost basis, dividends collected, expected income)

### Persistence:
- localStorage key: `wavei_portfolio_v1`
- Survives page reload, no backend required

---

## Future Features (In Scope — Not Yet Built)

These are confirmed in-scope for Wave-I and will be built in phases:

### Dividend Calendar
- Ex-dates and pay dates for all instruments in both buckets
- Visual calendar view
- Truth-sourced (not estimated)

### Ex-Date / Pay-Date Truth
- Per-instrument ex-date and pay-date tracking
- Upcoming dividend alert indicator

### Dip History
- Log of dip buy events per holding
- Date, price, shares purchased, cost

### Mint DRiP Counter
- Track total DRiP shares accumulated across all holdings in each bucket
- Visual counter / progress

### Payout History
- Per-instrument dividend payout history
- Trend visualization

---

## Out of Scope for Wave-I

- Any instrument outside Blue or Green buckets
- General equities, ETFs not listed in Green universe
- Macro regime classification
- Sector rotation logic
- Options, futures, bonds (other than HYG/TLT on the tape as macro context)
- Social/news feeds
- AI/ML price predictions
- Authentication or multi-user support
