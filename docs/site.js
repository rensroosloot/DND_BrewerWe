export async function loadJson(fileName) {
  const response = await fetch(`./data/${fileName}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status}`);
  }
  return response.json();
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizePublicUrl(value, { allowRelative = false } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  if (allowRelative && /^(?:\.{0,2}\/|\/(?!\/)|[?#])/.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function setGeneratedAt(value) {
  const root = document.querySelector("[data-generated-at]");
  if (!root) {
    return;
  }
  root.textContent = value
    ? `Laatst gesynchroniseerd vanuit Kanka: ${new Date(value).toLocaleString()}`
    : "Kanka-sync is nog niet uitgevoerd.";
}

export function setError(error) {
  const root = document.querySelector("[data-error]");
  if (!root) {
    return;
  }
  root.textContent = error.message;
  root.hidden = false;
}

export function renderCard(item) {
  if (!item) {
    return '<article class="entry-card"><p class="empty">Nog geen publiek item.</p></article>';
  }

  const meta = [item.type, item.title].filter(Boolean).join(" | ");
  const summary = item.summary || "Nog geen publieke samenvatting.";
  const imageUrl = sanitizePublicUrl(item.image, { allowRelative: true });
  const externalUrl = sanitizePublicUrl(item.url);
  const image = imageUrl
    ? `
      <div class="card-media">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}">
      </div>
    `
    : "";
  return `
    <article class="entry-card">
      ${image}
      <h3>${escapeHtml(item.name)}</h3>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(summary)}</p>
      ${externalUrl ? `<p><a class="text-link" href="${escapeHtml(externalUrl)}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
    </article>
  `;
}

export function renderGrid(selector, items) {
  const root = document.querySelector(selector);
  if (!root) {
    return;
  }

  if (!items.length) {
    root.innerHTML = '<p class="empty">Nog geen publieke items.</p>';
    return;
  }

  root.innerHTML = items.map(renderCard).join("");
}
