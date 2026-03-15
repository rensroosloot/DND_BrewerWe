# Brewery Functional Specification

## Purpose
This document defines the functional behavior of the brewery system, including structured input handling, derived brewery data, site rendering, and required validation and testing behavior.

## Scope
The brewery system covers:
- parsing brewery-related structured blocks from Kanka content
- transforming those blocks into brewery-specific site data
- rendering brewery status and history on the public site
- supporting a manual copy-paste workflow for maintainers
- validating the brewery data pipeline through repeatable tests

This document does not define a fully automated economic engine or direct website write-back into Kanka.

## Functional Overview
The brewery system reads structured brewery snippets from Kanka, transforms them into normalized plan and settlement records, and renders the result as a brewery operations page.

The system must support:
- one active brewery plan
- settlement history
- planned batch visibility
- planned versus actual absence tracking
- incident and outcome visibility
- simple history and trend visualization

## Functional Modules

### 1. Brewery Plan Parsing
The system must parse a single active `[brewery_plan]` block from Kanka content.

This block represents the currently planned batch and includes:
- plan date
- planned return date
- kettle name
- batch name
- kettle start volume in liters
- the four planning axes
- optional notes

### 2. Brewery Settlement Parsing
The system must parse one or more `[brewery_settlement]` blocks from Kanka content.

Each block represents one resolved operational period after in-game dice rolls.

This block may include:
- date
- planned return date
- production roll
- contamination roll
- sales roll
- net result
- incident
- batch result
- produced, sold, and spoiled volume
- notes
- optionally derived absence values for legacy compatibility

### 3. Brewery View Model Generation
The system must transform parsed brewery input into a site-oriented brewery view model.

The resulting model must support:
- active plan panels
- settlement helper panels
- absence and overdue interpretation
- settlement history panels
- chart data for simple trend views

### 4. Brewery Page Rendering
The site must render brewery data into a player-readable page using both text and visual elements.

The page must present:
- a planner flow for the next batch
- a current-run flow for settlement resolution
- the active planned batch
- the latest settlement result and incident state
- recent settlement history
- planned return versus actual return handling

### 5. Brewery Snippet Helper
The system should support a helper flow that provides maintainers with a copy-paste-ready structured snippet template for Kanka updates.

The helper may be shown on the site or generated as a documented template.

## Input Specification

## Brewery Plan Block
Illustrative structure:

```text
[brewery_plan]
plan_date: 2026-03-12
planned_return_date: 2026-03-26
kettle_name: Copper Kettle
batch_name: Copper Keg Ale
kettle_start_volume_liters: 30
efficiency: 2
quality: 1
value: 1
oversight: 0
notes: Gebalanceerde batch voor een korte afwezigheid.
[/brewery_plan]
```

## Brewery Settlement Block
Illustrative structure:

```text
[brewery_settlement]
date: 2026-03-11
planned_return_date: 2026-03-09
kettle_name: Copper Kettle
period_label: Copper Keg Ale II
production_roll: 15
contamination_roll: 13
sales_roll: 17
net_result_gp: 78
volume_produced_liters: 25
volume_sold_liters: 18
volume_spoiled_liters: 2
incident: none
batch_result: delayed
notes: Korte vertraging, maar nette output en goede marktfit.
[/brewery_settlement]
```

## Input Rules
- Field names must be fixed and case-sensitive at the parser level unless normalization is explicitly implemented.
- Repeated settlement blocks must be supported.
- Unknown fields must not break parsing.
- Missing optional fields must not break parsing.
- Missing required fields must produce a predictable validation outcome.

## Brewery Snippet Schema v1

## `brewery_plan` Fields

### Required Fields
- `plan_date`
- `planned_return_date`
- `kettle_name`
- `batch_name`
- `kettle_start_volume_liters`
- `efficiency`
- `quality`
- `value`
- `oversight`

### Optional Fields
- `notes`

### Example
```text
[brewery_plan]
plan_date: 2026-03-12
planned_return_date: 2026-03-26
kettle_name: Copper Kettle
batch_name: Copper Keg Ale
kettle_start_volume_liters: 30
efficiency: 2
quality: 1
value: 1
oversight: 0
notes: Gebalanceerde batch voor een korte afwezigheid.
[/brewery_plan]
```

## `brewery_settlement` Fields

### Required Fields
- `date`
- `kettle_name`
- `planned_return_date`
- `production_roll`
- `contamination_roll`
- `sales_roll`
- `net_result_gp`
- `volume_produced_liters`
- `volume_sold_liters`
- `volume_spoiled_liters`
- `batch_result`
- `incident`

### Optional Fields
- `period_label`
- `planned_absence_weeks`
- `actual_absence_weeks`
- `grain_used`
- `hops_used`
- `yeast_used`
- `special_used`
- `notes`

### Example
```text
[brewery_settlement]
date: 2026-03-11
planned_return_date: 2026-03-09
kettle_name: Copper Kettle
period_label: Copper Keg Ale II
production_roll: 15
contamination_roll: 13
sales_roll: 17
net_result_gp: 78
volume_produced_liters: 25
volume_sold_liters: 18
volume_spoiled_liters: 2
batch_result: delayed
incident: none
notes: Korte vertraging, maar nette output en goede marktfit.
[/brewery_settlement]
```

## Enumerated Values v1

### `batch_result`
Allowed values:
- `success`
- `delayed`
- `spoiled`
- `failed`

## Value Rules
- Numeric values must be stored without currency symbols or unit suffixes.
- Dates must use ISO-like `YYYY-MM-DD` format.
- Text notes may be free text but must remain on a single logical value line unless multiline handling is added in a later version.

## Implementation Scope v1

## `brewery_plan` Fields Implemented in v1
The first implementation must support the following `brewery_plan` fields:
- `plan_date`
- `planned_return_date`
- `kettle_name`
- `batch_name`
- `kettle_start_volume_liters`
- `efficiency`
- `quality`
- `value`
- `oversight`
- `notes`

## `brewery_settlement` Fields Implemented in v1
The first implementation must support the following `brewery_settlement` fields:
- `date`
- `kettle_name`
- `period_label`
- `planned_return_date`
- `production_roll`
- `contamination_roll`
- `sales_roll`
- `net_result_gp`
- `volume_produced_liters`
- `volume_sold_liters`
- `volume_spoiled_liters`
- `batch_result`
- `incident`
- `notes`

## Brewery Page Scope v1
The first implementation of the brewery page must include:
- a batch planner section
- an active run section
- an absence and overdue interpretation
- a settlement history section

## Brewery Turn Loop Active Rules

### Intent
The active playable brewery ruleset must support a two-phase loop:
- planning at the end of one session
- resolution at the start of the next session

This structure is intended to make the brewery feel alive between sessions, create consequences for absence, and let players make meaningful trade-offs before outcomes are rolled.

The site-side dice helper currently uses the active `v4` balance pass.
The older `v1`, `v2`, and `v3` sections later in this document remain useful as balancing history, but the helper on the brewery page must follow the active rules described in this section.

### Planning Phase
At the end of a session, the players must choose a batch plan for the next operating period.

The batch plan uses a shared pool of `4 planning points`.

These planning points must only be spent on the four planning axes.

The declared batch size is not purchased with planning points.
Instead, the batch size must come from current narrative and brewery state conditions such as:
- available ingredients
- special ingredient finds
- available yeast
- kettle or cellar capacity
- recent upgrades
- damage, shortages, or other operational setbacks

The players distribute those points across:
- `Efficiency`
- `Quality`
- `Value`
- `Oversight`

The plan must also record:
- `kettle_start_volume_liters`
- `planned_absence_weeks`
- any chosen upgrade or mitigation action

`kettle_start_volume_liters` must represent what the party can realistically attempt in the fiction at that moment.
It is the declared start volume in the kettle, based on current circumstances, not a fifth planning stat.

Illustrative example:

```text
kettle_start_volume_liters: 30
kettle_name: Copper Kettle
Efficiency: 2
Quality: 1
Value: 1
Oversight: 0
planned_absence_weeks: 2
```

### Resolution Phase
At the start of the next session, the batch plan is resolved through three manual dice rolls:

1. `Production roll`
2. `Contamination roll`
3. `Sales roll`

The site does not roll these automatically. The dice are rolled at the table and the results are then recorded in Kanka through brewery settlement data.

The site helper may calculate the outcome after the table rolls are entered, but it must not generate the dice values itself.

### Planning Axes

#### `Efficiency`
Represents how effectively the brewery process and recipe execution convert kettle start volume into usable output.

Effects:
- improves the production roll
- acts as the primary production stat for converting kettle start volume into produced output

#### `Quality`
Represents ingredient quality, cleanliness, and process care.

Effects:
- reduces spoilage and contamination risk
- acts as a protective modifier rather than a direct profit multiplier

#### `Value`
Represents how well the batch matches demand and how valuable it is to sell.

Effects:
- increases potential sales value
- does not protect against spoilage or failed production

#### `Oversight`
Represents supervision, delegated care, or operational cover during absence.

Effects:
- reduces absence-related operational risk
- improves the contamination check
- may later be tied to recurring staffing or management costs

### Kettle Start Volume
The planned batch begins with a declared start volume in the kettle, expressed in liters.

This declared start volume must be determined by the current campaign situation and brewery state rather than by spending planning points.

Sources that may justify a larger or smaller declared start volume include:
- extra or rare yeast
- unusual ingredient access
- improved equipment
- expanded storage or fermentation space
- staffing shortages
- damaged equipment
- interrupted supply lines

This keeps the brewery loop grounded in the campaign fiction:
- narrative state determines what scale is possible
- planning points determine how that opportunity is handled

Example:
- a rare yeast haul may justify a larger `kettle_start_volume_liters`
- a larger kettle upgrade may raise the safe batch size ceiling
- spoiled grain or a damaged fermenter may force a smaller batch than usual

Illustrative values:
- early brewery -> `30`
- upgraded brewery -> `60`
- expanded brewery -> `120`

The same ruleset should continue to work if the kettle start volume grows later through brewery upgrades.

### Production Roll
The production roll determines how much of the planned batch is actually produced.

Active roll:

```text
1d20 + (2 x Efficiency)
```

Active outcome table:
- `20+` -> `100%` of potential output succeeds
- `15-19` -> `85%` of potential output succeeds
- `10-14` -> `65%` of potential output succeeds
- `<10` -> `40%` of potential output succeeds

The resulting value feeds into the produced stock recorded in `brewery_settlement`.

### Contamination Roll
The contamination roll determines spoilage, infection, or a clean run.

Active roll:

```text
1d20 + Quality + Oversight
```

Active spoilage table:
- `20+` -> `0%` spoilage
- `15-19` -> `10%` spoilage
- `10-14` -> `25%` spoilage
- `<10` -> `50%` spoilage and an incident should be recorded

Active defensive adjustment:
- if `Quality >= 2`, the spoilage result improves by one partial step:
  - `15-19` -> `5%`
  - `10-14` -> `15%`
  - `<10` -> `35%`

This outcome affects:
- `volume_spoiled_liters`
- `batch_result`
- `incident`

### Sales Roll
The sales roll determines how favorable the commercial outcome is for the produced batch.

Active base roll:

```text
1d20 + Value
```

Active premium adjustments:
- if `Value >= 3`, add `+1` to the sales total
- if `Value >= 2` and `Quality >= 1`, add another `+1` to the sales total

Active price bands:
- `20+` -> `7 gp`
- `15-19` -> `5 gp`
- `10-14` -> `3 gp`
- `<10` -> `1 gp`

Active sell-through bands:
- `15+` -> sell `100%` of usable stock
- `10-14` -> sell `90%` of usable stock, rounded down
- `<10` -> sell `70%` of usable stock, rounded down

Active premium safeguards:
- if `Value >= 2`, a strong sales result does not keep its premium price if the contamination total was below `10`
- if `Value >= 2` and both contamination and sales resolve strongly, the batch may gain a small premium bonus

This outcome affects:
- `net_result_gp`
- `volume_sold_liters`
- any stock left unsold for later periods

### Planned Versus Actual Absence
The brewery system must track both:
- planned absence duration
- actual elapsed absence duration

If `actual_absence_weeks` is greater than `planned_absence_weeks`, the settlement must apply an absence penalty.

Recommended v1 penalty options:
- apply `-2` to the contamination roll
- add `10%` extra spoilage per extra week beyond the plan
- record additional storage cost for each extra week

Active helper handling:
- if the party returns late and `Oversight < 2`, apply `-2` to the contamination roll
- apply extra spoilage for each overdue week
- if `Oversight >= 1`, reduce the overdue spoilage pressure compared with an unattended batch
- record storage cost based on elapsed time away

The active implementation may still evolve, but overdue handling must remain visible in settlement outcomes.

### Strategic Intent
The planning-point model must not allow a dominant always-best build.

The v1 ruleset depends on these balancing principles:
- `Efficiency` improves output conversion and acts as the primary production stat
- `Quality` is defensive and protects output quality
- `Value` increases profit potential but does not prevent failure
- `Oversight` protects against absence and process risk rather than directly increasing revenue

### Settlement Recording
After the three resolution rolls, the outcome must be recorded into a new `[brewery_settlement]` block in Kanka.

At minimum, the recorded settlement should capture:
- the date
- planned absence
- actual absence
- production outcome
- spoilage outcome
- commercial outcome
- final profit/loss result
- incident, if any
- notes about what happened

If the site helper is used, it must expose enough information for the maintainer to record a proper settlement, including:
- produced quantity
- spoiled quantity
- sold quantity
- gross revenue
- staffing cost
- storage cost
- other cost
- final `net_result_gp`
- suggested batch result and incident state

### Testing Implications
The brewery v1 ruleset should be tested through short manual flow trials covering:
- a balanced plan
- an aggressive high-efficiency plan
- a defensive high-quality plan
- a delayed return beyond planned absence
- a failed contamination roll
- a strong sales roll with weak production

## Archived Notes
The playtest notes below were written during the transition from the older `Size` model to the current `kettle_start_volume_liters + efficiency` model.

Use them as historical balancing context only. The active rules for implementation and play are the ones above:
- declare `kettle_start_volume_liters`
- spend points on `efficiency`, `quality`, `value`, and `oversight`
- resolve with `1d20 + (2 x Efficiency)` for production

## Brewery Playtest Scenario v1

### Purpose
This scenario provides a first end-to-end playtest example for the brewery turn loop.

It is intended to answer:
- whether the planning-point system produces real trade-offs
- whether the three-roll resolution feels intuitive
- whether absence penalties create meaningful pressure

### Scenario A: Balanced Batch
At the end of Session A, the party chooses:

```text
kettle_start_volume_liters: 30
Efficiency: 2
Quality: 1
Value: 1
Oversight: 0
planned_absence_weeks: 2
```

Interpretation:
- the party wants a worthwhile batch size from the declared input volume
- they accept moderate risk
- they aim for standard-to-good sale value
- they are not paying for extra management cover

### Step 1: Potential Output
Using the v1 formula:

```text
potential_input = kettle_start_volume_liters
```

The planned input becomes:

```text
30
```

### Step 2: Production Roll
Roll:

```text
1d20 + (2 x Efficiency)
```

Illustrative result:

```text
roll = 11
modifier = +4
total = 15
```

Outcome band:
- `15-19` -> `85%` production success

Resolved production:

```text
30 x 0.85 = 25.5
```

Recommended v1 rounding:
- round down for produced stock

Result:

```text
volume_produced_liters = 25
```

### Step 3: Contamination Roll
Roll:

```text
1d20 + Quality + Oversight
```

Illustrative result:

```text
roll = 12
modifier = +1
total = 13
```

Outcome band:
- `10-14` -> `25%` spoilage

Resolved spoilage:

```text
10 x 0.25 = 2.5
```

Recommended v1 rounding:
- round down for spoilage loss

Result:

```text
volume_spoiled_liters = 2
usable_volume_liters = 8
```

### Step 4: Sales Roll
Roll:

```text
1d20 + Value
```

Illustrative result:

```text
roll = 14
modifier = +1
total = 15
```

Outcome band:
- `15-19` -> `full value sale`

Recommended v1 interpretation:
- all usable beer is sold at intended value

Illustrative commercial result:

```text
volume_sold_liters = 8
net_result_gp = 32
```

This example assumes a simple temporary value of `4 gp` per usable bottle for a full-value sale.

### Step 5: Settlement Record
The resulting settlement can then be written to Kanka in a structured block such as:

```text
[brewery_settlement]
date: 2026-03-18
period_label: Week 2
planned_absence_weeks: 2
actual_absence_weeks: 2
production_roll: 15
contamination_roll: 13
net_result_gp: 32
volume_produced_liters: 10
volume_sold_liters: 8
volume_spoiled_liters: 2
grain_used: 3
hops_used: 2
yeast_used: 1
batch_result: success
incident: none
notes: Balanced batch. Output was acceptable, but some spoilage occurred due to only light quality control.
[/brewery_settlement]
```

### Scenario B: Late Return
Using the same plan as Scenario A:

```text
planned_absence_weeks: 2
actual_absence_weeks: 4
```

Recommended v1 penalty example:
- apply `-2` to the contamination roll
- add `10%` extra spoilage per extra week

If the original contamination total was `13`, the overdue penalty changes it to:

```text
13 - 2 = 11
```

This remains in the `25%` spoilage band, but the extra two weeks also add:

```text
20%` extra spoilage
```

Using `volume_produced_liters = 10`, the total spoilage becomes:

```text
base spoilage = 2
extra spoilage = 2
total spoilage = 4
usable_beer = 6
```

This scenario demonstrates the intended campaign pressure:
- the batch is not destroyed outright
- but returning late meaningfully harms the result

## Balance Notes v1

### Why `Size` Is Not Automatically Best
`Size` increases potential output, but it also increases the amount that can be lost to poor production or spoilage.

### Why `Quality` Matters
`Quality` does not directly create profit, but it protects usable stock and reduces the chance that a large batch becomes a costly disappointment.

### Why `Value` Is Risky
`Value` improves commercial upside, but only if enough usable beer survives production and contamination.

### Why `Oversight` Matters
`Oversight` is a defensive investment against absence. It is especially important when the players know they may return later than planned.

### First Playtest Questions
The first live tests should evaluate:
- whether `Size 2` feels like a sensible middle ground
- whether `Quality 0` is too punishing or too safe
- whether `Value` feels impactful enough compared with `Size`
- whether `Oversight` becomes attractive once delayed returns occur
- whether spoilage percentages are dramatic without becoming frustrating

## Playtest Findings v1

### Simulation Setup
The first balance check was run as a Monte Carlo style simulation using:
- `100,000` runs per build
- the v1 output formula
- the v1 production, contamination, and sales tables
- a simple sales value mapping:
  - `20+` -> `5 gp`
  - `15-19` -> `4 gp`
  - `10-14` -> `3 gp`
  - `<10` -> `2 gp`

The first comparison used these builds:
- `Balanced` -> `Size 2, Quality 1, Value 1, Oversight 0`
- `Aggressive Volume` -> `Size 3, Quality 0, Value 1, Oversight 0`
- `Defensive` -> `Size 1, Quality 2, Value 0, Oversight 1`
- `Premium Push` -> `Size 1, Quality 0, Value 3, Oversight 0`
- `Protected Premium` -> `Size 0, Quality 1, Value 1, Oversight 2`

### Results Without Delay
- `Balanced` -> about `23.01 gp`
- `Aggressive Volume` -> about `29.91 gp`
- `Defensive` -> about `16.19 gp`
- `Premium Push` -> about `16.98 gp`
- `Protected Premium` -> about `11.53 gp`

### Results With Two Extra Weeks of Delay
The delay test used:
- `-2` on the contamination roll
- `+10%` extra spoilage per extra week

Results:
- `Balanced` -> about `15.98 gp`
- `Aggressive Volume` -> about `20.95 gp`
- `Defensive` -> about `12.46 gp`
- `Premium Push` -> about `12.72 gp`
- `Protected Premium` -> about `9.28 gp`

### Primary Finding
The current v1 ruleset produces a working loop, but `Size` is too dominant.

`Aggressive Volume` outperformed the other builds both:
- under normal conditions
- under delayed return conditions

This means the first draft still encourages a near-dominant volume strategy.

### Secondary Findings
- `Quality` reduces spoilage, but the reward for investing in it is currently too weak.
- `Value` does not yet create enough upside to compete with raw volume.
- `Oversight` helps conceptually, but its current benefit is not strong enough to change player behavior.
- delayed return is punishing, but not yet in a way that makes strong oversight clearly attractive.

## Balance Proposal v2

### Goal
The next balance pass should preserve the same turn loop while making all four planning axes feel strategically valid.

### Proposed Change 1: `Efficiency` Must Matter More
`Efficiency` should act mainly as a production stat rather than a contamination penalty.

Recommended v2 change:

```text
production roll = 1d20 + (2 x Efficiency)
contamination roll = 1d20 + Quality + Oversight
```

Expected effect:
- efficiency investment creates visible output gains
- quality remains the main defense against spoilage

### Proposed Change 2: `Value` Must Matter More
`Value` should create a clearer commercial payoff when players accept market risk.

Recommended v2 options:
- increase the sales value bands
- or let higher `Value` improve both price and chance of selling full stock

Illustrative stronger price bands:
- `20+` -> `6 gp`
- `15-19` -> `5 gp`
- `10-14` -> `3 gp`
- `<10` -> `1 gp`

Expected effect:
- `Value` becomes a real gamble with visible upside
- failed commercial rolls feel meaningfully worse

### Proposed Change 3: `Oversight` Must Counter Delay Better
`Oversight` should be the main defense against returning late.

Recommended v2 options:
- `Oversight 2+` cancels the overdue contamination penalty
- or reduce extra weekly spoilage by `10%` when sufficient oversight is present
- or reduce both penalty types partially

Expected effect:
- high-oversight builds become strategically attractive for travel-heavy campaigns

### Proposed Change 4: `Quality` Should Help Premium Play
`Quality` should contribute not only to spoilage defense, but also to premium reliability.

Recommended v2 rule:
- a `premium sale` result should only achieve full premium value if contamination was resolved in a strong outcome band

Alternative v2 rule:
- if `Value >= 2` and contamination result is poor, apply forced discounting

Expected effect:
- `Value` and `Quality` become linked
- premium strategy stops being a pure greed stat

## Recommended Next Test Pass
The next simulation round should test:
- the same five baseline builds
- the `Size risk` modifier
- stronger `Value` payoff
- stronger `Oversight` delay protection
- a premium-quality dependency rule

Success criteria for the next pass:
- `Aggressive Volume` is still strong but not clearly dominant
- `Defensive` becomes the preferred option in long-absence cases
- `Premium Push` gains visible upside in good outcomes
- `Oversight` changes outcomes enough to matter in campaign play

## Playtest Findings v2

### Simulation Setup
The v2 balance pass tested the same five baseline builds, with these rule adjustments:
- contamination roll changed to:

```text
1d20 + Quality + Oversight
```

- stronger value bands:
  - `20+` -> `6 gp`
  - `15-19` -> `5 gp`
  - `10-14` -> `3 gp`
  - `<10` -> `1 gp`

- stronger absence protection for `Oversight`
- premium value was downgraded if the contamination result did not also land in a strong band

### Results Without Delay
- `Balanced` -> about `21.17 gp`
- `Aggressive Volume` -> about `26.63 gp`
- `Defensive` -> about `14.85 gp`
- `Premium Push` -> about `13.62 gp`
- `Protected Premium` -> about `11.30 gp`

### Results With Two Extra Weeks of Delay
- `Balanced` -> about `8.25 gp`
- `Aggressive Volume` -> about `9.23 gp`
- `Defensive` -> about `7.53 gp`
- `Premium Push` -> about `6.23 gp`
- `Protected Premium` -> about `9.66 gp`

### Primary Finding
The v2 ruleset is healthier than v1.

Main improvements:
- `Aggressive Volume` is no longer massively dominant
- `Protected Premium` becomes one of the best long-absence strategies
- `Oversight` now visibly protects value when the players return late

### Remaining Issues
- `Aggressive Volume` is still slightly ahead under normal conditions
- `Premium Push` is still weak and too unreliable
- `Defensive` is safer, but not yet clearly attractive enough compared with more balanced plans

### Interpretation
The current v2 state suggests:
- `Size` is close to acceptable but may still need a small additional downside
- `Oversight` is now meaningful
- `Value` still needs help if a premium-focused plan is meant to be a viable identity

## Balance Proposal v3

### Goal
The next pass should avoid over-correcting volume while making premium specialization a real alternative rather than a trap choice.

### Proposed Change 1: Improve Premium Upside
`Value` should have stronger payoff when the batch succeeds cleanly.

Recommended v3 options:
- raise top premium value again
- or let strong sales outcomes sell additional stock rather than only increasing price
- or give premium builds a small flat bonus on `net_result_gp` when both contamination and sales succeed

### Proposed Change 2: Make `Defensive` More Distinct
The defensive plan should feel like the safe expedition choice.

Recommended v3 options:
- `Oversight 1+` reduces weekly late spoilage by one step
- `Quality 2+` lowers the minimum spoilage floor
- or allow defensive builds to preserve more unsold stock into the next period

### Proposed Change 3: Slightly Tighten `Size`
If needed, `Size` can take one more small risk pressure increase.

Recommended v3 options:
- keep `-Size` on contamination and add a small storage burden to large batches
- or increase extra late spoilage for large batches only

### Recommended Next Test Pass
The next simulation round should focus on:
- one stronger premium payoff rule
- one slightly stronger defensive protection rule
- one optional extra burden on large batches

Success criteria for v3:
- `Balanced` remains a strong all-round choice
- `Aggressive Volume` is good but not the obvious best plan
- `Protected Premium` stays strong for long absences
- `Premium Push` becomes situationally competitive instead of underperforming in most cases

## Playtest Findings v3

### Simulation Setup
The v3 pass kept the v2 structure and added three targeted balancing changes:
- stronger premium upside
- stronger defensive protection
- a small extra burden on large batches

The tested adjustments were:
- contamination remained:

```text
1d20 + Quality + Oversight - Size
```

- `Quality 2+` reduced spoilage bands further
- `Oversight 1+` reduced late-return spoilage pressure
- high planned input can still add extra spoilage burden
- premium success gained a stronger payoff when both sales and contamination resolved well
- weak sales results sold only part of the usable stock

### Results Without Delay
- `Balanced` -> about `21.05 gp`
- `Aggressive Volume` -> about `23.83 gp`
- `Defensive` -> about `16.70 gp`
- `Premium Push` -> about `14.28 gp`
- `Protected Premium` -> about `11.27 gp`

### Results With Two Extra Weeks of Delay
- `Balanced` -> about `8.11 gp`
- `Aggressive Volume` -> about `6.08 gp`
- `Defensive` -> about `13.50 gp`
- `Premium Push` -> about `6.34 gp`
- `Protected Premium` -> about `9.59 gp`

### Primary Finding
The v3 balance pass is materially healthier than both v1 and v2.

Main improvements:
- `Aggressive Volume` is no longer the best choice under delayed return conditions
- `Defensive` now becomes the strongest result when the brewery is left unattended longer than planned
- `Balanced` remains a good all-round strategy

This is much closer to the intended campaign behavior:
- greedy volume is attractive when the party stays on schedule
- careful preparation is rewarded when plans go wrong

### Secondary Findings
- `Premium Push` is still weaker than desired
- `Protected Premium` is viable for cautious long-absence play, but not especially lucrative
- `Balanced` may now be the best default all-round plan, which is acceptable if more specialized builds still win in the right situations

### Interpretation
The current v3 shape suggests:
- the production-stat correction is now working better
- `Oversight` and `Quality` now meaningfully matter
- the remaining weak point is the pure premium strategy

## Balance Proposal v4

### Goal
The next pass should improve premium specialization without undoing the healthy correction to volume risk.

### Proposed Change 1: Premium Should Sell Better, Not Only Pricier
`Value` can become stronger if successful premium rolls affect both price and sell-through.

Recommended v4 option:
- strong sales results sell `100%` of usable stock
- weak sales results sell only part of usable stock
- premium success may also add a small flat profit bonus

### Proposed Change 2: Premium Needs a Cleaner Identity
Right now premium remains too fragile.

Recommended v4 options:
- allow `Value 3` to add a small passive bonus on the sales roll
- or allow one premium failure to degrade to standard value instead of collapsing too hard
- or let high `Quality` unlock a stronger premium payoff band

### Proposed Change 3: Preserve the Current Volume Risk
The current v3 handling of `Size` appears close to acceptable and should not be relaxed yet.

Recommended v4 stance:
- keep contamination focused on `Quality + Oversight`
- keep the small extra burden on very large batches
- retest before adding any further volume penalty

### Recommended Next Test Pass
The next simulation round should focus almost entirely on premium tuning.

Success criteria for v4:
- `Balanced` remains a strong default choice
- `Defensive` remains the best delayed-return strategy
- `Aggressive Volume` remains attractive but risky
- `Premium Push` becomes situationally competitive in normal, on-schedule play

## Testing Scope v1
The first implementation must include tests for:
- valid `brewery_plan` parsing
- valid repeated `brewery_settlement` parsing
- missing optional fields
- malformed numeric values
- invalid dates
- planned versus actual absence handling
- overdue state derivation
- settlement ordering
- brewery page smoke rendering

## Deferred Fields and Features
The following items are intentionally deferred beyond v1:
- `special_used`
- multiple simultaneous active batches
- supplier chain tracking
- advanced pricing or market simulation
- multiple ventures in the same implementation pass

## Field Behavior

### Required Brewery Plan Concepts
The system must be able to represent these concepts in the brewery plan model:
- when the batch was planned
- when the players intend to return
- which kettle is used
- how large the kettle start volume is
- how the 4 planning points are distributed

### Required Settlement Concepts
The system must be able to represent these concepts in settlement records:
- date
- the planned return date for comparison
- the three resolution rolls
- net result
- incident
- batch outcome
- produced, sold, and spoiled volume

### Planned and Actual Absence
The system must distinguish:
- `planned_absence_weeks`
- `actual_absence_weeks`

If actual absence exceeds planned absence, the system must expose an overdue state in derived data.

## Derived Data Model
The brewery transform layer should produce a brewery-specific JSON view model.

Suggested top-level structure:

```json
{
  "generatedAt": "ISO-8601 timestamp",
  "brewery": {
    "plan": {},
    "absence": {},
    "history": []
  }
}
```

## Derived Sections

### Plan Summary
Must include:
- kettle name
- batch name
- plan date
- planned return date
- kettle start volume
- the four planning axes

### Incidents
Must include:
- recent failures
- warnings for overdue absence when applicable

### Absence Status
Must include:
- planned return date
- actual return date when recorded
- overdue status when applicable

### Settlement History
Must include:
- ordered historical settlement entries
- date
- financial outcome
- incident
- notes

## Page Functions

### Brewery Overview
The brewery page must show a concise brewery overview at the top of the page.

### Absence Display
The brewery page must show:
- when the players intended to return
- when they actually resolved the batch
- whether the brewery is overdue for direct attention

### Incident Display
The brewery page must make failures, losses, and delay states visible without requiring users to open raw text.

### History Display
The brewery page must allow players to review recent operational history.

## Error Handling
- If no brewery plan block is present, the site must show a clear empty state rather than failing silently.
- If settlement history is absent, the site must show that no settlement data is yet available.
- If required numeric fields are malformed, the parser must fail predictably and surface a useful error during build validation.
- If optional fields are absent, the site must continue rendering the remaining brewery sections.

## Validation Rules
- Numeric fields must parse as numeric values.
- Date fields must parse as valid date values or be rejected explicitly.
- Repeated settlement blocks must remain in deterministic order after parsing.
- Planned and actual absence values must be distinguishable in the normalized model.
- Unknown fields must not overwrite known fields.

## Testing Requirements

## 1. Parser Tests
The implementation must include parser tests for:
- valid `brewery_plan` blocks
- valid repeated `brewery_settlement` blocks
- missing optional fields
- malformed required numeric values
- malformed dates
- unknown fields
- multiple settlement blocks
- planned versus actual absence fields

## 2. Transformation Tests
The implementation must include transform tests for:
- correct derived brewery JSON structure
- correct overdue state when actual absence exceeds planned absence
- correct omission of overdue state when actual absence does not exceed planned absence
- correct plan and history mapping
- correct date-derived absence mapping

## 3. UI Smoke Tests
The implementation should include smoke tests for:
- brewery page loads successfully
- main brewery sections render
- history section renders
- empty states render when brewery data is absent
- no runtime JavaScript errors occur during normal page load

## 4. Regression Fixtures
The implementation should include stable sample brewery input fixtures covering:
- a normal operating batch
- a profitable week
- a loss week
- a failed batch
- a delayed return beyond planned absence
- a strong premium sale

## Acceptance Criteria
- A valid brewery snippet set in Kanka results in a valid brewery site model after build.
- The brewery page shows the active plan, settlement helper, incidents, and history without requiring raw Kanka text inspection.
- Planned and actual absence are both visible when provided.
- Returning later than planned produces an overdue state in the derived model.
- Parser and transform behavior are covered by explicit tests for valid and invalid inputs.

## Recommended Next Step
After approval of this functional specification, the next step should define:
- the exact field list for the first `brewery_plan` implementation
- the exact field list for the first `brewery_settlement` implementation
- the test fixture examples to use during implementation
