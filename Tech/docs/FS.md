# Functional Specification

## Functional Overview
This document describes the expected system behavior of the public campaign site and its supporting build pipeline.

## Scope Rules
- Shared structured campaign data is maintained in Kanka.
- The website consumes generated outputs and presents them in a cleaner form.
- Obsidian content is generated from the same public dataset.
- Future website builds may also consume selected player-safe Obsidian content.

## Frontend Functions

### Home Page
- Load `docs/data/home.json`
- Show campaign introduction text
- Show aggregate site statistics
- Show featured brewery, location, and latest chronicle entry

### Brewery Page
- Load `docs/data/brewery.json`
- Show brewery summary data
- Show related organisations, items, and quests

### Atlas Page
- Load `docs/data/atlas.json`
- Show public locations and available maps
- Provide links from location records to the interactive map page
- Show preview images where generated

### People Page
- Load `docs/data/people.json`
- Show public characters with image, summary, and metadata

### Map Page
- Load `docs/data/atlas.json` and `docs/data/map-pins.json`
- Render map pins using stored coordinates
- Allow navigation to a specific pin via query parameter
- Use coordinates derived from structured metadata stored in Kanka-backed location content

### Chronicle Page
- Load `docs/data/chronicle.json`
- Show journals and events sorted by latest update time

## Build Functions

### Kanka Fetch
- Read local environment variables
- Request configured Kanka modules
- Follow paginated API responses
- Respect Kanka visibility boundaries as exposed through the API
- Exclude records marked private
- Normalize relevant fields into a public JSON structure
- Write `docs/data/kanka-public.json`

### Site Data Build
- Read `docs/data/kanka-public.json`
- Compute summary counts for the home page
- Select featured entities
- Extract structured helper metadata from Kanka-derived content
- Extract map pin metadata from public location text
- Preserve manually maintained map pins that are not regenerated
- Remove helper metadata from player-facing summaries when needed
- Write page-specific JSON files into `docs/data/`

### Map Preview Generation
- Read `docs/data/atlas.json`
- Crop preview images around configured map pins
- Write generated previews into `docs/assets/maps/previews/`

### Obsidian Sync
- Read `docs/data/kanka-public.json`
- Generate NPC markdown notes
- Download public character images for local vault usage
- Preserve alignment between the Obsidian mirror and the public website dataset

### Future Obsidian Reuse
- Allow selected player-safe Obsidian content to be incorporated into future website build steps
- Keep that reuse explicit in the build layer rather than directly exposing vault files

## Publication Functions
- Publish the static site from the repository `docs/` directory
- Support a custom domain through a committed `docs/CNAME` file

## Error Handling Expectations
- Missing required environment variables must stop Kanka fetch execution
- Unreachable external API responses must fail with a clear error
- Missing optional inputs such as map previews should not break site hosting
- Missing source files should stop the dependent build step rather than publishing partial silent failures
- If a record is not player-visible through Kanka, it must not appear in generated public site data
