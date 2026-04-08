# Techniek

Hier staat de automatisering en sitecode voor de publieke campagnewebsite.

## Documentatie
Formele projectdocumentatie staat in `Tech/docs/`:
- `Tech/docs/URS.md`
- `Tech/docs/DS.md`
- `Tech/docs/FS.md`
- `Tech/docs/API.md`
- `Tech/docs/DEPLOYMENT.md`
- `Tech/docs/TESTING.md`

## Kanka-sync
De Kanka API wordt gebruikt tijdens het build-proces, nooit rechtstreeks vanuit browser-JavaScript.

### Environment variables (`Tech/.env.local`)
- `KANKA_TOKEN` — API-token uit Kanka
- `KANKA_CAMPAIGN_ID` — campagne-id om op te halen
- `KANKA_MODULES` — optionele komma-gescheiden lijst, standaard `characters,locations,organisations,quests,maps,journals,items,events`
- `KANKA_API_BASE_URL` — optionele override, standaard `https://api.kanka.io/1.0`
- `BREWERY_ORG_NAME` — exacte naam van de brouwerijorganisatie in Kanka; zonder deze variabele valt de build terug op regex-detectie

### Uitvoeren
```bash
npm run deploy          # sync + commit + push (aanbevolen voor lokaal gebruik)
npm run kanka:fetch     # alleen ophalen
npm run kanka:sync      # ophalen + bouwen
npm run kanka:sync:all  # ophalen + bouwen + Obsidian-sync
npm run obsidian:sync   # alleen Obsidian-sync
```

### Output
- Ruwe API-data komt in `Tech/data/raw/` en wordt genegeerd door git
- Geschoonde publieke data wordt geschreven naar `docs/data/kanka-public.json`
- Beheerde Obsidian-personages worden geschreven naar `DND/06_NPCs/Kanka/`
- Afbeeldingen van personages worden lokaal opgeslagen in `DND/08_Assets/Kanka/Characters/`

Publieke Kanka-data wordt volledig bewaard in de gegenereerde JSON. Korte samenvattingen zijn alleen afgeleide presentatievelden voor de website.

## Veiligheid
- Houd API-tokens buiten git
- Commit geen ruwe exports tenzij je ze bewust wilt delen
- Het fetch-script sluit records uit waarbij `is_private` op `true` staat
