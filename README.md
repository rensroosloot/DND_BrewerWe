# DND_BrewerWe

Campaign workspace for a rotating-DM D&D game centered on a very small brewery and bar that grows over time.

## Structure
- `DND/` Obsidian vault
- `DND/09_Public/` player-safe notes intended for sharing or publishing
- `DND/90_DM Only/` private prep and unrevealed material
- `Tech/` automation, import scripts, and build helpers
- `docs/` GitHub Pages site output

## Publishing direction
The long-term plan is to publish only `DND/09_Public/` to a website, keeping DM-only content out of the build.

## Kanka integration
Kanka can be used as a structured source for public campaign data.

Run the fetcher with:

```bash
npm run kanka:fetch
```

Required environment variables:
- `KANKA_TOKEN`
- `KANKA_CAMPAIGN_ID`
- `KANKA_MODULES` (optional)

Default fetched modules:
- `characters`
- `locations`
- `organisations`
- `quests`
- `maps`
- `journals`
- `items`
- `events`
