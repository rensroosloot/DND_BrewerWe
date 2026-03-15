# Brewery Design Specification

## Design Overview
The brewery system is designed as a structured venture-management layer on top of the public campaign site. Kanka remains the content entry point. Brewery state and settlement results are stored in standardized text blocks in Kanka, extracted during the build process, transformed into site-oriented JSON, and rendered as a visual operational dashboard.

## Architectural Intent
- Kanka is the canonical input surface.
- The website is the player-facing visualization layer.
- In-game dice rolls remain manual and are not automated by the site.
- Brewery operations are represented as structured state, not inferred from narrative text alone.

## Design Goals
- Support a stable manual workflow that does not require a custom admin UI.
- Present the brewery as an active operation, not a static lore page.
- Support both current state and historical progression.
- Allow gradual expansion of the brewery model without redesigning the whole system.

## System Context

### Input Layer
- Kanka location or organization entry for the brewery
- Structured text snippets embedded in Kanka content
- Narrative text may coexist with structured blocks

### Transform Layer
- Build scripts read Kanka API output
- Structured brewery blocks are parsed into normalized fields
- Parsed brewery state is merged into page-specific brewery view models

### Presentation Layer
- Brewery page on the static site
- Visual summaries for finances, stock, production, incidents, staffing, and upgrades
- Historical settlement display for recent operational changes

## Core Data Domains

### 1. Brewery State
Represents the current operational state of the brewery.

Examples:
- cash on hand
- current stock of finished beer
- stock of ingredients
- current staffing mode
- current active upgrades
- active protective or operational modifiers

### 2. Settlement History
Represents one recorded operational period after dice outcomes are resolved in play.

Examples:
- date
- profit roll
- loss roll
- net result
- incident
- batch result
- notes

### 3. Production State
Represents items currently moving through the brewery pipeline.

Examples:
- active batch name
- batch type
- stage
- progress percentage
- expected output
- expected completion period

### 4. Inventory
Represents both raw materials and finished goods.

Examples:
- hops
- grain
- yeast
- rare ingredients
- casks or containers
- beer ready for sale

### 5. Upgrades and Boons
Represents permanent or temporary improvements that affect brewery performance.

Upgrade categories may include:
- structural
- operational
- commercial
- protective

### 6. Incidents and Risks
Represents negative or uncertain operational events.

Examples:
- failed batch
- spoiled stock
- staffing shortage
- inspection
- damaged equipment
- supply disruption

### 7. Absence Planning
Represents how long the players intend to stay away from the brewery, how long they are actually away, and what operational coverage exists during that time.

Examples:
- planned return date
- planned absence duration
- actual elapsed duration
- delegated oversight
- storage burden
- overdue risk state

### 8. Batch Planning
Represents a planned batch that has been prepared at the end of one session and is resolved at the start of the next.

Examples:
- planned input bottles
- efficiency allocation
- quality allocation
- value allocation
- oversight allocation
- planned absence duration

Design note:
- efficiency should primarily influence production yield
- quality and oversight should primarily influence contamination and operational safety

## Input Model

## Planned Batch Block
The upcoming unresolved batch must be stored in a dedicated plan block in Kanka.

Illustrative format:
```text
[brewery_plan]
plan_date: 2026-03-12
batch_name: Copper Keg Ale
planned_input_bottles: 30
efficiency: 2
quality: 1
value: 1
oversight: 0
planned_absence_weeks: 2
notes: Balanced batch prepared before leaving town.
[/brewery_plan]
```

Design rules:
- `planned_input_bottles` defines scale and may grow with brewery upgrades.
- `efficiency`, `quality`, `value`, and `oversight` consume the shared planning points.
- the plan is resolved later into one or more `brewery_settlement` records.

## Current State Block
The current brewery state should be stored in a standardized block in Kanka.

Illustrative format:
```text
[brewery_state]
cash_on_hand: 340
beer_in_stock: 9
raw_hops: 4
raw_grain: 7
active_batch_name: dark-ale
active_batch_stage: fermenting
active_batch_progress: 40
staffing_mode: delegated
reputation: 2
[/brewery_state]
```

## Settlement Block
Each recorded settlement period should be stored in a standardized repeated block.

Illustrative format:
```text
[brewery_settlement]
date: 2026-03-11
profit_roll: 6
loss_roll: 2
net_result_gp: 40
incident: none
batch_result: success
notes: Quiet week, steady local sales.
[/brewery_settlement]
```

## Absence Planning Fields
The design must support structured fields for planned and actual absence.

Illustrative examples:
```text
planned_absence_weeks: 2
actual_absence_weeks: 5
staffing_cover: delegated
storage_cost_per_week: 15
overdue_penalty: true
```

## Input Design Rules
- Field names must remain fixed.
- Values should be simple key-value pairs.
- Parsing should not depend on prose surrounding the structured blocks.
- Multiple settlement blocks must be supported.
- The site may generate helper snippets that users can copy into Kanka.
- A batch plan should separate input scale from process quality by storing planned input volume independently from planning-point allocation.

## Site Design Areas

### Operations Summary
Shows current brewery health at a glance.

Suggested elements:
- cash
- current operating status
- last settlement outcome
- risk state

### Production Board
Shows what is happening in the brewery now.

Suggested elements:
- active batches
- stage per batch
- progress per batch
- expected output

### Inventory Board
Shows available materials and saleable stock.

Suggested elements:
- raw materials
- brewing supplies
- finished beer
- shortage warnings

### Upgrades and Staff
Shows current improvements and mitigation capacity.

Suggested elements:
- active upgrades
- hired help
- delegated management
- temporary protections

### Absence and Coverage
Shows how long the brewery can operate without direct player attention and what happens if the players return later than planned.

Suggested elements:
- planned return interval
- actual elapsed interval
- current staffing cover
- current upkeep burden
- overdue warning state

### Incidents and Risks
Shows what is currently threatening productivity or reputation.

Suggested elements:
- active incidents
- recent failures
- neglect warnings
- recovery actions

### Settlement History
Shows the recent operational timeline.

Suggested elements:
- settlement date
- rolls
- financial outcome
- incident outcome
- notes

## Neglect Model Support
The design must support the concept that absence or under-management creates risk.

Examples of supported consequence types:
- increased loss
- failed or spoiled batch
- reduced available stock
- delayed production
- staffing issues
- reputation loss
- additional costs for extended unattended operation
- loss caused by returning later than planned

Examples of supported mitigation types:
- hired manager
- temporary labor
- maintenance boon
- protective upgrades
- delegated operations
- storage or preservation upgrades
- staffing arrangements sized to the planned absence interval

## Upgrade Model
Upgrades are first-class design elements and must be supported explicitly.

Each upgrade should be representable with:
- id
- name
- type
- description
- status
- effect summary

Possible effects:
- increase storage
- increase batch capacity
- reduce losses
- reduce chance of failed batches
- improve quality
- improve reputation
- reduce neglect penalties
- reduce long-absence penalties
- extend safe unattended duration

## Visual Design Direction
The brewery page should rely on visual state communication rather than plain text alone.

Preferred visual patterns:
- status cards
- progress bars
- inventory tiles
- production lane cards
- warning badges
- incident tags
- upgrade chips
- planned-versus-actual interval indicators
- overdue alerts

The interface should make it easy to answer:
- what is brewing now
- what is ready now
- what is running low
- what went wrong recently
- what protection or upgrades are active
- how long the brewery can safely run without direct supervision
- whether the players have exceeded their planned return window

## Extensibility
The data model must support future expansion to:
- multiple ventures
- multiple simultaneous brewery facilities
- richer stock categories
- supplier relationships
- regional demand or trade modifiers
- broader venture mechanics beyond the brewery

## Design Constraints
- The first implementation should not require a new backend.
- The first implementation should not require direct edits through the website.
- Parsing logic must remain robust against minor narrative changes around structured blocks.
- The visual model must remain understandable to players who do not manage the raw source data.
- The model must support a difference between planned and actual elapsed time away from the brewery.

## Recommended Next Design Step
After approval of this design, the next step should define:
- the exact brewery snippet schema
- the minimum required fields for `brewery_state`
- the minimum required fields for `brewery_settlement`
- the first brewery page layout and visualization priorities
