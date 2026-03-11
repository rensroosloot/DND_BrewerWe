# BrewerWe Site-architectuur

## Doel
Bouw een spelergerichte campagnesite die Kanka gebruikt als gestructureerde databron, maar de wereld presenteert als verhaalhub in plaats van als beheerinterface.

## Productrichting
Kanka is de canonieke opslagplaats voor publieke campagne-entiteiten.

De website is de presentatielaag:
- visueler
- sfeervoller
- makkelijker om doorheen te bladeren
- gericht op verhaal en spel

Obsidian wordt ook gebruikt als gegenereerde spiegel van dezelfde publieke dataset.
Later kan speler-veilige informatie uit die vault opnieuw worden gebruikt voor de website, maar Kanka blijft de primaire gestructureerde bron.

## Contentmodel

### Kanka is het best voor
- characters
- locations
- organisations
- quests
- maps
- journals
- items
- events
- extra gestructureerde helperdata voor sitefeatures, zoals kaartcoordinaten
- later ook tags en relaties

### Handmatige notities zijn het best voor
- tekst op de homepage
- gecureerde verhaalfragmenten
- sfeervolle sessiesamenvattingen
- brouwerij-aankondigingen
- kroeggeruchten
- onboardingtekst voor spelers

## Source-of-truth verdeling

### Privé
- `DND/` except `DND/09_Public/`
- DM prep
- secrets
- draft lore

### Publiek gestructureerd
- Kanka API
- only non-private entities
- inclusief helpermetadata voor rendering, zoals kaartmarkers

### Publiek redactioneel
- `DND/09_Public/`
- hand-written player-safe notes

### Gespiegelde werkruimte
- Obsidian vault output
- afgeleid van publieke Kanka-data
- mogelijk later extra bron voor player-safe websitetekst

### Technisch
- `Tech/`
- fetch scripts
- transforms
- templates
- frontend logic

### Gepubliceerde output
- `docs/`

## Sitestructuur

### 1. Home
Doel:
- de toon zetten
- de campagnepremisse uitleggen
- de huidige staat van de brouwerijcampagne tonen

Inhoud:
- campagneintro
- laatste sessie of laatste kroniek-item
- uitgelichte locatie
- uitgelichte factie of NPC
- snelle links naar atlas, brouwerij en kroniek

Bronnen:
- handmatige tekst uit `DND/09_Public`
- laatst gegenereerde Kanka-highlights

### 2. Brewery
Doel:
- de brouwerij laten voelen als het hart van de campagne

Inhoud:
- identiteit van de brouwerij
- huidige publieke status
- ontdekte upgrades
- personeel en bekende bondgenoten
- huidige publieke hooks
- kenmerkende bieren of ingrediënten

Bronnen:
- organisatiedata uit Kanka voor de brouwerij zelf
- items voor ingrediënten, recepten en voorraad
- handmatige notitie voor een eigen samenvatting

### 3. Atlas
Doel:
- door de wereld bladeren op plek in plaats van op databasecategorie

Inhoud:
- locatiekaarten
- regio-indeling
- kaartafbeeldingen of kaartlinks
- reisachtige samenvattingen

Bronnen:
- locations
- maps
- later: parent-child locatie-relaties

### 4. People
Doel:
- bekende NPC's tonen als spelers in het verhaal

Inhoud:
- portretten
- korte bekende samenvatting
- affiliaties
- waar ze mee verbonden zijn

Bronnen:
- characters
- organisations
- later tags/relaties

### 5. Factions
Doel:
- machtsblokken en bondgenoten/rivalen helder tonen

Inhoud:
- factiekaarten
- publieke doelen
- bekend gebied
- bekende links met de brouwerij

Bronnen:
- organisations
- locations
- later tags/relaties

### 6. Quest Board
Doel:
- actieve hooks en expeditiekansen tonen

Inhoud:
- open quests
- geruchten
- leads per type
- beloningen of motieven

Bronnen:
- quests
- handmatige publieke hooks indien nodig

### 7. Chronicle
Doel:
- het verhaal van de campagne door de tijd heen vertellen

Inhoud:
- sessiesamenvattingen
- publieke journaals
- grote publieke gebeurtenissen

Bronnen:
- journals
- events
- handmatige sessiesamenvattingen in `DND/09_Public`

### 8. Brews and Ingredients
Doel:
- de campagne een duidelijke brouwerij-identiteit geven

Inhoud:
- ontdekte bieren
- ingrediënten
- bijzondere voorraad
- zeldzame vondsten uit avonturen

Bronnen:
- items
- handmatige notities voor stijl en sfeer

## Ontwerpprincipes

### Spiegel Kanka niet direct
Vermijd pagina's die voelen als ruwe entity-dumps.

In plaats daarvan:
- groepeer items op doel
- toon alleen bruikbare velden
- zet sfeer en verhaal voorop
- toon structuur pas daarna

### Eerst verhaal, daarna data
Elke pagina moet antwoord geven op:
- waarom dit ertoe doet
- wat spelers weten
- hoe dit verbonden is met de brouwerij of campagne

### Cureer
Niet elk Kanka-veld hoort op de publieke site.
Zet records om naar een eenvoudiger front-end model.

## Transformatielaag

## Fase 1
Huidige staat:
- haal publieke Kanka-modules op
- schrijf geschoonde JSON naar `docs/data/kanka-public.json`

## Fase 2
Voeg een build-stap toe die view-modellen maakt zoals:
- `home.json`
- `atlas.json`
- `people.json`
- `factions.json`
- `chronicle.json`

Deze bestanden moeten zijn gevormd naar de behoefte van de pagina, niet naar het Kanka-schema.

Voorbeeld:
- `locations` worden gegroepeerde atlassecties
- `organisations` worden facties en brouwerijrecords
- `events` en `journals` worden kroniek-items

## Aanbevolen build-pipeline
1. Fetch Kanka raw data
2. Extract structured helpermetadata where nodig
3. Filter to public records
4. Transform into page-oriented JSON
5. Sync relevante output naar Obsidian
6. Render frontend components from those page models

## Volgende implementatiestappen

### Stap 1
Vervang de huidige lange pagina door een kleine site met aparte pagina's:
- `index.html`
- `atlas.html`
- `people.html`
- `factions.html`
- `chronicle.html`
- `brewery.html`

### Stap 2
Maak gegenereerde page-model JSON-bestanden in `docs/data/`

### Stap 3
Voeg afbeeldingsweergave toe voor entiteiten met publieke afbeeldingen

### Stap 4
Voeg regels voor uitgelichte content toe:
- uitgelichte brouwerij
- uitgelichte locatie
- nieuwste kroniek-item

### Stap 5
Voeg gerelateerde Kanka-data toe:
- tags
- relaties
- posts

## Aanbevolen eerste scope
Begin met:
- Home
- Brewery
- Atlas
- Chronicle

Deze vier pagina's zijn genoeg om de site bewust ontworpen en verhaalgedreven te laten voelen.
