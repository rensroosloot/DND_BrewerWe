# MAP_PIN Functional Spec

## Goal

Provide a single Kanka block format for everything that can appear on the world map:

- locations
- persons
- quests
- miscellaneous markers

The site should parse these blocks into `docs/data/map-pins.json`, while still supporting legacy location metadata during migration.

## Canonical Block

```text
[map_pin]
id: high-moor
label: High Moor
entity_type: location
entity_ref: High Moor
map_x: 54.08
map_y: 45.14
notes: Dangerous moorland with ruined sites.
[/map_pin]
```

## Fields

- `id`
  - required
  - unique technical identifier for the pin
- `label`
  - required
  - user-facing label for map and sidebar
- `entity_type`
  - required
  - one of `location | person | quest | misc`
- `entity_ref`
  - required
  - name or reference of the linked public entity
- `map_x`
  - required
  - percentage on the map, `0-100`
- `map_y`
  - required
  - percentage on the map, `0-100`
- `notes`
  - optional
  - short public map note

## Runtime Model

Pins are rendered from JSON with this normalized shape:

```json
{
  "id": "high-moor",
  "label": "High Moor",
  "entityType": "location",
  "entityRef": "High Moor",
  "x": 54.08,
  "y": 45.14,
  "notes": "Dangerous moorland with ruined sites.",
  "sourceModule": "locations",
  "sourceRecordId": 2022248
}
```

## Rendering Rules

- `entityType: location` -> standard marker
- `entityType: person` -> person marker
- `entityType: quest` -> sword marker
- `entityType: misc` -> question-mark marker
- active selection is visual highlight only and must not change the semantic icon

## Validation Rules

- `id` must be unique across the generated pin set
- `map_x` must be numeric and within `0-100`
- `map_y` must be numeric and within `0-100`
- duplicate pin ids must fail the build instead of silently overwriting pins

## Migration Rule

Legacy `map_x` / `map_y` metadata embedded directly in location text remains supported during transition, but `map_pin` blocks are the preferred format going forward.
