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
1. Run the local fetch/build flow.
2. Review generated content in `docs/`.
3. Commit the updated static output.
4. Push to `main`.
5. Allow GitHub Pages to publish the new version.

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
