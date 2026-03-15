import { loadJson, renderCard, renderGrid, setError, setGeneratedAt } from "./site.js";

const MAX_PLANNING_POINTS = 4;

function formatLiters(value) {
  if (value == null || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return `${amount} liter`;
}

function renderMetric(label, value) {
  return `<div class="brewery-metric"><span>${label}</span><strong>${value ?? "-"}</strong></div>`;
}

function initTabs(root) {
  const buttons = [...root.querySelectorAll("[data-tab-target]")];
  const panels = [...root.querySelectorAll("[data-tab-panel]")];
  const activate = (target) => {
    buttons.forEach((button) => {
      const active = button.dataset.tabTarget === target;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((panel) => {
      const active = panel.dataset.tabPanel === target;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(button.dataset.tabTarget));
  });
}

function initBreweryMotion(root = document) {
  const animated = [...root.querySelectorAll(".brewery-panel, .brewery-story-intro, .brewery-disclosure")];
  animated.forEach((node, index) => {
    node.classList.add("brewery-reveal");
    node.style.setProperty("--brewery-reveal-delay", `${Math.min(index, 8) * 55}ms`);
  });

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;

  animated.forEach((node) => {
    if (!observer) {
      node.classList.add("is-visible");
      return;
    }
    observer.observe(node);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return formatIsoDate();
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

function diffDays(start, end) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

function diffWeeksRoundedUp(start, end) {
  const days = diffDays(start, end);
  if (days == null) return null;
  return Math.max(0, Math.ceil(days / 7));
}

function renderHistoryEntry(item) {
  return `
    <article class="entry-card">
      <h3>${escapeHtml(item.period_label || item.date)}</h3>
      <p class="meta">${escapeHtml(item.date)}</p>
      <div class="brewery-metrics">
        ${renderMetric("Productie", item.production_roll ?? item.profit_roll)}
        ${renderMetric("Contaminatie", item.contamination_roll ?? item.loss_roll)}
        ${renderMetric("Verkoop", item.sales_roll)}
        ${renderMetric("Netto gp", item.net_result_gp)}
      </div>
      <p><strong>Batch:</strong> ${escapeHtml(item.batch_result)}</p>
      <p><strong>Incident:</strong> ${escapeHtml(item.incident)}</p>
      ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}
    </article>
  `;
}

function renderRuleCard(item) {
  return `
    <article class="entry-card">
      <h3>${item.name}</h3>
      ${item.formula ? `<p class="meta">${item.formula}</p>` : ""}
      <p>${item.summary || item.outcome || ""}</p>
    </article>
  `;
}

function productionPercent(total) {
  if (total >= 20) return 1;
  if (total >= 15) return 0.85;
  if (total >= 10) return 0.65;
  return 0.4;
}

function spoilagePercent(total, quality) {
  if (total >= 20) return 0;
  if (total >= 15) return quality >= 2 ? 0.05 : 0.1;
  if (total >= 10) return quality >= 2 ? 0.15 : 0.25;
  return quality >= 2 ? 0.35 : 0.5;
}

function salesPrice(total) {
  if (total >= 20) return 7;
  if (total >= 15) return 5;
  if (total >= 10) return 3;
  return 1;
}

function createField(label, input) {
  return `
    <label class="resolution-field">
      <span>${label}</span>
      ${input}
    </label>
  `;
}

function buildPlanSnippet(values) {
  const lines = [
    "[brewery_plan]",
    `plan_date: ${values.planDate}`,
    `planned_return_date: ${values.plannedReturnDate}`,
    `kettle_name: ${values.kettleName}`,
    `batch_name: ${values.batchName}`,
    `kettle_start_volume_liters: ${values.kettleStartVolumeLiters}`,
    `efficiency: ${values.efficiency}`,
    `quality: ${values.quality}`,
    `value: ${values.value}`,
    `oversight: ${values.oversight}`
  ];
  if (values.notes) {
    lines.push(`notes: ${values.notes}`);
  }
  lines.push("[/brewery_plan]");
  return lines.join("\n");
}

function renderPlannerAxisGuide(rules, plan = null) {
  const axes = rules?.axes ?? [];
  if (!axes.length) {
    return "";
  }

  const axisValueFor = (name) => {
    if (name === "Efficiency") return plan?.efficiency ?? 0;
    if (name === "Quality") return plan?.quality ?? 0;
    if (name === "Value") return plan?.value ?? 0;
    return plan?.oversight ?? 0;
  };

  return `
    <div class="planner-guide">
      <p class="eyebrow">Waar verdeel je op?</p>
      <p class="planner-guide-intro">Verdeel precies ${MAX_PLANNING_POINTS} punten over deze vier eigenschappen. Elke punt maakt duidelijker waar deze batch op leunt.</p>
      <div class="planner-guide-grid">
          ${axes
            .map(
              (axis) => `
                <article class="planner-guide-card">
                  <div class="planner-guide-copy">
                    <h4>${axis.name}</h4>
                    <p>${axis.summary}</p>
                  </div>
                  <label class="planner-guide-input">
                    <span>Punten</span>
                    <input type="number" min="0" max="${MAX_PLANNING_POINTS}" value="${axisValueFor(axis.name)}" data-plan="${axis.name.toLowerCase()}">
                  </label>
                </article>
              `
            )
            .join("")}
      </div>
    </div>
  `;
}

function renderPlannerBatchCards(plan = null) {
  const cards = [
    {
      title: "Ketelstartvolume",
      description: "De liters waarmee deze run in de ketel begint. Dit is de start van de batch, niet de uiteindelijke opbrengst.",
      fieldLabel: "Liter",
      input: `<input type="number" min="1" value="${plan?.kettleStartVolumeLiters ?? 30}" data-plan="kettle-start-volume">`
    },
    {
      title: "Naam van de ketel",
      description: "Gebruik een vaste naam per ketel, zodat meerdere ketels later apart gevolgd kunnen worden.",
      fieldLabel: "Ketel",
      input: `<input type="text" value="${escapeHtml(plan?.kettleName ?? "Copper Kettle")}" data-plan="kettle-name" placeholder="Copper Kettle">`
    },
    {
      title: "Batchnaam",
      description: "De naam van deze specifieke run. Dit is de herkenbare titel die je later in Kanka en in de historie terugziet.",
      fieldLabel: "Batch",
      input: `<input type="text" value="${escapeHtml(plan?.batchName ?? "")}" data-plan="batch-name" placeholder="Copper Keg Ale">`
    }
  ];

  return `
    <div class="planner-guide">
      <p class="eyebrow">Welke batch zet je klaar?</p>
      <div class="planner-batch-grid">
        ${cards
          .map(
            (card) => `
              <article class="planner-guide-card planner-batch-card">
                <div class="planner-guide-copy">
                  <h4>${card.title}</h4>
                  <p>${card.description}</p>
                </div>
                <label class="planner-guide-input">
                  <span>${card.fieldLabel}</span>
                  ${card.input}
                </label>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderBatchPlanner(plan = null, rules = null) {
  return `
    <p class="eyebrow">Nieuwe brewery_plan</p>
    <h3>Plan de volgende batch</h3>
    <div class="planner-date-row">
      ${createField("Plan datum", `<input type="date" value="${plan?.planDate ?? formatIsoDate()}" data-plan="plan-date">`)}
      ${createField("Geplande terugkeer", `<input type="date" value="${plan?.plannedReturnDate ?? addDays(plan?.planDate ?? formatIsoDate(), 14)}" data-plan="planned-return-date">`)}
    </div>
    ${renderPlannerAxisGuide(rules, plan)}
    ${renderPlannerBatchCards(plan)}
    <div class="resolution-grid planner-grid">
      ${createField("Notities", `<input type="text" value="${escapeHtml(plan?.notes ?? "")}" data-plan="notes" placeholder="Korte notitie voor Kanka">`)}
    </div>
    <div class="planner-status" data-plan-status></div>
    <div class="snippet-card">
      <div class="snippet-head">
        <strong>Kanka snippet</strong>
      </div>
      <textarea class="snippet-output" data-plan-snippet readonly></textarea>
    </div>
  `;
}

function renderReadOnlyCard(title, description, label, value, extraClass = "") {
  return `
    <article class="planner-guide-card ${extraClass}">
      <div class="planner-guide-copy">
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
      <div class="planner-guide-input planner-guide-value">
        <span>${label}</span>
        <strong>${escapeHtml(value ?? "-")}</strong>
      </div>
    </article>
  `;
}

function readPlannerValues(root) {
  const text = (selector) => String(root.querySelector(selector)?.value ?? "").trim();
  const num = (selector) => Number(root.querySelector(selector)?.value ?? 0);
  return {
    planDate: text('[data-plan="plan-date"]'),
    plannedReturnDate: text('[data-plan="planned-return-date"]'),
    kettleName: text('[data-plan="kettle-name"]'),
    batchName: text('[data-plan="batch-name"]'),
    kettleStartVolumeLiters: num('[data-plan="kettle-start-volume"]'),
    efficiency: num('[data-plan="efficiency"]'),
    quality: num('[data-plan="quality"]'),
    value: num('[data-plan="value"]'),
    oversight: num('[data-plan="oversight"]'),
    notes: text('[data-plan="notes"]')
  };
}

function getPlanningAxisInputs(root) {
  return [...root.querySelectorAll('[data-plan="efficiency"], [data-plan="quality"], [data-plan="value"], [data-plan="oversight"]')];
}

function constrainPlanningInputs(root) {
  const axisInputs = getPlanningAxisInputs(root);
  const axisValues = Object.fromEntries(
    axisInputs.map((input) => {
      const raw = Number(input.value ?? 0);
      const safe = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
      return [input.dataset.plan, safe];
    })
  );

  axisInputs.forEach((input) => {
    const current = axisValues[input.dataset.plan] ?? 0;
    const otherSpent = Object.entries(axisValues).reduce((sum, [key, value]) => {
      return key === input.dataset.plan ? sum : sum + value;
    }, 0);
    const allowedMax = Math.max(0, MAX_PLANNING_POINTS - otherSpent);
    const clamped = Math.min(current, allowedMax);
    input.max = String(allowedMax);
    input.value = String(clamped);
    axisValues[input.dataset.plan] = clamped;
  });
}

function updateBatchPlanner(root) {
  constrainPlanningInputs(root);
  const values = readPlannerValues(root);
  const spent = values.efficiency + values.quality + values.value + values.oversight;
  const remaining = MAX_PLANNING_POINTS - spent;
  const errors = [];

  if (!values.planDate) errors.push("Vul een datum in.");
  if (!values.plannedReturnDate) errors.push("Vul een geplande terugkeerdatum in.");
  if (!values.kettleName) errors.push("Vul een ketelnaam in.");
  if (!values.batchName) errors.push("Vul een batchnaam in.");
  if (values.kettleStartVolumeLiters <= 0) errors.push("Het ketelstartvolume moet groter zijn dan 0.");
  if (values.planDate && values.plannedReturnDate) {
    const plannedDays = diffDays(values.planDate, values.plannedReturnDate);
    if (plannedDays == null || plannedDays < 0) {
      errors.push("De geplande terugkeer moet op of na de plandatum liggen.");
    }
  }
  if (spent > MAX_PLANNING_POINTS) errors.push(`Je hebt ${spent} punten verdeeld; maximaal ${MAX_PLANNING_POINTS} is toegestaan.`);
  if (spent < MAX_PLANNING_POINTS) errors.push(`Er moeten precies ${MAX_PLANNING_POINTS} punten verdeeld zijn. Nog ${remaining} over.`);

  const status = root.querySelector("[data-plan-status]");
  const snippet = root.querySelector("[data-plan-snippet]");
  if (status) {
    const plannedDays = diffDays(values.planDate, values.plannedReturnDate);
    status.innerHTML = `
      <div class="brewery-metrics">
        ${renderMetric("Punten gebruikt", `${spent} / ${MAX_PLANNING_POINTS}`)}
        ${renderMetric("Geplande dagen", plannedDays == null ? "-" : Math.max(plannedDays, 0))}
        ${renderMetric("Status", errors.length ? "Niet geldig" : "Klaar voor Kanka")}
      </div>
      ${errors.length ? `<p class="validation-error">${errors.join(" ")}</p>` : '<p class="validation-ok">De snippet is geldig en klaar om in Kanka te plakken.</p>'}
    `;
  }

  if (snippet) {
    snippet.value = errors.length ? "" : buildPlanSnippet(values);
  }
}

function renderCurrentPlan(plan) {
  if (!plan) {
    return '<p class="empty">Nog geen actieve brewery_plan in Kanka gevonden.</p>';
  }

  const plannedDays = diffDays(plan.planDate, plan.plannedReturnDate);

  const snippet = buildPlanSnippet({
    planDate: plan.planDate ?? formatIsoDate(),
    kettleName: plan.kettleName ?? "",
    batchName: plan.batchName ?? "",
    kettleStartVolumeLiters: plan.kettleStartVolumeLiters ?? 0,
    efficiency: plan.efficiency ?? 0,
    quality: plan.quality ?? 0,
    value: plan.value ?? 0,
    oversight: plan.oversight ?? 0,
    plannedReturnDate: plan.plannedReturnDate ?? addDays(plan.planDate ?? formatIsoDate(), 14),
    notes: plan.notes ?? ""
  });

  return `
    <p class="eyebrow">Actieve brewery_plan</p>
    <h3>${escapeHtml(plan.batchName)}</h3>
    <p>Lees hier eerst terug wat er precies is gepland. Dit is het vertrekpunt voor de settlement die je hiernaast afhandelt.</p>
    <div class="planner-batch-grid run-detail-grid">
      ${renderReadOnlyCard(
        "Plan datum",
        "De datum waarop deze run is opgezet en in Kanka is vastgelegd.",
        "Datum",
        plan.planDate ?? "-",
        "planner-batch-card"
      )}
      ${renderReadOnlyCard(
        "Geplande terugkeer",
        "De datum waarop de groep volgens plan terug zou zijn om deze batch te controleren en registreren.",
        "Datum",
        plan.plannedReturnDate ?? "-",
        "planner-batch-card"
      )}
    </div>
    <div class="planner-guide">
      <p class="eyebrow">Wat was de opzet?</p>
      <div class="planner-batch-grid">
        ${renderReadOnlyCard(
          "Ketelstartvolume",
          "De liters waarmee deze run begon. Dit is de geplande inzet waarmee je de settlement nu afzet.",
          "Liter",
          plan.kettleStartVolumeLiters,
          "planner-batch-card"
        )}
        ${renderReadOnlyCard(
          "Naam van de ketel",
          "De ketel waarop deze run is vastgelegd. Handig zodra je later meerdere ketels tegelijk wilt volgen.",
          "Ketel",
          plan.kettleName ?? "-",
          "planner-batch-card"
        )}
        ${renderReadOnlyCard(
          "Batchnaam",
          "De naam waaronder deze run in Kanka en in de historie terugkomt.",
          "Batch",
          plan.batchName ?? "-",
          "planner-batch-card"
        )}
      </div>
    </div>
    <div class="planner-guide">
      <p class="eyebrow">Waar leunde de batch op?</p>
      <div class="planner-guide-grid">
        ${renderReadOnlyCard("Efficiency", "Hoe goed de brouwerij het ketelstartvolume omzet in bruikbaar product.", "Punten", plan.efficiency)}
        ${renderReadOnlyCard("Quality", "Hoe goed de batch schoon blijft en zijn waarde vasthoudt.", "Punten", plan.quality)}
        ${renderReadOnlyCard("Value", "Hoe sterk de batch op marktwaarde en prijs mikt.", "Punten", plan.value)}
        ${renderReadOnlyCard("Oversight", "Hoeveel toezicht de batch kreeg terwijl de groep weg was.", "Punten", plan.oversight)}
      </div>
    </div>
    <div class="brewery-metrics">
      ${renderMetric("Punten gebruikt", `${plan.planningPointsUsed} / ${MAX_PLANNING_POINTS}`)}
      ${renderMetric("Geplande dagen", plannedDays == null ? "-" : Math.max(plannedDays, 0))}
    </div>
    ${plan.notes ? `<p class="brewery-story-intro"><strong>Plan notitie.</strong> ${escapeHtml(plan.notes)}</p>` : ""}
    <div class="snippet-card">
      <div class="snippet-head">
        <strong>Huidige plan-snippet</strong>
      </div>
      <textarea class="snippet-output" readonly>${escapeHtml(snippet)}</textarea>
    </div>
  `;
}

function determineBatchOutcome({ produced, spoiled, contaminationTotal, overdueWeeks }) {
  if (produced <= 0) return "failed";
  if (spoiled >= produced) return "spoiled";
  if (contaminationTotal < 10 || overdueWeeks > 0) return "delayed";
  return "success";
}

function determineIncident({ contaminationTotal, overdueWeeks }) {
  if (contaminationTotal < 10 && overdueWeeks > 0) return "storage-loss";
  if (contaminationTotal < 10) return "contamination";
  return "none";
}

function buildSettlementSnippet(plan, resolution, inputs) {
  const lines = [
    "[brewery_settlement]",
    `date: ${inputs.date}`,
    `planned_return_date: ${plan.plannedReturnDate ?? ""}`,
    `kettle_name: ${plan.kettleName ?? ""}`,
    `period_label: ${inputs.periodLabel}`,
    `production_roll: ${inputs.productionRoll}`,
    `contamination_roll: ${inputs.contaminationRoll}`,
    `sales_roll: ${inputs.salesRoll}`,
    `net_result_gp: ${resolution.netGp}`,
    `volume_produced_liters: ${resolution.produced}`,
    `volume_sold_liters: ${resolution.sold}`,
    `volume_spoiled_liters: ${resolution.spoiled}`,
    `batch_result: ${resolution.batchResult}`,
    `incident: ${resolution.incident}`
  ];
  if (inputs.notes) {
    lines.push(`notes: ${inputs.notes}`);
  }
  lines.push("[/brewery_settlement]");
  return lines.join("\n");
}

function renderResolutionCalculator(plan, absence) {
  return `
    <p class="eyebrow">Settlement helper</p>
    <h3>Verwerk de actieve run</h3>
    <p>Volg hier dezelfde volgorde als aan tafel: rol eerst de drie checks, leg daarna settlementdetails vast, en neem pas dan de uitkomst over in Kanka.</p>
    <div class="planner-guide">
      <p class="eyebrow">1. Rol de drie checks</p>
      <div class="planner-batch-grid run-roll-grid">
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Settlement datum</h4>
            <p>De daadwerkelijke datum waarop de groep terug is en de run wordt afgehandeld.</p>
          </div>
          <label class="planner-guide-input">
            <span>Datum</span>
            <input type="date" value="${plan.plannedReturnDate ?? formatIsoDate()}" data-roll="date">
          </label>
        </article>
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Productierol</h4>
            <p>Rol de productiecheck voor deze batch. Efficiency wordt later automatisch meegerekend in de uitkomst.</p>
          </div>
          <label class="planner-guide-input">
            <span>d20</span>
            <input type="number" min="1" max="20" value="10" data-roll="production">
          </label>
        </article>
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Contaminatierol</h4>
            <p>Rol de check die bepaalt hoeveel van het volume schoon blijft en of er incidenten ontstaan.</p>
          </div>
          <label class="planner-guide-input">
            <span>d20</span>
            <input type="number" min="1" max="20" value="10" data-roll="contamination">
          </label>
        </article>
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Verkooprol</h4>
            <p>Rol de check die prijs en afzet bepaalt voor het bruikbare volume.</p>
          </div>
          <label class="planner-guide-input">
            <span>d20</span>
            <input type="number" min="1" max="20" value="10" data-roll="sales">
          </label>
        </article>
      </div>
    </div>
    <div class="planner-guide">
      <p class="eyebrow">2. Leg de settlement vast</p>
      <div class="planner-batch-grid run-detail-grid">
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Periodelabel</h4>
            <p>Een herkenbare titel voor deze settlement in Kanka en in je historielijst.</p>
          </div>
          <label class="planner-guide-input">
            <span>Label</span>
            <input type="text" value="${escapeHtml(`Run ${plan.planDate ?? formatIsoDate()}`)}" data-roll="period-label">
          </label>
        </article>
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Notities</h4>
            <p>Leg in een korte zin vast wat er narratief is gebeurd, zodat de settlement later nog te lezen is.</p>
          </div>
          <label class="planner-guide-input">
            <span>Notitie</span>
            <input type="text" value="" data-roll="notes" placeholder="Korte samenvatting voor Kanka">
          </label>
        </article>
        <article class="planner-guide-card planner-batch-card">
          <div class="planner-guide-copy">
            <h4>Afwezigheid</h4>
            <p>Deze kaart leest de datums uit het plan en laat zien of de groep op tijd terug was of hoeveel vertraging de batch opliep.</p>
          </div>
          <div class="planner-guide-input planner-guide-value">
            <span>Status</span>
            <strong data-roll-absence-summary>Wordt berekend</strong>
          </div>
        </article>
      </div>
    </div>
    <div class="planner-guide">
      <p class="eyebrow">3. Bekijk de uitkomst</p>
    </div>
    <div class="brewery-metrics resolution-summary" data-resolution-output></div>
    <div class="resolution-notes" data-resolution-notes></div>
    <div class="snippet-card">
      <div class="snippet-head">
        <strong>Settlement snippet</strong>
      </div>
      <textarea class="snippet-output" data-resolution-snippet readonly></textarea>
    </div>
    <input type="hidden" data-plan-start-volume value="${plan.kettleStartVolumeLiters}">
    <input type="hidden" data-plan-efficiency value="${plan.efficiency}">
    <input type="hidden" data-plan-quality value="${plan.quality}">
    <input type="hidden" data-plan-value value="${plan.value}">
    <input type="hidden" data-plan-oversight value="${plan.oversight}">
    <input type="hidden" data-plan-date value="${plan.planDate ?? ""}">
    <input type="hidden" data-plan-return-date value="${plan.plannedReturnDate ?? ""}">
    <input type="hidden" data-plan-kettle-name value="${escapeHtml(plan.kettleName ?? "")}">
  `;
}

function updateResolutionCalculator(root, plan) {
  const readNumber = (selector) => Number(root.querySelector(selector)?.value ?? 0);
  const readText = (selector) => String(root.querySelector(selector)?.value ?? "").trim();

  const inputs = {
    date: readText('[data-roll="date"]'),
    periodLabel: readText('[data-roll="period-label"]'),
    productionRoll: readNumber('[data-roll="production"]'),
    contaminationRoll: readNumber('[data-roll="contamination"]'),
    salesRoll: readNumber('[data-roll="sales"]'),
    notes: readText('[data-roll="notes"]')
  };

  const startVolumeLiters = readNumber("[data-plan-start-volume]");
  const efficiency = readNumber("[data-plan-efficiency]");
  const quality = readNumber("[data-plan-quality]");
  const value = readNumber("[data-plan-value]");
  const oversight = readNumber("[data-plan-oversight]");
  const planDate = readText("[data-plan-date]");
  const plannedReturnDate = readText("[data-plan-return-date]");

  const potentialOutput = startVolumeLiters;
  const productionTotal = inputs.productionRoll + (2 * efficiency);
  const produced = Math.floor(potentialOutput * productionPercent(productionTotal));

  const plannedAbsenceWeeks = diffWeeksRoundedUp(planDate, plannedReturnDate) ?? 0;
  const actualAbsenceWeeks = diffWeeksRoundedUp(planDate, inputs.date) ?? 0;
  const overdueDays = Math.max(diffDays(plannedReturnDate, inputs.date) ?? 0, 0);
  const overdueWeeks = Math.ceil(overdueDays / 7);
  const overduePenalty = overdueWeeks > 0 && oversight < 2 ? 2 : 0;
  const extraSpoilagePct = overdueWeeks > 0 ? (oversight >= 1 ? 0.1 * overdueWeeks : 0.2 * overdueWeeks) : 0;
  const contaminationTotal = inputs.contaminationRoll + quality + oversight - overduePenalty;
  let spoiled = Math.floor(produced * spoilagePercent(contaminationTotal, quality));
  spoiled += Math.floor(produced * extraSpoilagePct);
  if (startVolumeLiters >= 60) spoiled += 1;
  spoiled = Math.min(spoiled, produced);

  const usable = Math.max(produced - spoiled, 0);
  let salesModifier = value;
  if (value >= 3) salesModifier += 1;
  if (value >= 2 && quality >= 1) salesModifier += 1;
  const salesTotal = inputs.salesRoll + salesModifier;
  let price = salesPrice(salesTotal);
  if (value >= 2 && price >= 5 && contaminationTotal < 10) price = 3;
  if (value >= 2 && contaminationTotal >= 15 && salesTotal >= 15) price += 1;

  let sold = usable;
  if (salesTotal >= 15) {
    sold = usable;
  } else if (salesTotal >= 10) {
    sold = Math.floor(usable * 0.9);
  } else {
    sold = Math.floor(usable * 0.7);
  }

  const bonusGp = value >= 2 && contaminationTotal >= 15 && salesTotal >= 20 ? 4 : 0;
  const grossGp = sold * price + bonusGp;
  const netGp = grossGp;
  const batchResult = determineBatchOutcome({ produced, spoiled, contaminationTotal, overdueWeeks });
  const incident = determineIncident({ contaminationTotal, overdueWeeks });

  const resolution = {
    potentialOutput,
    productionTotal,
    contaminationTotal,
    salesTotal,
    produced,
    spoiled,
    usable,
    sold,
    price,
    grossGp,
    plannedAbsenceWeeks,
    actualAbsenceWeeks,
    netGp,
    batchResult,
    incident
  };

  const output = root.querySelector("[data-resolution-output]");
  const notes = root.querySelector("[data-resolution-notes]");
  const snippet = root.querySelector("[data-resolution-snippet]");
  const absenceSummary = root.querySelector("[data-roll-absence-summary]");

  if (absenceSummary) {
    absenceSummary.textContent =
      overdueWeeks > 0
        ? `${overdueDays} dagen te laat (${overdueWeeks} week${overdueWeeks === 1 ? "" : "en"} straf)`
        : `Op tijd terug na ${actualAbsenceWeeks} week${actualAbsenceWeeks === 1 ? "" : "en"}`;
  }

  if (output) {
    output.innerHTML = [
      renderMetric("Startvolume (liter)", potentialOutput),
      renderMetric("Gebrouwen volume", formatLiters(produced)),
      renderMetric("Bedorven volume", formatLiters(spoiled)),
      renderMetric("Bruikbaar volume", formatLiters(usable)),
      renderMetric("Verkocht volume", formatLiters(sold)),
      renderMetric("Prijs per liter", price),
      renderMetric("Bruto gp", grossGp),
      renderMetric("Netto gp", netGp),
      renderMetric("Batchresultaat", batchResult),
      renderMetric("Incident", incident)
    ].join("");
  }

  if (notes) {
    notes.innerHTML = `
      <p><strong>Totalen</strong></p>
      <p>Productie totaal: ${productionTotal}. Contaminatie totaal: ${contaminationTotal}. Verkoop totaal: ${salesTotal}.</p>
      <p>Deze helper rekent momenteel zonder staffing-, opslag- of overige kosten.</p>
      <p>${overdueWeeks > 0 ? `De partij kwam ${overdueDays} dag(en) te laat terug, afgerond ${overdueWeeks} week(en) straf.` : "Geen straf voor late terugkeer."}</p>
      <p>${incident === "none" ? "Geen directe incidenttrigger." : `Voorgesteld incident: ${incident}.`}</p>
    `;
  }

  if (snippet) {
    snippet.value = buildSettlementSnippet(plan, resolution, inputs);
  }
}

function buildChartSvg(history, metricKey) {
  const width = 760;
  const height = 260;
  const padLeft = 50;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 36;
  const values = history.map((item) => Number(item[metricKey] ?? 0));
  const dates = history.map((item) => item.date);

  if (!values.length) {
    return '<p class="empty">Nog geen settlements om te plotten.</p>';
  }

  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const xStep = values.length === 1 ? 0 : chartWidth / (values.length - 1);
  const scaleY = (value) => padTop + chartHeight - ((value - min) / (max - min)) * chartHeight;
  const scaleX = (index) => padLeft + index * xStep;
  const points = values.map((value, index) => `${scaleX(index)},${scaleY(value)}`).join(" ");
  const areaPoints = `${padLeft},${padTop + chartHeight} ${points} ${padLeft + chartWidth},${padTop + chartHeight}`;
  const yTicks = [min, (min + max) / 2, max];

  return `
    <svg class="brewery-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Brewery statistiek">
      <polygon class="brewery-chart-area" points="${areaPoints}"></polygon>
      <polyline class="brewery-chart-line" points="${points}"></polyline>
      ${yTicks
        .map((tick) => {
          const y = scaleY(tick);
          return `
            <line class="brewery-chart-grid" x1="${padLeft}" y1="${y}" x2="${padLeft + chartWidth}" y2="${y}"></line>
            <text class="brewery-chart-label" x="${padLeft - 8}" y="${y + 4}" text-anchor="end">${Math.round(tick * 10) / 10}</text>
          `;
        })
        .join("")}
      ${values
        .map((value, index) => {
          const x = scaleX(index);
          const y = scaleY(value);
          const label = `${dates[index]}: ${value}`;
          return `
            <circle class="brewery-chart-point" cx="${x}" cy="${y}" r="4"></circle>
            <title>${label}</title>
          `;
        })
        .join("")}
      ${dates
        .map((date, index) => {
          const x = scaleX(index);
          return `<text class="brewery-chart-label" x="${x}" y="${height - 10}" text-anchor="middle">${date.slice(5)}</text>`;
        })
        .join("")}
    </svg>
  `;
}

function renderStatsPanel(history) {
  const entries = history ?? [];
  return `
    <p class="eyebrow">Tijdlijn</p>
    <h3>Resultaten per settlement</h3>
    <div class="stats-toolbar">
      <label class="resolution-field">
        <span>Toon metric</span>
        <select data-stats-metric>
          <option value="net_result_gp">Netto gp</option>
          <option value="volume_produced_liters">Gebrouwen liters</option>
          <option value="volume_sold_liters">Verkochte liters</option>
          <option value="volume_spoiled_liters">Bedorven liters</option>
        </select>
      </label>
    </div>
    <div class="brewery-metrics">
      ${renderMetric("Settlements", entries.length)}
      ${renderMetric("Laatste netto gp", entries[0]?.net_result_gp ?? "-")}
    </div>
    <div class="chart-shell" data-stats-chart></div>
    <p class="meta">Voor nu plot de site de settlementhistorie die al in Kanka staat. Als Kanka-tekst groot genoeg blijft, kun je deze records daar gewoon laten staan.</p>
  `;
}

function updateStatsPanel(root, history) {
  const metric = root.querySelector("[data-stats-metric]")?.value ?? "net_result_gp";
  const chart = root.querySelector("[data-stats-chart]");
  if (chart) {
    chart.innerHTML = buildChartSvg([...history].reverse(), metric);
  }
}

function renderOptionalGrid(sectionName, items) {
  const section = document.querySelector(`[data-world-section="${sectionName}"]`);
  if (!section) {
    return;
  }
  if (!items?.length) {
    section.remove();
    return;
  }
  renderGrid(`[data-list="${sectionName}"]`, items);
}

function pruneEmptyWorldDisclosure() {
  const sections = [...document.querySelectorAll("[data-world-section]")];
  const disclosure = sections[0]?.closest(".brewery-disclosure");
  if (!disclosure) {
    return;
  }
  const hasVisibleSection = sections.some((section) => section.isConnected);
  if (!hasVisibleSection) {
    disclosure.remove();
  }
}

async function main() {
  try {
    const data = await loadJson("brewery.json");
    setGeneratedAt(data.generatedAt);
    const venture = data.venture || {};

    document.querySelectorAll("[data-brewery-tabs]").forEach(initTabs);
    initBreweryMotion(document);

    const planner = document.querySelector("[data-brewery-planner]");
    if (planner) {
      planner.innerHTML = renderBatchPlanner(venture.plannedBatch, data.rules);
      planner.querySelectorAll("[data-plan]").forEach((input) => {
        input.addEventListener("input", () => updateBatchPlanner(planner));
      });
      updateBatchPlanner(planner);
    }

    const plan = document.querySelector("[data-brewery-plan]");
    if (plan) {
      plan.innerHTML = renderCurrentPlan(venture.plannedBatch);
    }

    const resolution = document.querySelector("[data-brewery-resolution]");
    if (resolution) {
      if (venture.plannedBatch) {
        resolution.innerHTML = renderResolutionCalculator(venture.plannedBatch, venture.absence);
        resolution.querySelectorAll("[data-roll]").forEach((input) => {
          input.addEventListener("input", () => updateResolutionCalculator(resolution, venture.plannedBatch));
        });
        updateResolutionCalculator(resolution, venture.plannedBatch);
      } else {
        resolution.innerHTML =
          '<p class="empty">Nog geen actieve run om te verwerken. Maak eerst een brewery_plan en plak die in Kanka.</p>';
      }
    }

    const stats = document.querySelector("[data-brewery-stats]");
    if (stats) {
      stats.innerHTML = renderStatsPanel(venture.history || []);
      stats.querySelector("[data-stats-metric]")?.addEventListener("change", () => updateStatsPanel(stats, venture.history || []));
      updateStatsPanel(stats, venture.history || []);
    }

    const history = document.querySelector("[data-brewery-history]");
    if (history) {
      history.innerHTML = venture.history?.length
        ? venture.history.slice(0, 5).map(renderHistoryEntry).join("")
        : '<p class="empty">Nog geen brewery_settlement records gevonden.</p>';
    }

    const rules = document.querySelector("[data-brewery-rules]");
    if (rules) {
      const model = data.rules;
      rules.innerHTML = model
        ? `
          <div class="rule-grid">
            ${model.axes.map(renderRuleCard).join("")}
            ${model.rolls.map(renderRuleCard).join("")}
          </div>
        `
        : '<p class="empty">Nog geen regelsamenvatting beschikbaar.</p>';
    }

    renderOptionalGrid("organisations", data.organisations || []);
    renderOptionalGrid("items", data.items || []);
    renderOptionalGrid("quests", data.quests || []);
    pruneEmptyWorldDisclosure();
  } catch (error) {
    setError(error);
  }
}

main();
