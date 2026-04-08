# DND_BrewerWe

Campagneworkspace voor een roulerende DM D&D-campagne rond een kleine brouwerij met bar die langzaam kan uitgroeien.

## Structuur
- `DND/` Obsidian-vault
- `DND/09_Public/` speler-veilige notities voor delen of publiceren
- `DND/90_DM Only/` privé voorbereiding en nog niet onthulde informatie
- `Tech/` automatisering, importscripts en build-hulpmiddelen
- `docs/` output van de GitHub Pages-site

## Publicatierichting
Het plan is om alleen `DND/09_Public/` naar de website te publiceren en DM-only inhoud buiten de build te houden.

## Kanka-integratie
Kanka wordt gebruikt als gestructureerde bron voor publieke campagnegegevens.

### Lokaal synchroniseren en publiceren
```bash
npm run deploy
```
Haalt Kanka-data op, bouwt de site, en pusht wijzigingen naar GitHub in één stap.

### Alleen ophalen of bouwen
```bash
npm run kanka:fetch    # alleen Kanka-data ophalen
npm run site:build    # alleen de site bouwen vanuit bestaande data
npm run kanka:sync    # ophalen + bouwen
```

### Automatische sync
De GitHub Actions workflow (`.github/workflows/sync-kanka.yml`) draait dagelijks om 06:00 UTC en kan ook handmatig worden gestart via de GitHub Actions-tab.

### Environment variables (`Tech/.env.local`)
- `KANKA_TOKEN` — API-token uit Kanka
- `KANKA_CAMPAIGN_ID` — campagne-id
- `KANKA_MODULES` (optioneel) — kommagescheiden lijst van modules
- `BREWERY_ORG_NAME` — exacte naam van de brouwerijorganisatie in Kanka

### Standaard opgehaalde modules
- `characters`, `locations`, `organisations`, `quests`, `maps`, `journals`, `items`, `events`
