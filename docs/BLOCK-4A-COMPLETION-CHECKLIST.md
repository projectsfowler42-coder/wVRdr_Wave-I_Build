# Block-4A Completion Checklist

This file exists to make Block-4A completion explicit inside the repo and to provide a deterministic `main` commit that triggers the release-proof workflow.

## Block-4A is complete when
- Wave-I runtime remains scoped to `|W| WHITE`, `|M| MINT`, `[B] BLUE`, `[G] GREEN`
- broader WaveRider doctrine is quarantined out of active Wave-I runtime
- release-proof automation exists on `main`
- the release-proof workflow runs successfully on `main`
- Ghost Image artifacts are generated and committed
- GitHub Pages deploy succeeds
- the deployed site reflects only active Wave-I scope

## Exclusions
The following are not active Wave-I runtime authority for Block-4A completion:
- broader WaveRider doctrine panels
- dormant classes such as `[S] SILVER`, `|Y| YELLOW`, `|P| PURPLE`
- backend engines or API-dependent control layers

## Practical closeout
After a successful workflow run, verify:
- `ghost/registry.json`
- `ghost/releases/<release>/ghost-image.json`
- `ghost/releases/<release>/module-map.json`
- `ghost/releases/<release>/checksums.json`
- `ghost/releases/<release>/restore-manifest.json`
- `ghost/releases/<release>/proof.json`
- live Pages deployment loads and smoke checks pass
