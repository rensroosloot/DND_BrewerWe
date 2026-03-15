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
const KANKA_FETCH_TIMEOUT_MS = Number.parseInt(process.env.KANKA_FETCH_TIMEOUT_MS || "15000", 10);
const KANKA_FETCH_RETRIES = Number.parseInt(process.env.KANKA_FETCH_RETRIES || "2", 10);

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

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function sanitizeHref(value) {
  const href = String(value || "").trim();
  if (!href) {
    return null;
  }

  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function sanitizeRichText(value) {
  let html = String(value || "");
  const linkPlaceholders = [];

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(div|p|li|ul|ol)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<sup[\s\S]*?<\/sup>/gi, "");

  html = html.replace(/<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_, __, href, text) => {
    const safeHref = sanitizeHref(href);
    const label = decodeHtmlEntities(stripHtml(text));

    if (!safeHref || !label) {
      return label;
    }

    const token = `__LINK_${linkPlaceholders.length}__`;
    linkPlaceholders.push(
      `<a class="rich-link" href="${safeHref}" target="_blank" rel="noreferrer noopener">${label}</a>`
    );
    return token;
  });

  html = decodeHtmlEntities(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (const [index, linkHtml] of linkPlaceholders.entries()) {
    html = html.replaceAll(`__LINK_${index}__`, linkHtml);
  }

  return html
    .split(/\n{2,}/)
    .map((block) => block.trim().replace(/[ \t]{2,}/g, " ").replace(/\n/g, "<br>"))
    .filter(Boolean)
    .join("<br><br>") || null;
}

function createSummary(fullText) {
  if (!fullText) {
    return null;
  }

  const firstSentence = fullText.match(/^(.+?[.!?])(?:\s|$)/);
  if (firstSentence?.[1]) {
    return firstSentence[1].trim();
  }

  return fullText.slice(0, 180).trim() || null;
}

function toPublicSummary(record, moduleName) {
  const fullText = stripHtml(record.entry) || null;
  const fullHtml = sanitizeRichText(record.entry) || null;
  return {
    id: record.id,
    entityId: record.entity_id ?? null,
    module: moduleName,
    name: record.name ?? "Unnamed",
    type: record.type ?? null,
    title: record.title ?? null,
    image: record.image_full ?? record.image_thumb ?? record.image ?? null,
    summary: createSummary(fullText),
    fullText,
    fullHtml,
    locationId: record.location_id ?? null,
    url: record.urls?.view ?? record.url ?? record.entity?.url ?? null,
    updatedAt: record.updated_at ?? null
  };
}

async function fetchJson(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= KANKA_FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), KANKA_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        const retriable = response.status === 408 || response.status === 429 || response.status >= 500;
        if (retriable && attempt < KANKA_FETCH_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }
        throw new Error(`Request failed: ${response.status} ${response.statusText}\n${body}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      const isAbort = error?.name === "AbortError";
      if (attempt >= KANKA_FETCH_RETRIES) {
        break;
      }
      if (!isAbort && !/fetch/i.test(String(error?.message || ""))) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Kanka fetch failed for ${url}: ${lastError?.message || "unknown error"}`);
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
