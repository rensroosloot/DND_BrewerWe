# BrewerWe Site Architecture

## Goal
Build a player-facing campaign site that uses Kanka as structured source data, but presents the world as a story hub rather than an admin database.

## Product direction
Kanka is the canonical store for public campaign entities.

The website is the presentation layer:
- more visual
- more atmospheric
- easier to browse
- focused on story and play

Obsidian remains the private DM workspace.

## Content model

### Kanka is best for
- characters
- locations
- organisations
- quests
- maps
- journals
- items
- events
- tags and relationships later

### Manual notes are best for
- home page copy
- curated story summaries
- session recaps with tone
- brewery announcements
- tavern rumors
- player onboarding text

## Source-of-truth split

### Private
- `DND/` except `DND/09_Public/`
- DM prep
- secrets
- draft lore

### Public structured
- Kanka API
- only non-private entities

### Public editorial
- `DND/09_Public/`
- hand-written player-safe notes

### Technical
- `Tech/`
- fetch scripts
- transforms
- templates
- frontend logic

### Published output
- `docs/`

## Site map

### 1. Home
Purpose:
- set tone
- explain the campaign premise
- show the current state of the brewery campaign

Content:
- campaign intro
- latest session or latest chronicle entry
- featured location
- featured faction or NPC
- quick links into the atlas, brewery, and chronicle

Sources:
- manual copy from `DND/09_Public`
- latest generated Kanka highlights

### 2. Brewery
Purpose:
- make the brewery feel like the heart of the campaign

Content:
- brewery identity
- current public status
- upgrades discovered
- staff and known allies
- current public hooks
- signature brews or ingredients

Sources:
- organisation data from Kanka for the brewery itself
- items for ingredients, recipes, stock
- manual note for custom brewery summary

### 3. Atlas
Purpose:
- browse the world by place, not by database table

Content:
- location cards
- region groupings
- map image or map links
- travel-style summaries

Sources:
- locations
- maps
- later: parent-child location relationships

### 4. People
Purpose:
- show known NPCs as story actors

Content:
- portraits
- short known summary
- affiliations
- where they are connected

Sources:
- characters
- organisations
- tags/relationships later

### 5. Factions
Purpose:
- show power blocks and allies/rivals clearly

Content:
- faction cards
- public goals
- known territory
- known links to the brewery

Sources:
- organisations
- locations
- tags/relationships later

### 6. Quest Board
Purpose:
- show live hooks and expedition opportunities

Content:
- open quests
- rumors
- leads by type
- rewards or motives

Sources:
- quests
- manual public hooks if needed

### 7. Chronicle
Purpose:
- tell the story of the campaign over time

Content:
- session summaries
- public journals
- major public events

Sources:
- journals
- events
- manual session recaps in `DND/09_Public`

### 8. Brews and Ingredients
Purpose:
- give the campaign a distinct brewery identity

Content:
- discovered brews
- ingredients
- special stock
- rare finds from adventures

Sources:
- items
- manual notes for style and flavor text

## Design principles

### Do not mirror Kanka directly
Avoid pages that feel like raw entity dumps.

Instead:
- group entries by purpose
- feature only useful fields
- surface atmosphere and story first
- show structure second

### Story first, data second
Every page should answer:
- why this matters
- what players know
- how it connects to the brewery or campaign

### Curate
Not every Kanka field belongs on the public site.
Transform records into a simpler front-end model.

## Transformation layer

## Phase 1
Current state:
- fetch public Kanka modules
- write sanitized JSON into `docs/data/kanka-public.json`

## Phase 2
Add a build step that produces view models such as:
- `home.json`
- `atlas.json`
- `people.json`
- `factions.json`
- `chronicle.json`

These files should be shaped for page needs, not Kanka schema.

Example:
- `locations` become grouped atlas sections
- `organisations` become factions and brewery records
- `events` and `journals` become chronicle entries

## Recommended build pipeline
1. Fetch Kanka raw data
2. Filter to public records
3. Transform into page-oriented JSON
4. Render frontend components from those page models

## Next implementation steps

### Step 1
Replace the current single long page with a small routed site:
- `index.html`
- `atlas.html`
- `people.html`
- `factions.html`
- `chronicle.html`
- `brewery.html`

### Step 2
Create generated page-model JSON files in `docs/data/`

### Step 3
Add image rendering for entities that have public images

### Step 4
Add featured content rules:
- featured brewery
- featured location
- latest chronicle entry

### Step 5
Add Kanka related data:
- tags
- relationships
- posts

## Recommended first build scope
Start with:
- Home
- Brewery
- Atlas
- Chronicle

These four pages are enough to make the site feel intentional and story-driven.

