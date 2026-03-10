import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceFile = path.join(rootDir, "docs", "data", "kanka-public.json");
const outputDir = path.join(rootDir, "docs", "data");

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

async function main() {
  const raw = JSON.parse(await readFile(sourceFile, "utf8"));
  const modules = raw.modules || {};
  const counts = summarizeCounts(modules);
  const brewery = modules.organisations?.find((item) => /brew/i.test(item.name) || /brew/i.test(item.type || "")) ?? modules.organisations?.[0] ?? null;

  const home = {
    generatedAt: raw.generatedAt,
    title: "BrewerWe",
    intro: "A player-facing campaign hub shaped around a tiny brewery, its bar, and the places and people tied to it.",
    stats: counts,
    featured: {
      brewery,
      location: modules.locations?.[0] ?? null,
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
    locations: modules.locations || [],
    maps: modules.maps || []
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
    writeFile(path.join(outputDir, "chronicle.json"), JSON.stringify(chronicle, null, 2), "utf8")
  ]);

  console.log("Wrote docs/data/home.json");
  console.log("Wrote docs/data/brewery.json");
  console.log("Wrote docs/data/atlas.json");
  console.log("Wrote docs/data/chronicle.json");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
