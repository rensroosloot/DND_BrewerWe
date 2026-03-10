import { loadJson, renderCard, renderGrid, setError, setGeneratedAt } from "./site.js";

async function main() {
  try {
    const data = await loadJson("brewery.json");
    setGeneratedAt(data.generatedAt);

    const hero = document.querySelector("[data-brewery-main]");
    if (hero) {
      hero.innerHTML = `
        <p class="eyebrow">Featured Organisation</p>
        ${renderCard(data.brewery)}
      `;
    }

    renderGrid('[data-list="organisations"]', data.organisations || []);
    renderGrid('[data-list="items"]', data.items || []);
    renderGrid('[data-list="quests"]', data.quests || []);
  } catch (error) {
    setError(error);
  }
}

main();
