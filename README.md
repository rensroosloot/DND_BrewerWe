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

Voer de fetcher uit met:

```bash
npm run kanka:fetch
```

Verplichte environment variables:
- `KANKA_TOKEN`
- `KANKA_CAMPAIGN_ID`
- `KANKA_MODULES` (optional)

Standaard opgehaalde modules:
- `characters`
- `locations`
- `organisations`
- `quests`
- `maps`
- `journals`
- `items`
- `events`
