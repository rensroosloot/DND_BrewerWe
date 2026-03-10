# Tech

Automation and site code for the public campaign website lives here.

## Kanka sync
The Kanka API is used at build time, never from browser JavaScript.

### Environment variables
- `KANKA_TOKEN` - API token from Kanka
- `KANKA_CAMPAIGN_ID` - campaign id to fetch
- `KANKA_MODULES` - optional comma-separated list, default `characters,locations,organisations,quests,maps,journals,items,events`
- `KANKA_API_BASE_URL` - optional override, default `https://api.kanka.io/1.0`

### Run
```bash
npm run kanka:fetch
```

### Output
- Raw API pulls go to `Tech/data/raw/` and are ignored by git
- Sanitized public data is written to `docs/data/kanka-public.json`

## Safety
- Keep API tokens out of git
- Do not commit raw exports unless you intend to share them
- The fetch script excludes records where `is_private` is true
