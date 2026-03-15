import { escapeHtml, loadJson, sanitizePublicUrl, setError } from "./site.js";

function renderDetail(item) {
  const imageUrl = sanitizePublicUrl(item.image);
  const kankaUrl = sanitizePublicUrl(item.url);
  const image = imageUrl
    ? `<div class="card-media card-media-portrait card-media-detail"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}"></div>`
    : "";
  const meta = [item.type, item.title].filter(Boolean).join(" | ");
  const fullText = item.fullText || item.summary || "Nog geen publieke samenvatting.";

  return `
    ${image}
    <div class="detail-body">
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(fullText)}</p>
      <p><a class="text-link" href="./people.html">Terug naar personages</a></p>
      ${kankaUrl ? `<p><a class="text-link" href="${escapeHtml(kankaUrl)}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
    </div>
  `;
}

async function main() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const data = await loadJson("people.json");
    const item = (data.characters || []).find((character) => String(character.id) === id);

    if (!item) {
      throw new Error("Personage niet gevonden.");
    }

    const nameRoot = document.querySelector("[data-character-name]");
    const summaryRoot = document.querySelector("[data-character-summary]");
    const detailRoot = document.querySelector("[data-character-detail]");

    if (nameRoot) {
      nameRoot.textContent = item.name;
    }
    if (summaryRoot) {
      summaryRoot.textContent = item.summary || "Nog geen publieke samenvatting.";
    }
    if (detailRoot) {
      detailRoot.innerHTML = renderDetail(item);
    }
  } catch (error) {
    setError(error);
  }
}

main();
