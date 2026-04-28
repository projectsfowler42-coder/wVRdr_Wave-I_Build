# Wave-I S22 Ultra Runbook

Target runtime: Samsung S22 Ultra / Android Chrome / installable PWA.

Target app path:

```text
artifacts/wave-i/
```

Wave-I is a truth cockpit. It is not a trading app, not a strategy engine, and not a buy/sell signal surface.

## Build proof

Run from the repository root:

```bash
pnpm install
pnpm --filter @workspace/wave-i typecheck
pnpm --filter @workspace/wave-i build
```

Fallback if workspace filtering fails:

```bash
cd artifacts/wave-i
pnpm install
pnpm typecheck
pnpm build
```

## Phone install proof

1. Open the deployed Wave-I URL in Chrome on the S22 Ultra.
2. Confirm the app opens without JSON import.
3. Confirm the main cockpit has seven active cells only:
   - Header
   - IBKR
   - Instrument
   - Funding
   - Reserves
   - Proof
   - Actions
4. Use Chrome menu → Add to Home Screen / Install app.
5. Launch from the home-screen icon.
6. Confirm standalone display mode through Actions → MDK SELF TEST.

## Manual S22 test protocol

### 1. No-connector refresh

Action:

```text
REFRESH
```

Expected:

```text
ACTION: DATA REFRESH
STATUS: NO CONNECTOR
MESSAGE: NO VERIFIED LIVE SOURCE ATTACHED. LOCAL DATA REFRESHED. READINESS UNCHANGED.
LOCAL: Australia/Sydney timestamp
UTC: UTC timestamp
```

No fake price may appear.
No manual/seed value may become LIVE.

### 2. WAL scrape

Action:

```text
SCRAPE
```

Expected:

- WAL count increments.
- Proof page shows the new record count.
- If IndexedDB is blocked, app falls back to MEMORY WAL and reports that state.

### 3. Proof export

Action:

```text
PROOF → EXPORT JSON
PROOF → EXPORT CSV
```

Expected:

- Export file downloads or the Android save/share prompt appears.
- If there are no records, Action Status shows NO RECORD with timestamp.

### 4. Instrument selector

Action:

```text
INSTRUMENT → [B] / [G]
```

Expected:

- [G] defaults to BKLN.
- BKLN shows 97 shares.
- Non-BKLN instruments show VERIFY / none tracked.
- No trade recommendation appears.

### 5. IBKR readiness

Action:

```text
IBKR → set one item OK
```

Expected:

- Readiness changes from —/11 to 1/11.
- UNKNOWN rows do not count.
- NO rows display NO but do not count as ready.
- App must never start at fake 0/11 or fake READY.

### 6. Reset seed

Action:

```text
RESET
```

Expected:

- Selected bucket returns to [G].
- Selected instrument returns to BKLN.
- Quote returns to VERIFY/DEGRADED unless real data is fetched.
- IBKR checklist returns to UNKNOWN / —/11.
- WAL records are preserved.

### 7. MDK self-test

Action:

```text
ACTIONS → MDK SELF TEST
```

Expected probes:

- Viewport
- Service worker availability
- IndexedDB availability
- Thin Spine connector status
- Standalone display mode

WARN is acceptable for no API_BASE_URL before the Thin Spine is connected.
FAIL requires repair or explicit quarantine.

## Fail-closed doctrine

- No API_BASE_URL → NO CONNECTOR.
- Source error → FAILED.
- Timeout → FAILED.
- Storage blocked → MEMORY WAL / DEGRADED, never LIVE.
- Unknown IBKR state → UNKNOWN, not NO.
- Manual values → DEGRADED, never LIVE.
- Seed values → DEGRADED, never LIVE.
- Imported values → DEGRADED unless verified by live source.

## Thin Spine contract

If API_BASE_URL is set, REFRESH calls:

```text
${API_BASE_URL}/api/market/quotes?tickers=${selectedInstrument.ticker}
```

Expected response:

```json
{
  "quotes": [
    {
      "ticker": "BKLN",
      "name": "Invesco Senior Loan ETF",
      "price": 0,
      "previousClose": 0,
      "change": 0,
      "changePct": 0,
      "extendedPrice": null,
      "extendedChangePct": null,
      "marketState": "REGULAR",
      "trailingYieldPct": null,
      "fiftyTwoWeekHigh": 0,
      "fiftyTwoWeekLow": 0,
      "volume": 0,
      "currency": "USD",
      "source": "live",
      "staleSecs": 0,
      "ts": 0
    }
  ],
  "count": 1,
  "updatedAt": "ISO timestamp"
}
```

Truth mapping:

```text
live -> LIVE
stale -> STALE
fallback -> DEGRADED
failed/error -> FAILED
```

## Do not add

- Buy buttons
- Sell buttons
- Trading recommendations
- Price triggers
- Dividend calendar
- DRiP optimizer
- Wave-II engines
- Sim to Win
- Prop-firm optimizer
- Options engine

## Release gate

Wave-I S22 PWA is not considered ready until:

```text
pnpm --filter @workspace/wave-i typecheck = PASS
pnpm --filter @workspace/wave-i build = PASS
S22 manual protocol = PASS or quarantined
MDK SELF TEST = no unhandled FAIL
```

## Deployment trigger log

- 2026-04-28: GitHub Pages source switched to GitHub Actions. Triggered Block-5 deploy rerun.
