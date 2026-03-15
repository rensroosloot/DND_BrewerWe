import test from "node:test";
import assert from "node:assert/strict";
import { buildBreweryViewModel, parseBreweryPlan, parseBrewerySettlements } from "../brewery-schema.mjs";

const SAMPLE = `
[brewery_plan]
plan_date: 2026-03-10
planned_return_date: 2026-03-24
kettle_name: Copper Kettle
batch_name: Copper Keg Ale
kettle_start_volume_liters: 30
efficiency: 2
quality: 1
value: 1
oversight: 0
planned_absence_weeks: 2
notes: Balanced batch prepared before leaving town.
[/brewery_plan]

[brewery_settlement]
date: 2026-03-11
planned_return_date: 2026-03-24
kettle_name: Copper Kettle
period_label: Downtime after Session 8
planned_absence_weeks: 2
actual_absence_weeks: 5
production_roll: 15
contamination_roll: 13
sales_roll: 16
net_result_gp: 40
volume_produced_liters: 6
volume_sold_liters: 4
volume_spoiled_liters: 1
grain_used: 2
hops_used: 1
yeast_used: 1
batch_result: delayed
incident: storage-loss
notes: Returned later than planned.
[/brewery_settlement]
`;

test("parse brewery plan", () => {
  const plan = parseBreweryPlan(SAMPLE);
  assert.equal(plan.kettle_name, "Copper Kettle");
  assert.equal(plan.planned_return_date, "2026-03-24");
  assert.equal(plan.batch_name, "Copper Keg Ale");
  assert.equal(plan.kettle_start_volume_liters, 30);
  assert.equal(plan.efficiency, 2);
  assert.equal(plan.planned_absence_weeks, 2);
});

test("parse plan fields with spaces before colon", () => {
  const plan = parseBreweryPlan(`
[brewery_plan]
plan_date: 2026-03-12
planned_return_date: 2026-03-26
batch_name: Copper Keg Ale
kettle_start_volume_liters : 30
efficiency : 2
quality: 1
value : 1
oversight: 0
[/brewery_plan]
`);

  assert.equal(plan.kettle_start_volume_liters, 30);
  assert.equal(plan.efficiency, 2);
  assert.equal(plan.value, 1);
  assert.equal(plan.planned_absence_weeks, 2);
});

test("brewery plan requires start volume and efficiency", () => {
  assert.throws(
    () =>
      parseBreweryPlan(`
[brewery_plan]
plan_date: 2026-03-12
planned_return_date: 2026-03-26
batch_name: Missing Startvolume Ale
efficiency: 2
quality: 1
value: 1
oversight: 0
[/brewery_plan]
`),
    /Missing required field: kettle_start_volume_liters/
  );
});

test("parse repeated settlements", () => {
  const settlements = parseBrewerySettlements(SAMPLE);
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].kettle_name, "Copper Kettle");
  assert.equal(settlements[0].production_roll, 15);
  assert.equal(settlements[0].contamination_roll, 13);
  assert.equal(settlements[0].sales_roll, 16);
  assert.equal(settlements[0].volume_produced_liters, 6);
  assert.equal(settlements[0].actual_absence_weeks, 5);
});

test("derive overdue absence without brewery state", () => {
  const brewery = buildBreweryViewModel(SAMPLE);
  assert.equal(brewery.plannedBatch.kettleName, "Copper Kettle");
  assert.equal(brewery.plannedBatch.plannedReturnDate, "2026-03-24");
  assert.equal(brewery.plannedBatch.batchName, "Copper Keg Ale");
  assert.equal(brewery.plannedBatch.kettleStartVolumeLiters, 30);
  assert.equal(brewery.plannedBatch.efficiency, 2);
  assert.equal(brewery.plannedBatch.planningPointsUsed, 4);
  assert.equal(brewery.absence.plannedWeeks, 2);
  assert.equal(brewery.absence.actualWeeks, 5);
  assert.equal(brewery.absence.isOverdue, true);
});

test("plan can derive planned absence weeks from dates", () => {
  const plan = parseBreweryPlan(`
[brewery_plan]
plan_date: 2026-03-10
planned_return_date: 2026-03-24
batch_name: Date Driven Ale
kettle_start_volume_liters: 20
efficiency: 1
quality: 1
value: 1
oversight: 1
[/brewery_plan]
`);

  assert.equal(plan.planned_absence_weeks, 2);
});

test("invalid numeric values throw in settlements", () => {
  assert.throws(
    () =>
      parseBrewerySettlements(`
[brewery_settlement]
date: 2026-03-11
production_roll: nope
contamination_roll: 11
sales_roll: 14
net_result_gp: 20
volume_produced_liters: 8
volume_sold_liters: 7
volume_spoiled_liters: 1
batch_result: success
incident: none
[/brewery_settlement]
`),
    /Invalid numeric value/
  );
});
