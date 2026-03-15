import test from "node:test";
import assert from "node:assert/strict";
import { extractLegacyLocationPin, extractMapPinsFromRecord } from "../map-pin-schema.mjs";

test("parse map_pin block from rich html", () => {
  const record = {
    id: 1,
    name: "High Moor",
    fullHtml:
      "[map_pin]<br><br>id: high-moor<br><br>label: High Moor<br><br>entity_type: location<br><br>entity_ref: High Moor<br><br>map_x: 54.08<br><br>map_y: 45.14<br><br>[/map_pin]"
  };

  const pins = extractMapPinsFromRecord(record, "locations");
  assert.equal(pins.length, 1);
  assert.deepEqual(pins[0], {
    id: "high-moor",
    label: "High Moor",
    entityType: "location",
    entityRef: "High Moor",
    x: 54.08,
    y: 45.14,
    notes: null,
    sourceModule: "locations",
    sourceRecordId: 1
  });
});

test("default pin and entity types derive from module", () => {
  const record = {
    id: 2,
    name: "Lost Ledger",
    fullHtml:
      "[map_pin]<br><br>label: Lost Ledger<br><br>map_x: 12.4<br><br>map_y: 55.7<br><br>[/map_pin]"
  };

  const pins = extractMapPinsFromRecord(record, "quests");
  assert.equal(pins[0].entityType, "quest");
  assert.equal(pins[0].id, "lost-ledger");
});

test("legacy location pins still parse", () => {
  const record = {
    id: 3,
    name: "Orogoth",
    fullText: "map_x: 58.19 map_y: 43.34 Ancient city"
  };

  const pin = extractLegacyLocationPin(record);
  assert.deepEqual(pin, {
    id: "orogoth",
    label: "Orogoth",
    entityType: "location",
    entityRef: "Orogoth",
    x: 58.19,
    y: 43.34,
    notes: null,
    sourceModule: "locations",
    sourceRecordId: 3
  });
});

test("reject out-of-range coordinates", () => {
  const record = {
    id: 4,
    name: "Broken Pin",
    fullHtml:
      "[map_pin]<br><br>label: Broken Pin<br><br>entity_type: misc<br><br>entity_ref: Broken Pin<br><br>map_x: 101<br><br>map_y: 40<br><br>[/map_pin]"
  };

  assert.throws(() => extractMapPinsFromRecord(record, "items"), /Invalid map_x/);
});
