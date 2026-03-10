import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

loadEnvFile(path.join(process.cwd(), "Tech", ".env.local"));

const token = process.env.KANKA_TOKEN;
const campaignId = process.env.KANKA_CAMPAIGN_ID;
const baseUrl = process.env.KANKA_API_BASE_URL || "https://api.kanka.io/1.0";
const modules = (process.env.KANKA_MODULES || "characters,locations,organisations,quests,maps,journals,items,events")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!token) {
  console.error("Missing KANKA_TOKEN.");
  process.exit(1);
}

if (!campaignId) {
  console.error("Missing KANKA_CAMPAIGN_ID.");
  process.exit(1);
}

const rootDir = process.cwd();
const rawDir = path.join(rootDir, "Tech", "data", "raw");
const publicDir = path.join(rootDir, "docs", "data");

const defaultHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json"
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function toPublicSummary(record, moduleName) {
  return {
    id: record.id,
    entityId: record.entity_id ?? null,
    module: moduleName,
    name: record.name ?? "Unnamed",
    type: record.type ?? null,
    title: record.title ?? null,
    image: record.image_full ?? record.image_thumb ?? record.image ?? null,
    summary: stripHtml(record.entry).slice(0, 280) || null,
    locationId: record.location_id ?? null,
    url: record.url ?? record.entity?.url ?? null,
    updatedAt: record.updated_at ?? null
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: defaultHeaders });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
}

async function fetchAllPages(moduleName) {
  let url = `${baseUrl}/campaigns/${campaignId}/${moduleName}`;
  const records = [];

  while (url) {
    const payload = await fetchJson(url);
    const pageRecords = Array.isArray(payload.data) ? payload.data : [];
    records.push(...pageRecords);

    url = payload.links?.next ?? null;
  }

  return records;
}

async function main() {
  await mkdir(rawDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    campaignId: Number(campaignId),
    modules: {}
  };

  for (const moduleName of modules) {
    console.log(`Fetching ${moduleName}...`);
    const records = await fetchAllPages(moduleName);
    const publicRecords = records
      .filter((record) => !record.is_private)
      .map((record) => toPublicSummary(record, moduleName))
      .sort((a, b) => a.name.localeCompare(b.name));

    await writeFile(
      path.join(rawDir, `${moduleName}.json`),
      JSON.stringify(records, null, 2),
      "utf8"
    );

    output.modules[moduleName] = publicRecords;
  }

  await writeFile(
    path.join(publicDir, "kanka-public.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log(`Wrote ${path.join("docs", "data", "kanka-public.json")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
