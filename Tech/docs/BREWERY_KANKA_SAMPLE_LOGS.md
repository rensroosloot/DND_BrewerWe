# Brewery Kanka Sample Logs

Gebruik deze fictieve logs om de brouwerijgeschiedenis in Kanka te vullen en de site op historie, trends en recente settlements te testen.

Alle snippets hieronder volgen het huidige actieve model:
- datumgedreven plan en settlement
- `kettle_start_volume_liters`
- `volume_*_liters`
- geen kostenvelden

## Actief Plan

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

## Settlement History

```text
[brewery_settlement]
date: 2025-12-18
planned_return_date: 2025-12-18
kettle_name: Copper Kettle
period_label: Winter Ale
production_roll: 14
contamination_roll: 16
sales_roll: 15
net_result_gp: 81
volume_produced_liters: 17
volume_sold_liters: 17
volume_spoiled_liters: 1
batch_result: success
incident: none
notes: Sterke winterverkoop en een schone run.
[/brewery_settlement]

[brewery_settlement]
date: 2026-01-08
planned_return_date: 2026-01-07
kettle_name: Copper Kettle
period_label: Deep Cellar Bitter
production_roll: 11
contamination_roll: 12
sales_roll: 10
net_result_gp: 42
volume_produced_liters: 19
volume_sold_liters: 14
volume_spoiled_liters: 4
batch_result: delayed
incident: none
notes: Iets later terug; bruikbaar volume bleef redelijk, maar de afzet was middelmatig.
[/brewery_settlement]

[brewery_settlement]
date: 2026-01-29
planned_return_date: 2026-01-26
kettle_name: Copper Kettle
period_label: Lantern Lager
production_roll: 9
contamination_roll: 8
sales_roll: 12
net_result_gp: 18
volume_produced_liters: 12
volume_sold_liters: 6
volume_spoiled_liters: 4
batch_result: delayed
incident: contamination
notes: Zwakke productie en besmetting zorgden voor een teleurstellende run.
[/brewery_settlement]

[brewery_settlement]
date: 2026-02-09
planned_return_date: 2026-02-09
kettle_name: Copper Kettle
period_label: Red Kettle Bitter
production_roll: 17
contamination_roll: 15
sales_roll: 13
net_result_gp: 66
volume_produced_liters: 25
volume_sold_liters: 22
volume_spoiled_liters: 2
batch_result: success
incident: none
notes: Goede opbrengst en stevige lokale afzet.
[/brewery_settlement]

[brewery_settlement]
date: 2026-02-26
planned_return_date: 2026-02-23
kettle_name: Copper Kettle
period_label: Copper Keg Ale I
production_roll: 13
contamination_roll: 11
sales_roll: 16
net_result_gp: 60
volume_produced_liters: 19
volume_sold_liters: 15
volume_spoiled_liters: 4
batch_result: delayed
incident: none
notes: Drie dagen te laat terug, maar de batch verkocht alsnog goed.
[/brewery_settlement]

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

[brewery_settlement]
date: 2026-03-26
planned_return_date: 2026-03-26
kettle_name: Copper Kettle
period_label: Copper Keg Ale III
production_roll: 18
contamination_roll: 17
sales_roll: 18
net_result_gp: 119
volume_produced_liters: 30
volume_sold_liters: 24
volume_spoiled_liters: 1
batch_result: success
incident: none
notes: Een van de beste runs tot nu toe; schoon, groot en goed verkocht.
[/brewery_settlement]

[brewery_settlement]
date: 2026-04-16
planned_return_date: 2026-04-14
kettle_name: Copper Kettle
period_label: Barley March
production_roll: 12
contamination_roll: 9
sales_roll: 11
net_result_gp: 30
volume_produced_liters: 19
volume_sold_liters: 10
volume_spoiled_liters: 5
batch_result: delayed
incident: storage-loss
notes: Een matige batch die te lijden had onder late terugkeer en extra verlies.
[/brewery_settlement]
```

## Gebruik

1. Plak het plan en de settlements in de Kanka-entry van de brouwerij.
2. Draai daarna je normale sync/build flow.
3. Controleer op de brewery-pagina:
   - de recente settlements
   - de trendgrafiek
   - verschillende uitkomsten zoals `success`, `delayed`, `contamination` en `storage-loss`
