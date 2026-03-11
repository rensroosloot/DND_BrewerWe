import { loadJson, renderGrid, setError, setGeneratedAt } from "./site.js";

function renderLocationCard(item) {
  const image = item.previewImage || item.image;
  const summary = item.summary || item.fullText || "Nog geen publieke samenvatting.";
  const meta = [item.type, item.title].filter(Boolean).join(" | ");

  return `
    <article class="entry-card">
      ${image ? `<div class="card-media"><img src="${image}" alt="${item.name}"></div>` : ""}
      <h3>${item.name}</h3>
      ${meta ? `<p class="meta">${meta}</p>` : ""}
      <p>${summary}</p>
      ${item.mapLink ? `<p><a class="text-link" href="${item.mapLink}">Bekijk op kaart</a></p>` : ""}
      ${item.url ? `<p><a class="text-link" href="${item.url}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
    </article>
  `;
}

async function main() {
  try {
    const data = await loadJson("atlas.json");
    setGeneratedAt(data.generatedAt);

    const root = document.querySelector('[data-list="locations"]');
    if (root) {
      root.innerHTML = (data.locations || []).length
        ? data.locations.map(renderLocationCard).join("")
        : '<p class="empty">Nog geen publieke items.</p>';
    }

    renderGrid('[data-list="maps"]', data.maps || []);
  } catch (error) {
    setError(error);
  }
}

main();
