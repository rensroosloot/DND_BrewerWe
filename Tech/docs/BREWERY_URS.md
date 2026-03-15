# Brewery User Requirements Specification

## Purpose
The brewery system must function as a recurring campaign anchor that gives players a clear reason to return to the business, make operational decisions, and experience the effects of investment or neglect over time.

## Scope Statement
The brewery is treated as a living venture within the campaign. Its state is driven by in-game events and dice rolls, then recorded in structured form in Kanka. The website reads that state and presents it as a player-facing operations board showing progress, risks, production, stock, and growth.

## Business Goals
- Make the brewery an ongoing campaign objective rather than a static location.
- Give downtime meaningful consequences and opportunities.
- Reward active stewardship of the brewery.
- Penalize prolonged neglect or under-management.
- Support long-term growth through upgrades, staffing, and operational improvements.

## User Goals

### Players
- Players must be able to see the current operational state of the brewery between sessions.
- Players must be able to understand what is brewing, what is ready, and what is at risk.
- Players must be able to review the effects of in-game rolls after settlements are recorded.
- Players must be able to track stock levels, active batches, and recent incidents.
- Players must be able to understand what upgrades, boons, or staffing options are currently active.
- Players should be able to prepare decisions during downtime based on current brewery status.
- Players must be able to decide in game how long they intend to leave the brewery unattended.
- Players must be able to understand the risks and costs of choosing a longer return interval.

### Maintainers
- Maintainers must be able to record settlement outcomes after in-game dice rolls.
- Maintainers must be able to update brewery state using a structured copy-paste workflow in Kanka.
- Maintainers must be able to reflect upgrades, incidents, staffing, and stock changes without a separate admin application.
- Maintainers should be able to preserve historical settlements for later review.

## In Scope
- Structured brewery state stored in Kanka content.
- Structured settlement history stored in Kanka content.
- Site rendering of brewery finances, production, stock, incidents, staffing, and upgrades.
- Visual presentation of brewery status, not only text.
- Operational consequences of neglect or absence.
- Planned return intervals and actual elapsed absence.
- Mitigation options such as staffing, delegation, or boons.
- Support for future brewery upgrades and capacity changes.

## Out of Scope
- Automatic dice rolling on the website.
- A full economic simulation engine in the first phase.
- Direct write-back from the website to Kanka.
- Real-time collaborative editing on the website.
- Full bookkeeping or accounting workflows.

## Functional Requirements
- The system must support recording brewery state through predefined structured text blocks stored in Kanka.
- The system must support recording one or more brewery settlement records through predefined structured text blocks stored in Kanka.
- The system must support a workflow where the site can present a copy-paste-ready snippet for manual insertion into Kanka.
- The system must display the current brewery state to players on the website.
- The system must display historical settlement records to players on the website.
- The system must track and display operational outcomes including profit, loss, failed batches, spoilage, and incidents.
- The system must support a lightweight economic model that includes revenue, operational costs, and stock changes.
- The system must represent brewery operations across raw materials, active production, and finished goods.
- The system must support stock tracking for both ingredients and saleable products.
- The system must support multiple active or recent production states, such as brewing, fermenting, conditioning, and ready for sale.
- The system must support upgrades that alter capacity, resilience, efficiency, or available options.
- The system must support temporary operational measures such as hired help, delegated oversight, or protective boons.
- The system must support negative operational outcomes when the brewery is left unmanaged across one or more settlement periods.
- The system must support recording a planned return date or planned absence duration selected by the players.
- The system must support recording the actual elapsed absence period when the players return.
- The system must distinguish between planned absence and actual elapsed absence.
- The system must support additional penalties when the brewery remains unattended longer than planned.
- The system must support ongoing costs during absence, such as staffing, delegation, storage, or upkeep.
- The system must support visual representation of brewery progress, stock, and risks in addition to text.
- The system must support batch planning where the amount of input material can scale independently from the operational planning-point allocation.
- The system must support a model where efficiency primarily affects production output, while quality and oversight primarily affect contamination and unattended risk.

## Player Interaction Requirements
- Players must be able to review brewery progress during downtime without editing raw source files.
- Players must be able to understand current brewery health from a single page view.
- Players must be able to see what resources are ready for use or sale.
- Players must be able to see what is currently in production.
- Players must be able to see recent changes caused by dice results or incidents.
- Players should be able to distinguish clearly between current state, active issues, and future opportunities.
- Players must be able to see how long the brewery is expected to run without direct oversight.
- Players must be able to see when the brewery has exceeded its intended unattended interval.

## Data Entry Requirements
- The site must support a structured manual update flow rather than relying on free-form text interpretation alone.
- The structured input format must be strict enough to parse reliably.
- The input format must be simple enough to maintain manually in Kanka.
- The system should support both a current-state block and repeated historical settlement blocks.

## Non-Functional Requirements
- Kanka must remain the primary input source for brewery state in the first phase.
- The website must function without a dedicated backend service.
- The model must be extensible for future additions such as more upgrades, more stock categories, and additional venture rules.
- The site must remain readable for players and must not require knowledge of the underlying input format.
- The brewery interface should prioritize visual comprehension over dense operational text alone.
- The system must remain extensible for future time-based operational rules such as spoilage windows, staffing decay, and storage limits.

## Assumptions
- In-game dice rolls are resolved at the table, not by the website.
- Settlement outcomes are recorded after or during sessions by a campaign maintainer.
- Kanka content can safely contain structured snippets alongside narrative text.
- The brewery may grow in complexity over time, requiring upgrades and additional state fields.
- Players may intentionally choose to leave the brewery unattended for varying lengths of time.
- Actual campaign time away from the brewery may exceed the originally planned interval.

## Success Criteria
- Players can open the brewery page and understand the current operational state quickly.
- Maintainers can record brewery outcomes through a repeatable Kanka-based workflow.
- The site can show finances, stock, production, incidents, staffing, and upgrades from structured source data.
- The brewery creates visible consequences for neglect and visible rewards for investment.
- The system can expand in later phases without replacing the basic Kanka-driven workflow.
- The site can show both planned and actual brewery absence and the resulting consequences.
