# Block-4B Runtime Notes

## What is working well
- The capital-first shell is live and no longer frozen on the old recovery homepage.
- Manual refresh now partially populates local quote snapshots.
- WHITE and MINT cards are proving that snapshot persistence and local replay are functioning.
- The richer holding model now exists locally with dates, bands, and decision-memory fields.
- Position telemetry already has slots for ex-window, pay-window, and trigger state.

## What is not working well
- Quote coverage is uneven. Some instruments refresh while others fail in the same pass.
- The quote path still depends on a brittle proxy-first remote fetch model.
- The market helper still contains stale legacy doctrine and hard-coded defaults that do not match the four-container build.
- The top capital summary could show false zeroes when quotes were missing. This patch fixes that behavior in the local working copy.
- The live shell is still visually dark-scaffold-first instead of light Control Panel first.

## Where the build should become more robust
- Treat missing quotes as unknown, never as zero.
- Separate quote-refresh failure from quote-display failure so old good snapshots remain trusted and visible.
- Add a coverage report by ticker after refresh: refreshed, reused-local, failed.
- Promote holding dates and action bands to required operator fields for income instruments where known.
- Make the portfolio surface the primary editor for ex-date, pay-date, add-band, trim-band, thesis, review date, and last action.

## Where the build should become more resilient
- Keep the last known good local quote visible when a refresh fails.
- Store a per-ticker refresh status instead of only a batch failure count.
- Add explicit stale markers such as: fresh, local-stale, never-loaded.
- Add schema validation around saved holdings so legacy payloads cannot silently erase newer fields.

## Where the build should become more redundant
- Keep both raw quote snapshots and normalized holding-context snapshots.
- Preserve prior successful snapshots before writing new partial refresh results.
- Add an operator export that includes holdings, local quotes, and derived telemetry together.

## Next runtime target
Wire owned holdings to consume the best available quote state by ticker:
1. fresh quote if available
2. last local good snapshot if refresh failed
3. cost-basis-only fallback if no quote exists

That turns the owned position into the primary consumer of refreshed market data instead of leaving it behind the supporting market cards.
