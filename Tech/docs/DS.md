# Design Specification

## Design Overview
The solution is a static website backed by generated JSON files. Structured campaign data is maintained in Kanka as the primary shared source of truth, transformed locally into view models, and served from the `docs/` directory through GitHub Pages. The same public dataset also drives a generated Obsidian mirror.

## Architectural Style
- Static frontend
- Local build pipeline
- File-based data exchange
- No public runtime backend

## Source-of-Truth Model
- Kanka: primary structured source of truth for shared public campaign data
- `DND/09_Public/`: curated player-safe notes and editorial content
- generated Obsidian content: mirror of public structured data, with possible future reuse as a secondary website source
- `Tech/`: scripts that fetch, transform, and sync data
- `docs/`: published output

## Scope Boundaries
- Kanka is the canonical source for shared structured campaign data.
- The website is a presentation layer and should not become the primary editing surface.
- Obsidian is currently a generated mirror for campaign maintenance and reference.
- Future website features may consume selected player-safe Obsidian content, but that does not replace Kanka as the primary structured source.

## High-Level Flow
1. Fetch public campaign entities from Kanka.
2. Include structured helper metadata stored in Kanka records, such as map coordinates encoded in player-safe fields.
3. Save raw module exports for local processing.
4. Filter and normalize records into `docs/data/kanka-public.json`.
5. Transform that data into page-specific JSON files.
6. Generate map preview images.
7. Generate the Obsidian mirror from the same public dataset.
8. Serve the static site from `docs/`.

## Component Design

### Frontend
- HTML pages in `docs/`
- Page scripts in `docs/*.js`
- Shared styling in `docs/style.css`
- Static data in `docs/data/*.json`

### Build Scripts
- `Tech/fetch-kanka.mjs`: fetches and normalizes public Kanka data
- `Tech/build-site-data.mjs`: builds page-specific JSON and map pin output
- `Tech/generate-map-previews.py`: generates cropped map previews
- `Tech/sync-obsidian.mjs`: writes public character notes into the Obsidian vault

### Metadata Strategy
- Kanka records may include structured helper fields embedded in public text when needed by the build pipeline.
- A current example is map coordinate metadata used to place markers on the custom map page.
- The build layer is responsible for extracting that metadata and removing it from player-facing summaries where appropriate.

### Visibility Boundary
- Kanka visibility settings define what is considered publishable through the integration.
- The fetch layer only works with records that are available to player-safe API access.
- The website must treat Kanka visibility as the first publication filter, with additional local filtering only as a secondary safeguard.

### Data Storage
- `Tech/data/raw/`: raw fetched source data, local processing only
- `docs/data/`: public generated site data
- `docs/assets/maps/previews/`: generated preview images

## Deployment Design
- Repository branch publishes `docs/` through GitHub Pages
- Custom domain is mapped at the Pages layer using `docs/CNAME`
- No application code changes are required for domain binding

## Security-by-Design Constraints
- Tokens remain local and outside the static frontend
- Browser code reads generated JSON only
- Private Kanka records are filtered out before publication
- Generated website content must stay within the same player-visible boundary exposed by Kanka
- Security-sensitive operational details are intentionally omitted from this design document

## Design Assumptions
- GitHub Pages remains the hosting platform
- Kanka remains the structured public source
- Players and maintainers keep entering shared public data in Kanka
- Obsidian remains aligned with the public Kanka-derived dataset
- Maintainers run build scripts locally before publishing
