function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToBlockText(value) {
  return decodeHtmlEntities(String(value || ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function defaultEntityType(moduleName) {
  if (moduleName === "locations") return "location";
  if (moduleName === "characters") return "person";
  if (moduleName === "quests") return "quest";
  return "misc";
}

export function isLocationLikeEntityType(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "location" || raw === "teleport";
}

function normalizeEntityType(value, moduleName) {
  const raw = String(value || "").trim().toLowerCase();
  if (isLocationLikeEntityType(raw) || raw === "person" || raw === "quest" || raw === "misc") {
    return raw;
  }
  return defaultEntityType(moduleName);
}

function parseMapPinFields(blockText) {
  const fields = {};
  const matches = blockText.matchAll(/(^|\n)([a-z_]+)\s*:\s*([\s\S]*?)(?=(\n[a-z_]+\s*:)|$)/gi);
  for (const match of matches) {
    fields[match[2].toLowerCase()] = match[3].trim();
  }
  return fields;
}

function parseNumericField(value) {
  const parsed = Number.parseFloat(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function validateCoordinate(name, value) {
  if (value == null || value < 0 || value > 100) {
    throw new Error(`Invalid ${name}: expected a number between 0 and 100`);
  }
}

function extractBlocks(text, tagName) {
  const pattern = new RegExp(`\\[${tagName}\\]([\\s\\S]*?)\\[\\/${tagName}\\]`, "gi");
  return [...String(text || "").matchAll(pattern)].map((match) => match[1].trim()).filter(Boolean);
}

export function extractMapPinsFromRecord(record, moduleName) {
  const blockText = htmlToBlockText(record?.fullHtml || record?.fullText || "");
  const blocks = extractBlocks(blockText, "map_pin");

  return blocks
    .map((block) => {
      const fields = parseMapPinFields(block);
      const x = parseNumericField(fields.map_x);
      const y = parseNumericField(fields.map_y);

      if (x == null || y == null) {
        return null;
      }
      validateCoordinate("map_x", x);
      validateCoordinate("map_y", y);

      const entityType = normalizeEntityType(fields.entity_type, moduleName);
      const entityRef = fields.entity_ref || record?.name || null;
      const label = fields.label || entityRef || record?.name || "Unnamed";
      const id = fields.id || slugify(label);

      return {
        id,
        label,
        entityType,
        entityRef,
        x,
        y,
        notes: fields.notes || null,
        sourceModule: moduleName,
        sourceRecordId: record?.id ?? null
      };
    })
    .filter(Boolean);
}

export function extractLegacyLocationPin(record) {
  const source = `${record?.fullText || ""}\n${record?.summary || ""}`;
  const xMatch = source.match(/map_x:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const yMatch = source.match(/map_y:\s*([0-9]+(?:\.[0-9]+)?)/i);

  if (!xMatch || !yMatch) {
    return null;
  }

  const x = Number.parseFloat(xMatch[1]);
  const y = Number.parseFloat(yMatch[1]);
  validateCoordinate("map_x", x);
  validateCoordinate("map_y", y);

  return {
    id: slugify(record?.name || record?.id),
    label: record?.name || "Unnamed",
    entityType: "location",
    entityRef: record?.name || null,
    x,
    y,
    notes: null,
    sourceModule: "locations",
    sourceRecordId: record?.id ?? null
  };
}
