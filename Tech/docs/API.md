# API and Data Description

## Purpose
The application does not expose a public runtime API of its own. Instead, it uses:
- the Kanka REST API during local build time
- generated JSON files as the frontend data interface
- generated Obsidian content as a downstream mirror of the same public data

## External API

### Provider
- Kanka REST API

### Usage Pattern
- Called only by `Tech/fetch-kanka.mjs`
- Never called directly from browser code
- Used to fetch public campaign entities by module
- May include structured helper values entered in Kanka content for downstream feature generation
- Depends on Kanka visibility rules so that only player-visible content is available for publication

### Configured Modules
- `characters`
- `locations`
- `organisations`
- `quests`
- `maps`
- `journals`
- `items`
- `events`

### Required Local Configuration
- `KANKA_TOKEN`
- `KANKA_CAMPAIGN_ID`

Optional local configuration:
- `KANKA_MODULES`
- `KANKA_API_BASE_URL`

Actual values are intentionally not documented here.

## Normalized Public Data Contract

### File
- `docs/data/kanka-public.json`

### Shape
```json
{
  "generatedAt": "ISO-8601 timestamp",
  "campaignId": 12345,
  "modules": {
    "characters": [
      {
        "id": 1,
        "entityId": 10,
        "module": "characters",
        "name": "Name",
        "type": "Type",
        "title": "Title",
        "image": "URL or null",
        "summary": "Short text or null",
        "fullText": "Public cleaned text or null",
        "locationId": 22,
        "url": "Source URL or null",
        "updatedAt": "ISO-8601 timestamp or null"
      }
    ]
  }
}
```

## Structured Metadata Convention
- Kanka remains the main source of truth even for feature-specific helper data.
- Helper metadata may be stored in Kanka content using simple key-value conventions that the build scripts can parse.
- A current example is location coordinate data used to generate map markers.
- Helper metadata is only usable when stored in content that is itself safe to expose at player-visible level.

Example convention:
```text
map_x: 48.2
map_y: 61.4
```

The build layer may extract these values and omit them from player-facing summaries.

## Generated Frontend Data Contracts

### `docs/data/home.json`
- Introductory content
- Aggregate module counts
- Featured brewery, location, and chronicle item

### `docs/data/brewery.json`
- Primary brewery entity
- Public organisations
- Public items
- Public quests

### `docs/data/atlas.json`
- Public locations
- Public maps
- Derived map pin references
- Derived map preview references

### `docs/data/people.json`
- Public characters collection

### `docs/data/chronicle.json`
- Combined journals and events sorted by update time

### `docs/data/map-pins.json`
- List of pin identifiers, labels, location names, and coordinate pairs

Example pin record:
```json
{
  "id": "boareskyr-bridge",
  "label": "Boareskyr Bridge",
  "locationName": "Boareskyr Bridge",
  "x": 48.2,
  "y": 61.4
}
```

## Frontend Consumption Rules
- Browser code reads only generated JSON files from `docs/data/`
- Frontend pages must tolerate empty arrays and missing optional fields
- Image and map preview references are optional
- Browser code must not depend on direct Kanka connectivity

## Visibility Model
- Kanka visibility settings are the main control for what enters the publication pipeline.
- The integration assumes that data returned through the player-safe API boundary is eligible for transformation into website data.
- Records outside that visibility boundary are out of scope for public output.

## Obsidian Data Position
- Obsidian output is generated from the public normalized dataset
- Future build steps may read selected player-safe vault content, if that is formalized later
- Any such reuse should be treated as an explicit secondary input, not the primary source of truth

## Versioning Guidance
- Keep file names stable for the frontend
- Evolve field additions in a backward-compatible way where possible
- If a breaking schema change is needed, update both build scripts and page scripts in the same change set
