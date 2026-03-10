# GitHub Pages Setup

This repo is prepared to publish a static site from the `docs/` folder on the `main` branch.

## GitHub setup
1. Create the GitHub repository.
2. Push this repo to GitHub.
3. In GitHub, open `Settings -> Pages`.
4. Set:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`

## Custom domain
Recommended: use a subdomain such as `dnd.yourdomain.com`.

1. In GitHub Pages settings, enter your custom domain.
2. GitHub will create or expect a `CNAME` file in `docs/`.
3. Replace `docs/CNAME.example` with `docs/CNAME` containing only your real domain.

## DNS
For a subdomain:
- Create a `CNAME` record from `dnd` to `<your-github-username>.github.io`

For a root domain:
- Use GitHub Pages apex `A` records from the current GitHub docs instead of a CNAME
- Root domains are more fragile than a subdomain, so a subdomain is preferred

## Important
- Publish only player-safe content
- Do not expose `DND/90_DM Only`

