import { escapeHtml, loadJson, renderGrid, sanitizePublicUrl, setError, setGeneratedAt } from "./site.js";

function withMapZoom(url, scale = 10) {
  if (!url) {
    return null;
  }

  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("zoom", String(scale));
  return `${path}?${params.toString()}`;
}

function renderActionLinks(item) {
  const links = [];
  const mapUrl = sanitizePublicUrl(withMapZoom(item.mapLink), { allowRelative: true });
  const kankaUrl = sanitizePublicUrl(item.url);
  const wikiUrl = sanitizePublicUrl(item.forgottenRealms?.url);

  if (mapUrl) {
    links.push(`<a class="action-link" href="${escapeHtml(mapUrl)}">Kaart</a>`);
  }
  if (kankaUrl) {
    links.push(`<a class="action-link" href="${escapeHtml(kankaUrl)}" target="_blank" rel="noreferrer noopener">Kanka</a>`);
  }
  if (wikiUrl) {
    links.push(`<a class="action-link" href="${escapeHtml(wikiUrl)}" target="_blank" rel="noreferrer noopener">Wiki</a>`);
  }

  return links.length ? `<div class="action-links">${links.join("")}</div>` : "";
}

function renderLocationRelations(item) {
  const parts = [];

  if (item.parentLocation) {
    const safeParentName = escapeHtml(item.parentLocation.name);
    const parentLink = item.parentLocation.mapPin
      ? `<a class="text-link" href="${escapeHtml(withMapZoom(`./map.html?pin=${encodeURIComponent(item.parentLocation.mapPin.id)}`))}">${safeParentName}</a>`
      : safeParentName;
    parts.push(`<p class="relation-line"><strong>Onder:</strong> ${parentLink}</p>`);
  }

  if (item.childLocations?.length) {
    const children = item.childLocations
      .map((child) => {
        if (child.mapPin) {
          return `<a class="text-link" href="${escapeHtml(withMapZoom(`./map.html?pin=${encodeURIComponent(child.mapPin.id)}`))}">${escapeHtml(child.name)}</a>`;
        }
        return escapeHtml(child.name);
      })
      .join(", ");
    parts.push(`<p class="relation-line"><strong>Bevat:</strong> ${children}</p>`);
  }

  return parts.join("");
}

function renderLocationCard(item) {
  const image = sanitizePublicUrl(item.previewImage || item.image, { allowRelative: true });
  const mapPreviewLink = sanitizePublicUrl(withMapZoom(item.mapLink), { allowRelative: true });
  const body = item.fullHtml
    ? `<div class="rich-text">${item.fullHtml}</div>`
    : `<p>${escapeHtml(item.summary || item.fullText || "Nog geen publieke samenvatting.")}</p>`;
  const meta = [item.type, item.title].filter(Boolean).join(" | ");

  return `
    <article class="entry-card">
      ${image ? `
        <div class="card-media">
          ${mapPreviewLink
            ? `<a class="card-media-link" href="${escapeHtml(mapPreviewLink)}" aria-label="Open ${escapeHtml(item.name)} op de kaart"><img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}"></a>`
            : `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}">`
          }
        </div>
      ` : ""}
      <h3>${escapeHtml(item.name)}</h3>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
      ${renderLocationRelations(item)}
      ${body}
      ${renderActionLinks(item)}
    </article>
  `;
}

function sortLocations(items) {
  return [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function renderLocationGroup(item, locationMap) {
  const children = sortLocations(
    (item.childLocations || [])
      .map((child) => locationMap.get(child.id))
      .filter(Boolean)
  );

  return `
    <section class="atlas-group">
      <div class="atlas-group-main">
        ${renderLocationCard(item)}
      </div>
      ${children.length ? `
        <div class="atlas-group-children">
          <p class="atlas-group-label">Binnen ${item.name}</p>
          <div class="atlas-group-grid">
            ${children.map((child) => `<div class="atlas-child">${renderLocationCard(child)}</div>`).join("")}
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

async function main() {
  try {
    const data = await loadJson("atlas.json");
    setGeneratedAt(data.generatedAt);

    const root = document.querySelector('[data-list="locations"]');
    if (root) {
      const locations = data.locations || [];
      const locationMap = new Map(locations.map((item) => [item.id, item]));
      const topLevel = sortLocations(
        locations.filter((item) => !item.parentLocation || !locationMap.has(item.parentLocation.id))
      );
      const grouped = topLevel.filter((item) => item.childLocations?.length);
      const standalone = topLevel.filter((item) => !item.childLocations?.length);

      root.innerHTML = topLevel.length
        ? `
          <div class="atlas-tree">
            ${grouped.map((item) => renderLocationGroup(item, locationMap)).join("")}
            ${standalone.length ? `
              <section class="atlas-standalone-grid">
                ${standalone.map(renderLocationCard).join("")}
              </section>
            ` : ""}
          </div>
        `
        : '<p class="empty">Nog geen publieke items.</p>';
    }

    renderGrid('[data-list="maps"]', data.maps || []);
  } catch (error) {
    setError(error);
  }
}

main();
