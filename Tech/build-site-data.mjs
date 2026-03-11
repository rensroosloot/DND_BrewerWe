import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceFile = path.join(rootDir, "docs", "data", "kanka-public.json");
const outputDir = path.join(rootDir, "docs", "data");
const mapPinsFile = path.join(outputDir, "map-pins.json");

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

function extractMapPin(location) {
  const source = `${location.fullText || ""}\n${location.summary || ""}`;
  const xMatch = source.match(/map_x:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const yMatch = source.match(/map_y:\s*([0-9]+(?:\.[0-9]+)?)/i);

  if (!xMatch || !yMatch) {
    return null;
  }

  return {
    id: slugify(location.name || location.id),
    label: location.name,
    locationName: location.name,
    x: Number.parseFloat(xMatch[1]),
    y: Number.parseFloat(yMatch[1])
  };
}

function stripMapMeta(text) {
  return String(text || "")
    .replace(/naam:\s*[^\n]+/gi, "")
    .replace(/map_x:\s*[0-9]+(?:\.[0-9]+)?/gi, "")
    .replace(/map_y:\s*[0-9]+(?:\.[0-9]+)?/gi, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

async function main() {
  const raw = JSON.parse(await readFile(sourceFile, "utf8"));
  const modules = raw.modules || {};
  const counts = summarizeCounts(modules);
  const brewery = modules.organisations?.find((item) => /brew/i.test(item.name) || /brew/i.test(item.type || "")) ?? modules.organisations?.[0] ?? null;

  let existingPins = [];
  try {
    existingPins = JSON.parse(await readFile(mapPinsFile, "utf8"));
  } catch {
    existingPins = [];
  }

  const generatedPins = (modules.locations || []).map(extractMapPin).filter(Boolean);
  const generatedNames = new Set(generatedPins.map((pin) => pin.locationName));
  const preservedPins = existingPins.filter((pin) => !generatedNames.has(pin.locationName));
  const mapPins = [...generatedPins, ...preservedPins];

  const atlasLocations = (modules.locations || []).map((location) => {
    const pin = mapPins.find((item) => item.locationName === location.name) || null;
    return {
      ...location,
      summary: stripMapMeta(location.summary),
      fullText: stripMapMeta(location.fullText),
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
      brewery,
      location: atlasLocations[0] ?? null,
      latestChronicle: pickLatest([...(modules.journals || []), ...(modules.events || [])])
    }
  };

  const breweryPage = {
    generatedAt: raw.generatedAt,
    brewery,
    organisations: modules.organisations || [],
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
