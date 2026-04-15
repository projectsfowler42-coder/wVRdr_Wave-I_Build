# Data Model — Block‑1

This document defines the canonical data shapes for Wave‑I Block‑1. All persisted data should conform to these definitions.

## Instrument

Instruments represent tradable vehicles in the Blue and Green buckets.

| Field | Type | Description |
|---|---|---|
| `instrument_id` | `string` | Internal unique identifier. |
| `ticker` | `string` | Public trading symbol. |
| `name` | `string` | Human-readable instrument name. |
| `bucket_class` | `"[B]" \| "[G]"` | Bucket classification. |
| `instrument_type` | `string` | Such as `BDC`, `mREIT`, `ETF`. |
| `payout_frequency` | `"monthly" \| "quarterly" \| "special"` | Dividend cadence when known. |
| `yield_type` | `string` | Yield classification. |
| `exchange` | `string` | Primary listing exchange. |
| `enabled` | `boolean` | Whether the instrument is selectable. |
| `notes` | `string` | Optional notes. |

## Holding

Holdings represent user-entered positions and must explicitly separate bucket and wallet classes.

| Field | Type | Description |
|---|---|---|
| `holding_id` | `string` | UUID assigned at creation. |
| `ticker` | `string` | Instrument symbol. |
| `instrument_name` | `string` | Redundant display name. |
| `bucket_class` | `"[B]" \| "[G]"` | Instrument bucket. |
| `wallet_class` | `"|W|" \| "|M|" \| null` | Funding wallet, or null. |
| `shares` | `number` | Share count, including fractional shares. |
| `entry_date` | `string` | ISO entry date. |
| `entry_price` | `number` | Entry price per share. |
| `current_price` | `number \| null` | Live market price. |
| `current_value` | `number \| null` | `shares × current_price`. |
| `cost_basis` | `number` | `shares × entry_price`. |
| `unrealized_pnl` | `number \| null` | `current_value − cost_basis`. |
| `unrealized_pnl_pct` | `number \| null` | `(unrealized_pnl / cost_basis) × 100`. |
| `dividends_collected` | `number` | Cash dividends collected. |
| `latest_dip_date` | `string` | Most recent dip-buy date. |
| `drip_amount` | `number` | DRiP amount. |
| `expected_income` | `number` | Expected annual income. |
| `notes` | `string` | Operator notes. |
| `created_at` | `string` | ISO timestamp created. |
| `updated_at` | `string` | ISO timestamp last updated. |

## Wallets

Wallets hold cash. They are independent from buckets.

### `|W|` — Base Wallet

| Field | Type | Description |
|---|---|---|
| `wallet_id` | `string` | Unique wallet identifier. |
| `wallet_class` | `"|W|"` | Base wallet constant. |
| `cap` | `number` | Fixed wallet cap. |
| `current_balance` | `number` | Current cash balance. |
| `reserved_amount` | `number` | Cash reserved for orders or commitments. |
| `deployable_amount` | `number` | Readily deployable amount. |
| `funding_source_notes` | `string` | Notes about source of funds. |
| `updated_at` | `string` | ISO timestamp. |

### `|M|` — Mint Wallet

| Field | Type | Description |
|---|---|---|
| `wallet_id` | `string` | Unique wallet identifier. |
| `wallet_class` | `"|M|"` | Mint wallet constant. |
| `current_balance` | `number` | Current cash balance. |
| `dividend_inflows` | `number` | Dividend cash received. |
| `drip_inflows` | `number` | Reinvestment inflows. |
| `drawdown_capture_inflows` | `number` | Dip-capture inflows. |
| `deployable_amount` | `number` | Amount available to redeploy. |
| `pending_inflows` | `number` | Declared but not yet credited inflows. |
| `updated_at` | `string` | ISO timestamp. |

## Link Registry

The link spine associates each instrument with multiple resource categories and primary/backup sources. See `LINK_DOCTRINE.md`.