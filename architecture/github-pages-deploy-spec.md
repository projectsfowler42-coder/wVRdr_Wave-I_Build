# Wave-I GitHub Pages Deploy Specification

## Intent

Wave-I is frontend-only and has a Vite build surface that supports a configurable base path and emits static files to `artifacts/wave-i/dist/public`.

## Static deploy target

- **Platform**: GitHub Pages
- **Artifact root**: `artifacts/wave-i/dist/public`
- **Base path rule**: `/${REPOSITORY_NAME}/`
- **Promotion class**: static release only

## Build assumptions

The Wave-I package provides:
- `pnpm --filter @workspace/wave-i build`
- `pnpm --filter @workspace/wave-i build:ghost`
- `BASE_PATH` environment override for Vite
- static output under `dist/public`

The repo root provides:
- `pnpm run typecheck`
- `pnpm run test:wave-i`
- `pnpm run release:validate`

## Release flow

1. install workspace dependencies
2. run workspace typecheck
3. run Wave-I tests
4. build `@workspace/wave-i`
5. generate Ghost Image metadata
6. validate Ghost release package
7. publish `artifacts/wave-i/dist/public` to Pages
8. run smoke check against deployed Pages URL
9. record release metadata

## Required deploy checks

- typecheck passes
- tests pass
- build completes
- static artifact directory exists
- Ghost Image metadata resolves
- rollback target resolves
- smoke check returns HTTP 200
- smoke check HTML contains `Wave-I`
- smoke check HTML references built assets

## Implemented workflow shape

The repository now includes a Pages deployment workflow on `main` and `workflow_dispatch` with:
- checkout
- pnpm setup
- Node setup
- `BASE_PATH=/${REPOSITORY_NAME}/`
- `pnpm install --frozen-lockfile`
- `pnpm run typecheck`
- `pnpm run test:wave-i`
- `pnpm --filter @workspace/wave-i run build:ghost`
- artifact/registry/release-package validation
- upload Pages artifact from `artifacts/wave-i/dist/public`
- deploy Pages artifact
- smoke check deployed Pages URL
- commit Ghost Image metadata back into `ghost/`

## Ghost Image expectation

Every stable Pages artifact should be paired with:
- artifact fingerprint
- dependency lock fingerprint
- contract version map
- schema version map
- restore manifest
- rollback predecessor
- proof manifest
