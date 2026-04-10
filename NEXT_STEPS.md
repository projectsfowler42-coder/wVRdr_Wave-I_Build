# Wave-I — Next Steps

Ordered Block-2 queue for this branch.

1. replace canonical `vite.config.ts` with the static-friendly frontend-safe equivalent while keeping Vite
2. wire [B] / [G] bucket semantics and |W| / |M| wallet semantics into the live holdings model and UI
3. wire [Harvest Data] into the live shell using the local-only Block-2 harvest controller
4. wire provenance, quarantine, and conflict visibility into the live shell
5. add container-aware instrument gating for selection flows
6. add a test runner and the first real Block-2 test suite
7. verify the static/local run path on a frontend-only build
8. close remaining legacy debt before removing draft status from PR #3
