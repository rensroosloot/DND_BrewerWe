import { escapeHtml, loadJson, sanitizePublicUrl, setError, setGeneratedAt } from "./site.js";

function renderPersonCard(item) {
  const imageUrl = sanitizePublicUrl(item.image);
  const kankaUrl = sanitizePublicUrl(item.url);
  const image = imageUrl
    ? `<div class="card-media card-media-portrait"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}"></div>`
    : "";
  const summary = item.summary || "Nog geen publieke samenvatting.";
  const meta = [item.type, item.title].filter(Boolean).join(" | ");

  return `
    <article class="entry-card">
      ${image}
      <h3>${escapeHtml(item.name)}</h3>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(summary)}</p>
      <p><a class="text-link" href="./personage.html?id=${encodeURIComponent(item.id)}">Lees meer</a></p>
      ${kankaUrl ? `<p><a class="text-link" href="${escapeHtml(kankaUrl)}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
    </article>
  `;
}

async function main() {
  try {
    const data = await loadJson("people.json");
    setGeneratedAt(data.generatedAt);

    const root = document.querySelector('[data-list="characters"]');
    if (root) {
      root.innerHTML = (data.characters || []).length
        ? data.characters.map(renderPersonCard).join("")
        : '<p class="empty">Nog geen publieke items.</p>';
    }
  } catch (error) {
    setError(error);
  }
}

main();
