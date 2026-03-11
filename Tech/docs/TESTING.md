# Testing Setup

## Purpose
The project currently relies on build validation and manual verification rather than a dedicated automated test suite. This document defines the expected test flow so work stays repeatable.

## Current Test Layers

### 1. Script Execution Checks
Run the relevant scripts and confirm they complete without errors:
- `npm run kanka:fetch`
- `npm run site:build`
- `npm run obsidian:sync`
- `npm run kanka:sync:all`

Use the smallest command needed for the change being tested.

### 2. Generated Output Checks
After a build:
- Confirm `docs/data/*.json` files are updated as expected
- Confirm `docs/assets/maps/previews/` contains preview images for mapped locations
- Confirm no private or placeholder content appears in generated public files

### 3. Frontend Smoke Checks
Open the static site locally or through GitHub Pages and verify:
- Home page loads
- Brewery page loads
- Atlas page loads
- People page loads
- Map page loads and pin navigation works
- Chronicle page loads
- No obvious layout breakage occurs on desktop-width and mobile-width screens

### 4. Content Integrity Checks
- Verify counts and featured items make sense after data refresh
- Verify location summaries do not expose map metadata fields to players
- Verify manually maintained map pins are preserved when regeneration runs
- Verify character sync output creates readable NPC notes in the vault
- Verify that non-player-visible Kanka records do not appear in generated public files

## Regression Checklist
- New or changed page scripts still match the generated JSON structure
- Build scripts remain compatible with the current source file locations
- `docs/CNAME` still matches the intended public hostname
- GitHub Pages still serves the expected site entry point from `docs/`

## Recommended Near-Term Improvement
Add a lightweight automated smoke test layer for:
- JSON schema sanity checks
- broken file reference detection
- static page fetch/load checks

Until that exists, the manual checklist above is the project's official testing setup.
