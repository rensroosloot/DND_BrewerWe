# User Requirements Specification

## Purpose
Provide a player-safe website for the D&D campaign that publishes curated world information, brewery progress, maps, people, and chronicle entries.

## Project Scope Statement
The project uses Kanka as the main source of truth for shared, structured campaign data entered by players and maintainers. That data is reused to present the world in a cleaner way on the project's own website. The same public dataset is also used to generate an Obsidian vault mirror. In a later phase, selected player-safe information from the Obsidian vault may also be reused as an additional website input.

## Objectives
- Publish a readable campaign hub for players
- Use Kanka as the main shared content source
- Keep DM-only material outside the public site
- Use structured source data to reduce manual copy work
- Allow structured metadata in Kanka for enhanced site features such as map coordinates
- Generate an Obsidian vault from the same public dataset
- Keep deployment simple through GitHub Pages
- Support a custom domain for public access

## Stakeholders
- Dungeon Masters maintaining the campaign data
- Players consuming the public site
- Repository maintainers managing build and publication

## In Scope
- Kanka as the primary structured source of truth for public campaign data
- Static site pages under `docs/`
- Public data import from Kanka through local scripts
- Use of structured metadata fields in Kanka entries for website features
- Public content transforms into page-oriented JSON
- Generated Obsidian content from the public dataset
- Future reuse of selected Obsidian content for the website
- GitHub Pages deployment from the `docs/` folder

## Out of Scope
- User login or role-based access control
- Browser-side direct API access to Kanka
- Publishing DM-only notes
- Admin UI for content editing
- Live backend services

## User Requirements

### Players
- Players must be able to open the site without logging in.
- Players and maintainers must be able to enter shared public campaign data in Kanka.
- Players must be able to browse the home, brewery, atlas, people, map, and chronicle pages.
- Players must only see content marked as public.
- Players should be able to navigate between map pins and location summaries.
- Players should be able to view concise summaries before opening full details elsewhere.

### Maintainers
- Maintainers must be able to fetch public campaign data from Kanka with a local script.
- Maintainers must be able to store structured helper data in Kanka, such as map coordinates, when needed for site features.
- Maintainers must be able to generate page-specific JSON files for the static site.
- Maintainers must be able to generate an Obsidian vault view from the same public data.
- Maintainers must be able to publish the site via GitHub Pages from the repository.
- Maintainers should be able to keep editorial content separate from structured source data.
- Maintainers should be able to evolve the website later to consume selected player-safe Obsidian content.
- Maintainers should be able to use a custom domain without changing application code.

## Non-Functional Requirements
- The site must work as a static website hosted on GitHub Pages.
- Public pages must load without a backend runtime.
- Secrets must not be embedded in browser JavaScript or committed documentation.
- Generated data files must be deterministic from the same input set.
- Structured helper metadata stored in Kanka must remain usable by the build pipeline.
- Kanka visibility settings must remain the primary content boundary for what may appear in generated public outputs.
- The setup should remain understandable for future rotating DMs.

## Success Criteria
- Public campaign data is available in generated JSON files under `docs/data/`.
- Public campaign data can be entered once in Kanka and reused in both website and Obsidian outputs.
- The site renders successfully from the generated static assets.
- The repository contains enough documentation to continue the project without relying on memory.
