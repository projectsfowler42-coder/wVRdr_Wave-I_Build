# Pre-Wave-I Manual D3 Bridge Runtime Contract

This file converts the revised bridge paper into implementation gates. The app may not imply a capability unless the runtime performs it or blocks/degrades it with a visible truth-labelled reason.

## Authority

Source: `WaveRider Pre-Wave-I Manual D3 Bridge Paper - Revised`.

## Operating mode

Wave-I is not yet trusted as a runtime system. This bridge mode is operator-triggered, manual, auditable, and USD-denominated.

Required behavior:

- No timers.
- No polling.
- No automatic execution.
- No hidden agent.
- No broker execution.
- No secret fetch during harvest.

## Naming law

- `MINT ETF` means ticker `MINT`.
- `|M|` means D3 staging wallet.
- `MINT ETF` and `|M|` are different object classes.
- No bare `Mint` runtime label is allowed.
- `|W|` is excluded from this manual bridge paper.

## Bridge capital map

| Sleeve | Amount | Rule |
|---|---:|---|
| `|M|` | `$5,000` | fixed bridge preload |
| `[G]` | `$32,500` | 65% of `$50,000` deployable capital |
| `[B]` | `$17,500` | 35% of `$50,000` deployable capital |

Total capital is `$55,000`; deployable capital is `$50,000` after the `|M|` preload.

## Bridge instrument set

### `[G]` Green income bucket

| Ticker | Amount | Weight | Role |
|---|---:|---:|---|
| XFLT | `$13,000` | 40% | high-output D3 accelerator |
| SRLN | `$8,125` | 25% | senior-loan ballast |
| JBBB | `$6,500` | 20% | CLO debt income |
| BKLN | `$4,875` | 15% | senior-loan anchor |

### `[B]` Blue ballast / safer carry bucket

| Ticker | Amount | Weight | Role |
|---|---:|---:|---|
| JAAA | `$8,750` | 50% | AAA CLO anchor |
| FLOT | `$5,250` | 30% | IG floater ballast |
| MINT ETF | `$3,500` | 20% | short-duration cash proxy |

## Runtime actions

### `[Data Refresh]`

Must:

- Fetch selected tickers only.
- Return source label, observed timestamp, truth class, and row status.
- Never run through timers, polling, hidden agents, or page-load side effects.

### `[Harvest Data]`

Must:

- Store the latest already-refreshed state as an immutable snapshot.
- Never fetch.
- Refuse if there is no refreshed state to snapshot.

### `[Refresh + Harvest]`

Optional, but only valid if explicitly labelled as combined fetch-plus-store behavior.

## Comparable-number gate

Every bridge row must either show or visibly block/degrade these groups:

- Identity: ticker, name, container, instrument type, issuer, expense ratio, distribution frequency.
- Market: price, previous close, change %, bid, ask, spread %, volume, 30-day average volume, timestamp.
- Income: selected yield %, yield type, last distribution, monthly income per `$1,000`, annual income per `$1,000`, ex-date, pay-date.
- NAV / valuation: NAV, premium/discount %, NAV distribution rate, price distribution rate, leverage % where required.
- Risk path: 1-month return, 3-month return, 12-month return, 1-year max drawdown, 90-day volatility, downside deviation.
- Position: shares, cost basis, market value, allocation %, unrealized $, unrealized %, yield on cost, current yield.
- Truth: source label, observed timestamp, truth class, stale/degraded/failed status.

If a required metric is missing, the row is not comparable. The row must become blocked, watchlisted, degraded, or unresolved. Missing data is not a sell signal.

## XFLT special gate

XFLT may not be treated as valid unless all of the following are present or explicitly unresolved:

- current price,
- NAV,
- premium/discount,
- latest distribution,
- distribution trend,
- leverage,
- next ex-date,
- next pay-date,
- liquidity status,
- thesis survival status.

## D3 behavior

- Distributions from `[B]` and `[G]` flow as cash into `|M|`.
- Broker auto-DRIP must remain off if `|M|` is required.
- `|M|` is used for manual D3 purchases.
- Weekly execution is a manual rhythm, not a claim that every issuer pays weekly.

## Current main conflicts to fix

- `README.md` still declares no backend/no runtime API dependence, while the revised paper requires an operator-triggered minimal backend.
- `|W| WHITE` remains active, but the paper excludes `|W|`.
- `|M| MINT` label confuses the wallet with ticker `MINT`.
- Current instrument DB contains instruments outside this bridge paper.
- Current header exposes only `[Data Refresh]`, backed by a combined refresh/report path.
- There is no independent `[Harvest Data]` immutable snapshot action.
- Current market model lacks first-class NAV, bid/ask spread, distribution trend, leverage, risk path, and XFLT gate status fields.

## Completion rule

This contract is satisfied only when the app either implements each runtime claim or visibly blocks/degrades the claim with a source-labelled reason.
