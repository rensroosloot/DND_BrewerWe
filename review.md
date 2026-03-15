# Review

## Executive Summary

De site is functioneel en de dataflow is helder gescheiden tussen Kanka-sync en statische publicatie, maar er zijn nog een paar serieuze zwakke plekken. De grootste is dat publieke Kanka-data op meerdere plekken direct in `innerHTML`-templates terechtkomt zonder consistente escaping of URL-validatie in de renderlaag. Omdat de site op GitHub Pages draait en er in de repo geen CSP zichtbaar is, is de impact van een stored XSS-incident onnodig groot. Daarnaast is de build/sync-kant fragiel door ontbrekende timeouts/retries en ontbreekt validatie op `map_pin`-integriteit.

## High

### R-001: Stored XSS-risico door ongescapete Kanka-data in `innerHTML`
**Impact:** Een publiek Kanka-record met kwaadaardige of onverwachte tekst/URL kan scriptbare markup in de site injecteren.

**Locaties**
- [docs/site.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/site.js#L33)
- [docs/site.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/site.js#L42)
- [docs/atlas.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/atlas.js#L58)
- [docs/people.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/people.js#L10)
- [docs/personage.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/personage.js#L10)
- [docs/map.js](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/map.js#L445)

**Evidence**
- `renderCard()` plaatst `item.name`, `summary`, `item.url` en `item.image` direct in HTML-strings.
- `renderLocationCard()`, `renderPersonCard()`, `renderDetail()` en `renderSidebar()` doen hetzelfde voor `name`, `type`, `summary`, `fullText`, `url` en `image`.
- Alleen `record.entry` gaat door `sanitizeRichText()` in de buildlaag; andere velden worden daarna alsnog rauw in de DOM gezet.

**Waarom dit belangrijk is**
- De code vertrouwt impliciet op Kanka-data als veilig presentatiemateriaal.
- Dat is geen verdedigbare grens: namen, titles, URLs en imagevelden zijn ook invoer.
- Door de brede inzet van `innerHTML` is er geen tweede verdedigingslaag als een veld ooit HTML of een gevaarlijke URL bevat.

**Aanbevolen fix**
- Escape alle tekstvelden standaard in de renderlaag.
- Valideer URL-velden centraal voordat ze in `href` of `src` terechtkomen.
- Gebruik waar mogelijk `textContent`, `createElement` en property assignment in plaats van string-templates.

## Medium

### R-002: Geen zichtbare CSP of andere browser-hardening voor een statische Pages-site
**Impact:** Als er toch XSS in de site komt, is er weinig containment.

**Locaties**
- [docs/index.html](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/index.html)
- [docs/atlas.html](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/atlas.html)
- [docs/brewery.html](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/brewery.html)
- [docs/map.html](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/docs/map.html)
- [Tech/docs/DEPLOYMENT.md](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/docs/DEPLOYMENT.md#L3)

**Evidence**
- In de HTML-entrypoints zijn wel module-scripts zichtbaar, maar geen `Content-Security-Policy` meta-tag.
- De deploymentdoc beschrijft GitHub Pages vanaf `docs/`, maar noemt geen runtime headerstrategie of CSP-beperking voor static hosting.

**Waarom dit belangrijk is**
- Op GitHub Pages heb je niet vanzelf serverheaders onder controle.
- Zonder expliciete documentatie of meta-CSP is de veilige default hier effectief “geen client-side hardening zichtbaar”.

**Aanbevolen fix**
- Voeg minimaal een vroege meta-CSP toe die `script-src 'self'` afdwingt.
- Documenteer expliciet in deployment dat Pages geen server-side security headers injecteert en wat jullie gekozen baseline is.

### R-003: Kanka-sync en enrichment missen timeouts/retries en kunnen onbepaald hangen of hard falen
**Impact:** De build/deployflow is kwetsbaar voor netwerkproblemen en third-party instabiliteit.

**Locaties**
- [Tech/fetch-kanka.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/fetch-kanka.mjs#L180)
- [Tech/fetch-kanka.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/fetch-kanka.mjs#L191)
- [Tech/build-site-data.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/build-site-data.mjs#L103)
- [Tech/build-site-data.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/build-site-data.mjs#L136)

**Evidence**
- `fetchJson()` doet een kale `fetch()` zonder `AbortController`, retry of backoff.
- De Forgotten Realms enrichment gebruikt ook een kale `fetch()`; errors worden wel gelogd, maar timeouts ontbreken.

**Waarom dit belangrijk is**
- Eén traag of half-hangend request kan een sync onnodig lang blokkeren.
- De deployflow hangt direct af van externe APIs.

**Aanbevolen fix**
- Voeg timeouts toe aan alle network calls.
- Voeg beperkte retries met backoff toe voor transient failures.
- Maak het gedrag expliciet: Kanka moet hard failen, enrichment mag soft failen.

### R-004: `map_pin` parsing valideert coördinaten en ID-integriteit onvoldoende
**Impact:** Foute of conflicterende pins kunnen de kaart inconsistent maken of silently overschrijven.

**Locaties**
- [Tech/map-pin-schema.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/map-pin-schema.mjs#L72)
- [Tech/map-pin-schema.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/map-pin-schema.mjs#L82)
- [Tech/build-site-data.mjs](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/build-site-data.mjs#L284)

**Evidence**
- `map_x` en `map_y` hoeven alleen parsebaar te zijn; range `0-100` wordt niet afgedwongen.
- `id` wordt direct geaccepteerd of uit `label` afgeleid.
- Bij merge met bestaande pins wordt alleen op `id` gefilterd, zonder collision warning of uniqueness check.

**Waarom dit belangrijk is**
- Een verkeerde of dubbele `id` veroorzaakt moeilijk te debuggen overschrijvingen.
- Coördinaten buiten bereik zijn geen security-issue op zich, maar wel een robuustheids- en datakwaliteitsprobleem.

**Aanbevolen fix**
- Valideer `map_x`/`map_y` hard op `0 <= value <= 100`.
- Fail of warn op dubbele `id`s binnen dezelfde build.
- Leg deze constraints ook vast in de spec en tests.

## Low

### R-005: Deployment/documentatie dekt het publicatierisico van “volledige publieke Kanka-data” niet scherp genoeg af
**Impact:** Het is makkelijk om meer publiek te publiceren dan beoogd, zonder expliciete releasecheck.

**Locaties**
- [Tech/README.md](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/README.md#L31)
- [Tech/docs/DEPLOYMENT.md](/c:/Users/rensr/OneDrive/Git/Prive/021%20DND/Tech/docs/DEPLOYMENT.md#L13)

**Evidence**
- De README vermeldt dat “publieke Kanka-data volledig bewaard” blijft in gegenereerde JSON.
- De deploymentdoc zegt wel “review generated content”, maar niet welke privacy- of content-checks verplicht zijn voor een release.

**Aanbevolen fix**
- Voeg een korte release-checklist toe:
  - private/public verifiëren
  - diff op `docs/data/kanka-public.json`
  - nieuwe externe links/afbeeldingen controleren
  - publiceerbare modules en velden bevestigen

## Positieve punten

- Secrets blijven buiten browser-JS; Kanka wordt alleen server-side tijdens build aangesproken.
- `sanitizeHref()` beperkt anchor-links in rich text al tot `http` en `https`.
- Externe links gebruiken meestal `rel="noreferrer noopener"`.
- Voor `brewery` en `map_pin` zijn al parser-tests aanwezig, wat een goede basis is voor verdere hardening.

## Aanbevolen Volgorde

1. Dicht eerst R-001 met centrale escaping/URL-validatie in de renderlaag.
2. Voeg daarna een CSP-baseline toe en documenteer die expliciet.
3. Maak vervolgens de sync/buildflow robuuster met timeouts en retries.
4. Rond af met strengere `map_pin` validatie en een release-checklist.
