# Current State — Block-2

Completed on this branch:
- doctrine synthesis and Block-2 docs
- canonical truth/source types
- harvest single-flight and dedupe scaffolding
- quarantine schema/store scaffolding
- local storage and IndexedDB helpers
- import/export helpers
- first-pass harvest, provenance, and quarantine UI pieces
- static-friendly Vite config added alongside the current config

Still legacy or incomplete:
- top-level canonical docs were legacy and required replacement
- canonical vite.config.ts is still Replit-coupled
- live shell is not yet wired to the new bucket/wallet semantics
- [Harvest Data] is not yet wired into the live shell
- provenance/conflict/quarantine visibility is not yet fully wired
- tests are not yet in place

Conclusion:
This branch contains the Block-2 foundation, but it is not merge-ready until the remaining blockers are closed.
