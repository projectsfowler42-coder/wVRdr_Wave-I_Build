# Wave-I GitHub Pages Deploy Specification

## Intent

Wave-I is frontend-only and already has a Vite build surface that supports a configurable base path and emits static files to `artifacts/wave-i/dist/public`.

## Static deploy target

- **Platform**: GitHub Pages
- **Artifact root**: `artifacts/wave-i/dist/public`
- **Base path rule**: `/${REPOSITORY_NAME}/`
- **Promotion class**: static release only

## Build assumptions

The Wave-I package provides:
- `pnpm --filter @workspace/wave-i build`
- `BASE_PATH` environment override for Vite
- static output under `dist/public`

## Release flow

1. install workspace dependencies
2. run workspace typecheck
3. build `@workspace/wave-i`
4. publish `artifacts/wave-i/dist/public` to Pages
5. record release metadata
6. record Ghost Image metadata for the stable artifact

## Required deploy checks

- typecheck passes
- build completes
- static artifact directory exists
- release metadata resolves
- rollback target resolves

## Required Pages workflow shape

The repository should run a Pages deployment workflow on `main` and `workflow_dispatch` with:
- checkout
- pnpm setup
- Node setup
- `BASE_PATH=/${REPOSITORY_NAME}/`
- `pnpm install --frozen-lockfile`
- `pnpm run typecheck`
- `pnpm --filter @workspace/wave-i build`
- upload Pages artifact from `artifacts/wave-i/dist/public`
- deploy Pages artifact

## Ghost Image expectation

Every stable Pages artifact should be paired with:
- artifact fingerprint
- dependency lock fingerprint
- contract version map
- schema version map
- restore manifest
- rollback predecessor

## Note

This document exists because the direct workflow-file write path was tool-blocked during repo operations. The deploy path itself is still the intended canonical path for Wave-I static release.
