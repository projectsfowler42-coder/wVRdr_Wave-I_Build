# Wave-I

Wave-I is the truth-first operator surface for WaveRider.

This branch is locked to the **Pre-Wave-I Manual D3 Bridge** runtime contract.

## Bridge doctrine

- `[B]` and `[G]` are buckets.
- `|M|` is the D3 staging wallet.
- `MINT ETF` is ticker `MINT` and is not the `|M|` wallet.
- No bare `Mint` runtime label is allowed.
- `|W|` is deliberately excluded in this bridge mode.
- Operator-triggered refresh is allowed for selected bridge tickers only.
- `[Data Refresh]` fetches selected tickers and returns source, timestamp, truth class, and status.
- `[Harvest Data]` stores the latest already-refreshed state as an immutable local snapshot.
- Harvest must not fetch.
- No timers, no polling, no auto-fire, no hidden agent, and no broker execution.
- Missing required metrics block, degrade, watchlist, or mark the row unresolved. Missing data is not a sell signal.

## Runtime scope now mounted in repo

- `|M| D3 WALLET`
- `[B] BLUE`
- `[G] GREEN`

Bridge instruments:

- `[G]`: XFLT, SRLN, JBBB, BKLN
- `[B]`: JAAA, FLOT, MINT ETF

## What is now landed on GitHub

- Wave-I app under `artifacts/wave-i/`
- Pre-Wave-I Manual D3 bridge contract under `docs/pre-wave-i-manual-d3-bridge-contract.md`
- bridge constants and weighted allocation under `artifacts/wave-i/src/lib/bridge-mode.ts`
- bridge comparability gates under `artifacts/wave-i/src/lib/bridge-comparability.ts`
- bridge-only instrument DB under `artifacts/wave-i/src/data/`
- separated refresh and harvest controls in the runtime UI
- branch CI workflow under `.github/workflows/wave-i-ci.yml`

## Automated release proof

A valid automated proof run requires all of the following:

- workspace typecheck passes
- Wave-I tests pass
- Wave-I static build passes
- Pages artifact uploads and deploys where applicable
- deployed Pages site passes smoke check where applicable

Stable release proof is not just “build succeeded”. It is green workflow plus runtime behavior that matches the bridge contract.

## Current repo state

The repo now contains the bridge-mode implementation branch for PR validation. This is not personalised financial advice, tax advice, or a broker execution system.

## Remaining proof gates

1. Run the Wave-I CI workflow on this branch.
2. Fix any typecheck/test/build failures.
3. Confirm the deployed runtime shows no `|W|`, no bare `Mint`, separated `[Data Refresh]` and `[Harvest Data]`, bridge-only instruments, and visible blocking/degradation for missing comparable metrics.
