# Changelog

## 2026-04-08

### Automated Kanka sync
- Added `.github/workflows/sync-kanka.yml`: runs `kanka:sync` daily at 06:00 UTC and commits any changed data files automatically.
- Added manual "Run workflow" trigger so sync can be kicked off from the GitHub Actions UI at any time.
- Added `npm run deploy` (`scripts/sync.sh`) for local one-command sync + commit + push.

### Sync button on brewery page
- Added "Synchroniseer met Kanka" button to the brewery hero section.
- Button calls a PHP proxy on `roosloot.com/api/brewery-sync.php` which triggers the GitHub Actions workflow via the GitHub API.
- The GitHub PAT lives server-side in the PHP file on Plesk; it is never committed to the repository.
- Updated `connect-src` in the brewery CSP to allow outbound fetch to `roosloot.com`.
- Verified the manual sync flow end to end from `brewery.html`; fixed a production 404 caused by `/Api/` vs `/api/` path casing.

### Code review fixes
- Fixed SVG chart tooltip: moved `<title>` inside `<circle>` so hover labels work.
- Removed duplicate `escapeHtml` from `brewery.js`; now imported from `site.js` (which also escapes single quotes).
- Removed unused `renderCard` import and unused `absence` parameter.
- Added `escapeHtml` to `renderRuleCard` (was rendering raw strings).
- Removed 8 hidden `<input>` elements from the resolution calculator; plan values are now read directly from the `plan` object passed as a parameter.
- Removed `const netGp = grossGp` alias; `grossGp` is used directly.
- Removed duplicate `slugify`; exported from `map-pin-schema.mjs` and imported in `build-site-data.mjs`.
- Removed dead `planned_absence_weeks` field from `BREWERY_PLAN_FIELDS` (was never written by the planner).
- Fixed fragile brewery org detection: now reads `BREWERY_ORG_NAME` from environment; logs a warning instead of silently falling back to the first organisation.
- Added env file loading to `build-site-data.mjs` so it reads `Tech/.env.local` like the other scripts.
- Added `BREWERY_ORG_NAME` to `Tech/.env.local` and `Tech/.env.example`.
- Added `scripts/brewery-sync.php` to `.gitignore` to prevent accidental token commits.
