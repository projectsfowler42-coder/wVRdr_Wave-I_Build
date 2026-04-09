# Block-2 Local Frontend Run

This branch includes a static-friendly Vite config for Wave-I frontend-only work:

- `artifacts/wave-i/vite.static.config.ts`

## Purpose

This config exists so Block-2 can be run without Replit-coupled assumptions such as required runtime-only environment variables or Replit-only development plugins.

## Properties

- Vite remains the frontend build tool
- no backend required
- no remote persistence required
- default port fallback: `5173`
- default base fallback: `./`
- no Replit-only Vite plugins

## Intended use

Use the static-friendly config when validating the frontend-only / phone-safe / local-only Block-2 path.

## Current blocker status

This file does **not** replace the existing `vite.config.ts` yet.
That replacement is still a remaining blocker because the canonical config on this branch still contains Replit-coupled assumptions.

## Block-2 standard

The honest target state is:
- keep Vite
- remove Replit-coupled assumptions from the canonical Wave-I frontend config
- preserve static deploy compatibility
- preserve frontend-only operation
