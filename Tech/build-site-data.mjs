import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBreweryViewModel } from "./brewery-schema.mjs";
import { extractLegacyLocationPin, extractMapPinsFromRecord, isLocationLikeEntityType } from "./map-pin-schema.mjs";

const rootDir = process.cwd();
const sourceFile = path.join(rootDir, "docs", "data", "kanka-public.json");
const outputDir = path.join(rootDir, "docs", "data");
const mapPinsFile = path.join(outputDir, "map-pins.json");
const FORGOTTEN_REALMS_API_URL = "https://forgottenrealms.fandom.com/api.php";
const ENRICHMENT_TIMEOUT_MS = Number.parseInt(process.env.ENRICHMENT_TIMEOUT_MS || "6000", 10);
const ENRICHMENT_RETRIES = Number.parseInt(process.env.ENRICHMENT_RETRIES || "1", 10);

function summarizeCounts(modules) {
  const totalEntries = Object.values(modules).reduce((sum, items) => sum + items.length, 0);
  return {
    totalEntries,
    locations: modules.locations?.length ?? 0,
    organisations: modules.organisations?.length ?? 0,
    characters: modules.characters?.length ?? 0,
    quests: modules.quests?.length ?? 0,
    journals: modules.journals?.length ?? 0,
    events: modules.events?.length ?? 0
  };
}

function pickLatest(items) {
  return [...items].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0] ?? null;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function stripMapMeta(text) {
  return String(text || "")
    .replace(/\[map_pin\][\s\S]*?\[\/map_pin\]/gi, "")
    .replace(/naam:\s*[^\n]+/gi, "")
    .replace(/map_x:\s*[0-9]+(?:\.[0-9]+)?/gi, "")
    .replace(/map_y:\s*[0-9]+(?:\.[0-9]+)?/gi, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function stripMapMetaHtml(html) {
  return String(html || "")
    .replace(/\[map_pin\](?:<br>\s*)*[\s\S]*?\[\/map_pin\](?:<br>\s*)*/gi, "")
    .replace(/naam:\s*[^<\n]+(?:<br>\s*)?/gi, "")
    .replace(/map_x:\s*[0-9]+(?:\.[0-9]+)?(?:<br>\s*)?/gi, "")
    .replace(/map_y:\s*[0-9]+(?:\.[0-9]+)?(?:<br>\s*)?/gi, "")
    .replace(/^(?:<br>\s*)+/i, "")
    .replace(/(?:<br>\s*){3,}/gi, "<br><br>")
    .trim() || null;
}

function stripBreweryMeta(text) {
  return String(text || "")
    .replace(/\[brewery_plan\][\s\S]*?\[\/brewery_plan\]/gi, " ")
    .replace(/\[brewery_settlement\][\s\S]*?\[\/brewery_settlement\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function stripBreweryMetaHtml(html) {
  return String(html || "")
    .replace(/\[brewery_plan\](?:<br>\s*)*[\s\S]*?\[\/brewery_plan\](?:<br>\s*)*/gi, "")
    .replace(/\[brewery_settlement\](?:<br>\s*)*[\s\S]*?\[\/brewery_settlement\](?:<br>\s*)*/gi, "")
    .replace(/^(?:<br>\s*)+/i, "")
    .replace(/(?:<br>\s*){3,}/gi, "<br><br>")
    .trim() || null;
}

function sanitizeBreweryDisplay(item, breweryModel = null) {
  if (!item) {
    return item;
  }

  const summaryContainsSnippet = /\[brewery_(?:plan|state|settlement)\]/i.test(String(item.summary || ""));
  const cleanedSummary = summaryContainsSnippet ? null : stripBreweryMeta(item.summary);
  const cleanedFullText = stripBreweryMeta(item.fullText);
  const cleanedFullHtml = stripBreweryMetaHtml(item.fullHtml);

  return {
    ...item,
    summary: cleanedSummary || breweryModel?.latestSettlement?.notes || breweryModel?.plannedBatch?.notes || null,
    fullText: cleanedFullText,
    fullHtml: cleanedFullHtml
  };
}

function toWikiTitle(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_");
}

function buildForgottenRealmsLink(title) {
  return `https://forgottenrealms.fandom.com/wiki/${encodeURIComponent(title)}`;
}

async function fetchForgottenRealmsLink(name) {
  const title = toWikiTitle(name);

  if (!title) {
    return null;
  }

  const url = new URL(FORGOTTEN_REALMS_API_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", title);
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  let lastError = null;
  let payload = null;

  for (let attempt = 0; attempt <= ENRICHMENT_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENRICHMENT_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const retriable = response.status === 408 || response.status === 429 || response.status >= 500;
        if (retriable && attempt < ENRICHMENT_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
          continue;
        }
        throw new Error(`Forgotten Realms lookup failed for "${name}": ${response.status} ${response.statusText}`);
      }

      payload = await response.json();
      break;
    } catch (error) {
      lastError = error;
      if (attempt >= ENRICHMENT_RETRIES) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!payload) {
    throw new Error(`Forgotten Realms lookup failed for "${name}": ${lastError?.message || "unknown error"}`);
  }

  const page = payload?.query?.pages?.[0] ?? null;

  if (!page || page.missing) {
    return null;
  }

  return {
    label: "Forgotten Realms Wiki",
    title: page.title,
    url: buildForgottenRealmsLink(page.title)
  };
}

async function enrichLocationsWithForgottenRealmsLinks(locations) {
  const cache = new Map();

  return Promise.all(
    locations.map(async (location) => {
      const key = String(location.name || "").trim().toLowerCase();

      if (!key) {
        return {
          ...location,
          forgottenRealms: null
        };
      }

      if (!cache.has(key)) {
        cache.set(
          key,
          fetchForgottenRealmsLink(location.name).catch((error) => {
            console.warn(error.message);
            return null;
          })
        );
      }

      const forgottenRealms = await cache.get(key);
      return {
        ...location,
        forgottenRealms
      };
    })
  );
}

function buildBreweryRulesV4() {
  return {
    version: "v4",
    planningPoints: 4,
    axes: [
      {
        name: "Efficiency",
        summary: "Bepaalt hoe goed de brouwerij het ketelstartvolume omzet in bruikbaar product."
      },
      {
        name: "Quality",
        summary: "Verlaagt spoilage en voorkomt dat een ambitieuze batch door matige kwaliteit terugvalt in prijs."
      },
      {
        name: "Value",
        summary: "Stuurt op hogere verkoopwaarde, maar betaalt zich alleen uit als de batch schoon blijft."
      },
      {
        name: "Oversight",
        summary: "Beschermt tegen problemen tijdens afwezigheid en bij te laat terugkomen."
      }
    ],
    rolls: [
      {
        name: "Productierol",
        formula: "1d20 + (2 x Efficiency)",
        outcome: "Bepaalt hoeveel van het ketelstartvolume daadwerkelijk bruikbare opbrengst wordt."
      },
      {
        name: "Contaminatierol",
        formula: "1d20 + Quality + Oversight",
        outcome: "Bepaalt spoilage, infectie en de kwaliteit van de batch."
      },
      {
        name: "Verkooprol",
        formula: "1d20 + Value, +1 bij Value 3+, +1 extra bij Value 2+ en Quality 1+",
        outcome: "Bepaalt verkoopwaarde en hoeveel van de bruikbare voorraad echt verkocht raakt."
      }
    ],
    findings: [
      "Balanced is momenteel de sterkste all-round keuze.",
      "Aggressive Volume blijft interessant, maar is kwetsbaar bij late return.",
      "Defensive is nu de beste lange-afwezigheid strategie.",
      "Premium builds zijn verbeterd, maar nog niet dominant."
    ],
    currentRecommendation:
      "Gebruik v4 als actieve speeltafelversie. Kies eerst het ketelstartvolume in liters en verdeel daarna 4 punten over Efficiency, Quality, Value en Oversight."
  };
}

async function main() {
  const raw = JSON.parse(await readFile(sourceFile, "utf8"));
  const modules = raw.modules || {};
  const counts = summarizeCounts(modules);
  const brewery = modules.organisations?.find((item) => /brew/i.test(item.name) || /brew/i.test(item.type || "")) ?? modules.organisations?.[0] ?? null;
  const breweryModel = buildBreweryViewModel(brewery?.fullText || "");
  const displayBrewery = sanitizeBreweryDisplay(brewery, breweryModel);
  const displayOrganisations = (modules.organisations || []).map((item) =>
    item?.id === brewery?.id ? sanitizeBreweryDisplay(item, breweryModel) : item
  );
  const enrichedLocations = await enrichLocationsWithForgottenRealmsLinks(modules.locations || []);
  const sourceModules = [
    ["locations", enrichedLocations],
    ["characters", modules.characters || []],
    ["quests", modules.quests || []],
    ["organisations", modules.organisations || []],
    ["items", modules.items || []],
    ["events", modules.events || []],
    ["journals", modules.journals || []]
  ];

  let existingPins = [];
  try {
    existingPins = JSON.parse(await readFile(mapPinsFile, "utf8"));
  } catch {
    existingPins = [];
  }

  const generatedPins = sourceModules.flatMap(([moduleName, records]) =>
    records.flatMap((record) =>
      extractMapPinsFromRecord(record, moduleName).map((pin) => ({
        ...pin,
        x: pin.x,
        y: pin.y,
        locationName: isLocationLikeEntityType(pin.entityType) ? pin.entityRef : null,
        summary: stripMapMeta(record.summary),
        fullText: stripMapMeta(record.fullText),
        fullHtml: stripMapMetaHtml(record.fullHtml),
        type: record.type ?? null,
        url: record.url ?? null,
        image: record.image ?? null,
        module: moduleName
      }))
    )
  );

  const explicitLocationRefs = new Set(
    generatedPins.filter((pin) => isLocationLikeEntityType(pin.entityType)).map((pin) => pin.entityRef)
  );
  const legacyPins = enrichedLocations
    .filter((location) => !explicitLocationRefs.has(location.name))
    .map((location) => extractLegacyLocationPin(location))
    .filter(Boolean)
    .map((pin) => ({
      ...pin,
      locationName: pin.entityRef,
      summary: null,
      fullText: null,
      fullHtml: null,
      type: null,
      url: null,
      image: null,
      module: "locations"
    }));

  const nextPins = [...generatedPins, ...legacyPins];
  const duplicatePinIds = nextPins
    .map((pin) => pin.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicatePinIds.length) {
    throw new Error(`Duplicate map pin ids detected: ${[...new Set(duplicatePinIds)].join(", ")}`);
  }
  const generatedIds = new Set(nextPins.map((pin) => pin.id));
  const preservedPins = existingPins.filter((pin) => !generatedIds.has(pin.id));
  const mapPins = [...nextPins, ...preservedPins];
  const locationById = new Map(enrichedLocations.map((location) => [location.id, location]));

  const atlasLocations = enrichedLocations.map((location) => {
    const pin = mapPins.find((item) => item.locationName === location.name) || null;
    const parent = location.locationId ? locationById.get(location.locationId) || null : null;
    const children = enrichedLocations
      .filter((item) => item.locationId === location.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type ?? null,
        mapPin: mapPins.find((pinItem) => pinItem.locationName === item.name) || null
      }));

    return {
      ...location,
      summary: stripMapMeta(location.summary),
      fullText: stripMapMeta(location.fullText),
      fullHtml: stripMapMetaHtml(location.fullHtml),
      parentLocation: parent
        ? {
            id: parent.id,
            name: parent.name,
            type: parent.type ?? null,
            mapPin: mapPins.find((pinItem) => pinItem.locationName === parent.name) || null
          }
        : null,
      childLocations: children,
      mapPin: pin,
      mapLink: pin ? `./map.html?pin=${encodeURIComponent(pin.id)}` : null,
      previewImage: pin ? `./assets/maps/previews/${pin.id}.jpg` : null
    };
  });

  const home = {
    generatedAt: raw.generatedAt,
    title: "BrewerWe",
    intro: "Een spelergerichte campagnehub rond een kleine brouwerij, de bijbehorende bar en de plaatsen en personen die ermee verbonden zijn.",
    stats: counts,
    featured: {
      brewery: displayBrewery,
      location: atlasLocations[0] ?? null,
      latestChronicle: pickLatest([...(modules.journals || []), ...(modules.events || [])])
    }
  };

  const breweryPage = {
    generatedAt: raw.generatedAt,
    brewery: displayBrewery,
    venture: breweryModel,
    rules: buildBreweryRulesV4(),
    organisations: displayOrganisations,
    items: modules.items || [],
    quests: modules.quests || []
  };

  const atlas = {
    generatedAt: raw.generatedAt,
    locations: atlasLocations,
    maps: modules.maps || []
  };

  const people = {
    generatedAt: raw.generatedAt,
    characters: modules.characters || []
  };

  const chronicle = {
    generatedAt: raw.generatedAt,
    entries: [...(modules.journals || []), ...(modules.events || [])].sort((a, b) =>
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
    )
  };

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, "home.json"), JSON.stringify(home, null, 2), "utf8"),
    writeFile(path.join(outputDir, "brewery.json"), JSON.stringify(breweryPage, null, 2), "utf8"),
    writeFile(path.join(outputDir, "atlas.json"), JSON.stringify(atlas, null, 2), "utf8"),
    writeFile(path.join(outputDir, "people.json"), JSON.stringify(people, null, 2), "utf8"),
    writeFile(path.join(outputDir, "chronicle.json"), JSON.stringify(chronicle, null, 2), "utf8"),
    writeFile(mapPinsFile, JSON.stringify(mapPins, null, 2), "utf8")
  ]);

  console.log("Wrote docs/data/home.json");
  console.log("Wrote docs/data/brewery.json");
  console.log("Wrote docs/data/atlas.json");
  console.log("Wrote docs/data/people.json");
  console.log("Wrote docs/data/chronicle.json");
  console.log("Wrote docs/data/map-pins.json");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
