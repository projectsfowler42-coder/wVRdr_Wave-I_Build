# Link Doctrine — Block‑1

Wave‑I treats external research and data links as first-class infrastructure. Every instrument is associated with multiple link categories (live quotes, charts, issuer sites, filings, dividend info, payout history, research and fallback search). Block‑1 expects a simple, observable failover system so one broken link cannot kill the research surface.

## Link classes

For each instrument the following link classes are defined:

| Class | Purpose |
|---|---|
| `live_quote` | Direct quote page such as Yahoo or Google Finance. |
| `chart` | Price chart view. |
| `issuer_site` | Official investor-relations page. |
| `filings` | EDGAR company filings. |
| `dividend_info` | Dividend summary information. |
| `payout_history` | Historical payouts. |
| `research` | General analysis and research. |
| `fallback_search` | Search query if all other links fail. |

## Link entry structure

Each link entry should carry the following fields:

| Field | Type | Description |
|---|---|---|
| `instrument_id` | `string` | Ticker or internal identifier. |
| `link_class` | `string` | One of the classes above. |
| `source_name` | `string` | Human-readable source label. |
| `priority` | `0..2` | `0` = primary, `1` = backup 1, `2` = backup 2. |
| `url` | `string` | The destination URL. |
| `health_state` | `'healthy' \| 'degraded' \| 'down'` | Current health status. |
| `last_checked_at` | `string` | ISO timestamp of latest check. |
| `fail_count` | `number` | Consecutive observed failures. |
| `manual_override` | `boolean` | Operator override flag. |
| `replacement_notes` | `string` | Optional notes on replacements. |

## Failover behaviour

When a user opens a research link, the system should attempt the primary URL first, then fall back to backup 1 and backup 2 when necessary. The UI should visibly mark degraded states and never let a single dead link collapse the research surface.

## Observability

Link health should be monitorable. Block‑1 surfaces health state in the UI and preserves metadata for future automated monitoring.