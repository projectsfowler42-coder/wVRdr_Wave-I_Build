# Block‑1 Acceptance Checklist

Use this checklist to verify that the Block‑1 implementation meets the mandatory requirements. All items must be satisfied before the build can be declared complete.

## Data model

- [ ] Instruments are defined in a single registry with the fields described in `DATA_MODEL.md`. No scattered partial lists exist.
- [ ] Holding records include both `bucket_class` and `wallet_class` as distinct fields. There is no overloading of `bucket` or `wallet` names.
- [ ] Wallets are modelled as `|W|` (base) and `|M|` (mint) with the fields defined in `DATA_MODEL.md`.

## Quote board and instrument dropdowns

- [ ] The quote board populates its list from the canonical instrument registry and allows filtering by bucket (`[B]` / `[G]`) and by whether a position is held.
- [ ] Quote rows show live truth only: ticker, name, bucket, current price, change, change %, volume and research access. No simulated data or engine overlays are present.

## Portfolio tracker

- [ ] Operators can add, edit and delete holdings. Each holding requires assignment of a bucket class and optionally a wallet class.
- [ ] The portfolio table displays computed cost basis, current value, unrealised P&L ($ and %), dividends collected, latest dip date, DRiP amount and expected income. Numeric values are formatted consistently.
- [ ] Holdings persist across page reloads via `localStorage` under the key `wavei_portfolio_v2`.

## Wallet surfaces

- [ ] A dedicated wallet panel shows the state of `|W|` (cap, current balance, reserved, deployable, funding notes).
- [ ] A dedicated wallet panel shows the state of `|M|` (current balance, dividend inflows, DRiP inflows, drawdown capture inflows, deployable amount, pending inflows).
- [ ] Wallet records persist across page reloads via `localStorage` under the key `wavei_wallets_v1`.

## Link spine

- [ ] Instruments expose a list of research links per class with primary, backup 1 and backup 2 sources.
- [ ] Link health status is visible via coloured badges. Failover is handled transparently when a primary link is down.
- [ ] No hardcoded one-off links exist outside of the registry.

## War Room

- [ ] The War Room contains a tape, quote board, instrument detail panel, calculators, portfolio table, wallet summary and research links.
- [ ] The instrument detail panel reflects the ticker selected in the quote board rather than using hardcoded tickers.
- [ ] No engine overlays, regime labels or confidence indicators are present anywhere.

## Documentation

- [ ] `README.md` describes how to run the build and summarises the scope.
- [ ] `DATA_MODEL.md` specifies the instrument, holding and wallet shapes.
- [ ] `LINK_DOCTRINE.md` explains the link categories, data shape and failover rules.
- [ ] `CURRENT_STATE.md` and `NEXT_STEPS.md` reflect the actual system truth.

## Out of scope (confirmed absent)

- [ ] No predictive engine, macro-regime logic or confidence scoring exists.
- [ ] No synthetic dividend or payout history is fabricated.
- [ ] No features reserved for future waves are prematurely implemented.