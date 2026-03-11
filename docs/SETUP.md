# GitHub Pages-instelling

Deze repo is voorbereid om een statische site te publiceren vanuit de map `docs/` op de `main`-branch.

## GitHub-instelling
1. Maak de GitHub-repository aan.
2. Push deze repo naar GitHub.
3. Open in GitHub `Settings -> Pages`.
4. Stel in:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`

## Eigen domein
Aanbevolen: gebruik een subdomein zoals `dnd.jouwdomein.com`.

1. Vul in GitHub Pages-instellingen je eigen domein in.
2. GitHub maakt of verwacht een `CNAME`-bestand in `docs/`.
3. Vervang `docs/CNAME.example` door `docs/CNAME` met alleen je echte domein.

## DNS
Voor een subdomein:
- Maak een `CNAME`-record aan van `dnd` naar `<jouw-github-gebruikersnaam>.github.io`

Voor een hoofddomein:
- Gebruik de GitHub Pages apex `A`-records uit de actuele GitHub-documentatie in plaats van een CNAME
- Een hoofddomein is kwetsbaarder dan een subdomein, dus een subdomein heeft de voorkeur

## Belangrijk
- Publiceer alleen speler-veilige inhoud
- Stel `DND/90_DM Only` niet bloot
