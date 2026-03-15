const BREWERY_PLAN_FIELDS = {
  plan_date: "string",
  planned_return_date: "string",
  kettle_name: "string",
  batch_name: "string",
  kettle_start_volume_liters: "number",
  efficiency: "number",
  quality: "number",
  value: "number",
  oversight: "number",
  planned_absence_weeks: "number",
  notes: "string"
};

const BREWERY_SETTLEMENT_FIELDS = {
  date: "string",
  planned_return_date: "string",
  kettle_name: "string",
  period_label: "string",
  planned_absence_weeks: "number",
  actual_absence_weeks: "number",
  production_roll: "number",
  contamination_roll: "number",
  sales_roll: "number",
  net_result_gp: "number",
  volume_produced_liters: "number",
  volume_sold_liters: "number",
  volume_spoiled_liters: "number",
  grain_used: "number",
  hops_used: "number",
  yeast_used: "number",
  batch_result: "string",
  incident: "string",
  staffing_cost: "number",
  storage_cost: "number",
  other_cost: "number",
  upgrade_purchased: "string",
  notes: "string"
};

const REQUIRED_PLAN_FIELDS = [
  "plan_date",
  "batch_name",
  "quality",
  "value",
  "oversight"
];

const REQUIRED_SETTLEMENT_FIELDS = [
  "date",
  "net_result_gp",
  "batch_result",
  "incident"
];

function parseNumber(field, value) {
  if (value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${field}: ${value}`);
  }
  return parsed;
}

function coerceField(field, value, schema) {
  const kind = schema[field];
  if (!kind) {
    return { known: false, value: null };
  }
  if (kind === "number") {
    return { known: true, value: parseNumber(field, value) };
  }
  return { known: true, value: value === "" ? null : value };
}

function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(start, end) {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

function diffWeeksRoundedUp(start, end) {
  const days = diffDays(start, end);
  if (days == null) return null;
  return Math.max(0, Math.ceil(days / 7));
}

function parseBlock(blockText, schema, requiredFields) {
  const output = {};
  const schemaFields = Object.keys(schema);
  const text = String(blockText || "").replace(/\r/g, "").trim();
  const matches = [];

  for (const field of schemaFields) {
    const pattern = new RegExp(`(^|\\s)(${field})\\s*:`, "g");
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        field,
        start: match.index + match[1].length,
        valueStart: match.index + match[0].length
      });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const rawValue = text.slice(current.valueStart, next ? next.start : text.length).trim();
    const coerced = coerceField(current.field, rawValue, schema);
    if (coerced.known) {
      output[current.field] = coerced.value;
    }
  }

  for (const requiredField of requiredFields) {
    if (!(requiredField in output) || output[requiredField] === null || output[requiredField] === "") {
      throw new Error(`Missing required field: ${requiredField}`);
    }
  }

  return output;
}

export function extractTaggedBlocks(source, tagName) {
  const text = String(source || "");
  const pattern = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, "gi");
  return [...text.matchAll(pattern)].map((match) => match[1].trim());
}

export function parseBreweryPlan(source) {
  const blocks = extractTaggedBlocks(source, "brewery_plan");
  if (!blocks.length) {
    return null;
  }
  const plan = parseBlock(blocks[0], BREWERY_PLAN_FIELDS, REQUIRED_PLAN_FIELDS);

  if (plan.efficiency == null) {
    throw new Error("Missing required field: efficiency");
  }
  if (plan.kettle_start_volume_liters == null) {
    throw new Error("Missing required field: kettle_start_volume_liters");
  }
  if (plan.planned_return_date == null && plan.planned_absence_weeks == null) {
    throw new Error("Missing required field: planned_return_date");
  }

  plan.planned_return_date = plan.planned_return_date ?? null;
  plan.planned_absence_weeks =
    plan.planned_absence_weeks ?? diffWeeksRoundedUp(plan.plan_date, plan.planned_return_date);

  return plan;
}

export function parseBrewerySettlements(source) {
  return extractTaggedBlocks(source, "brewery_settlement").map((block) => {
    const settlement = parseBlock(block, BREWERY_SETTLEMENT_FIELDS, REQUIRED_SETTLEMENT_FIELDS);
    const normalized = {
      date: settlement.date ?? null,
      planned_return_date: settlement.planned_return_date ?? null,
      kettle_name: settlement.kettle_name ?? null,
      period_label: settlement.period_label ?? null,
      planned_absence_weeks: settlement.planned_absence_weeks ?? null,
      actual_absence_weeks: settlement.actual_absence_weeks ?? null,
      production_roll: settlement.production_roll ?? null,
      contamination_roll: settlement.contamination_roll ?? null,
      sales_roll: settlement.sales_roll ?? null,
      volume_produced_liters: settlement.volume_produced_liters ?? null,
      volume_sold_liters: settlement.volume_sold_liters ?? null,
      volume_spoiled_liters: settlement.volume_spoiled_liters ?? null,
      net_result_gp: settlement.net_result_gp ?? null,
      grain_used: settlement.grain_used ?? null,
      hops_used: settlement.hops_used ?? null,
      yeast_used: settlement.yeast_used ?? null,
      batch_result: settlement.batch_result ?? null,
      incident: settlement.incident ?? null,
      notes: settlement.notes ?? null
    };

    if (normalized.production_roll == null) {
      throw new Error("Missing required field: production_roll");
    }
    if (normalized.contamination_roll == null) {
      throw new Error("Missing required field: contamination_roll");
    }
    if (normalized.volume_produced_liters == null) {
      throw new Error("Missing required field: volume_produced_liters");
    }
    if (normalized.volume_sold_liters == null) {
      throw new Error("Missing required field: volume_sold_liters");
    }
    if (normalized.volume_spoiled_liters == null) {
      throw new Error("Missing required field: volume_spoiled_liters");
    }

    return normalized;
  });
}

export function buildBreweryViewModel(source) {
  const plan = parseBreweryPlan(source);
  const history = parseBrewerySettlements(source).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const latestSettlement = history[0] ?? null;
  const hasAbsenceData = Boolean(plan || latestSettlement);
  const absence = hasAbsenceData
    ? {
        plannedWeeks: plan?.planned_absence_weeks ?? latestSettlement?.planned_absence_weeks ?? null,
        actualWeeks:
          latestSettlement?.actual_absence_weeks ??
          diffWeeksRoundedUp(plan?.plan_date, latestSettlement?.date) ??
          null,
        plannedReturnDate: plan?.planned_return_date ?? latestSettlement?.planned_return_date ?? null,
        actualReturnDate: latestSettlement?.date ?? null,
        staffingCover: null,
        storageCostPerWeek: null
      }
    : null;

  if (absence) {
    absence.isOverdue =
      Number.isFinite(absence.plannedWeeks) &&
      Number.isFinite(absence.actualWeeks) &&
      absence.actualWeeks > absence.plannedWeeks;
  }

  return {
    plan,
    latestSettlement,
    history,
    plannedBatch: plan
      ? {
          planDate: plan.plan_date ?? null,
          plannedReturnDate: plan.planned_return_date ?? null,
          kettleName: plan.kettle_name ?? null,
          batchName: plan.batch_name ?? null,
          kettleStartVolumeLiters: plan.kettle_start_volume_liters ?? null,
          efficiency: plan.efficiency ?? null,
          quality: plan.quality ?? null,
          value: plan.value ?? null,
          oversight: plan.oversight ?? null,
          planningPointsUsed:
            (plan.efficiency ?? 0) +
            (plan.quality ?? 0) +
            (plan.value ?? 0) +
            (plan.oversight ?? 0),
          notes: plan.notes ?? null
        }
      : null,
    absence
  };
}
