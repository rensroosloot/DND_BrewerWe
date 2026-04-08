# Deployment and Domain Setup

## Hosting Model
The public site is deployed as a static GitHub Pages site from the `docs/` directory on the main branch.

## Repository Setup
1. Push the repository to GitHub.
2. Open `Settings -> Pages`.
3. Select `Deploy from a branch`.
4. Select branch `main`.
5. Select folder `/docs`.

## Publication Workflow

### Automated (recommended)
A GitHub Actions workflow (`.github/workflows/sync-kanka.yml`) runs daily at 06:00 UTC. It fetches Kanka data, builds the site, and commits any changed files automatically. It can also be triggered manually from the GitHub Actions tab.

Required GitHub repository secrets:
- `KANKA_TOKEN`
- `KANKA_CAMPAIGN_ID`
- `BREWERY_ORG_NAME`

The workflow requires **Read and write** permissions under Settings → Actions → General → Workflow permissions.

### Local one-command deploy
```bash
npm run deploy
```
Runs fetch + build, stages `docs/data` and `docs/assets/maps/previews`, commits if anything changed, and pushes to `main`.

### Manual step-by-step
1. Run the local fetch/build flow.
2. Review generated content in `docs/`.
3. Commit the updated static output.
4. Push to `main`.
5. Allow GitHub Pages to publish the new version.

### Release Checklist
- Verify that only player-safe records are public in Kanka before syncing.
- Review the diff of `docs/data/kanka-public.json` and derived JSON files.
- Check new outbound links and image URLs for unexpected domains or malformed values.
- Confirm that any newly added modules or fields are intended for public publication.

## Browser Security Baseline
Because GitHub Pages does not give this project application-level control over response headers, the site uses an in-document CSP baseline in the HTML entrypoints.

Current baseline:
- `default-src 'self'`
- `script-src 'self'`
- `img-src 'self' https: data:`
- `style-src 'self' 'unsafe-inline'`
- `connect-src 'self' https://roosloot.com` — `roosloot.com` is permitted for the brewery sync button proxy
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`

Notes:
- This is a static-site compromise; `style-src 'unsafe-inline'` remains enabled because the current pages rely on inline style attributes.
- `frame-ancestors` and report directives are not enforced through meta CSP, so if the project later moves off GitHub Pages, prefer real response headers at the edge.

## Custom Domain
Recommended approach: use a dedicated subdomain rather than an apex domain.

### GitHub Pages Side
1. Enter the chosen domain in the GitHub Pages custom domain setting.
2. Keep `docs/CNAME` in the repository with only that hostname.

### DNS Side
- For a subdomain, create a `CNAME` record pointing to the GitHub Pages host for the repository owner.
- For an apex domain, use the current GitHub Pages DNS guidance from GitHub documentation.

This document intentionally excludes provider-specific account values, hostnames, and zone details.

## Operational Boundaries
- Publish only player-safe content
- Keep private notes and local secrets outside `docs/`
- Do not document tokens, account identifiers, or internal security settings in public-facing project documents
