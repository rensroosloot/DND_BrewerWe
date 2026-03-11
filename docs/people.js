import { loadJson, setError, setGeneratedAt } from "./site.js";

function renderPersonCard(item) {
  const image = item.image
    ? `<div class="card-media card-media-portrait"><img src="${item.image}" alt="${item.name}"></div>`
    : "";
  const summary = item.summary || "Nog geen publieke samenvatting.";
  const meta = [item.type, item.title].filter(Boolean).join(" | ");

  return `
    <article class="entry-card">
      ${image}
      <h3>${item.name}</h3>
      ${meta ? `<p class="meta">${meta}</p>` : ""}
      <p>${summary}</p>
      <p><a class="text-link" href="./personage.html?id=${item.id}">Lees meer</a></p>
      ${item.url ? `<p><a class="text-link" href="${item.url}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
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
