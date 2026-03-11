import { loadJson, renderCard, setError, setGeneratedAt } from "./site.js";

function renderStats(stats) {
  const root = document.querySelector("[data-home-stats]");
  if (!root) {
    return;
  }

  const entries = [
    ["Items", stats.totalEntries],
    ["Locaties", stats.locations],
    ["Organisaties", stats.organisations],
    ["Personages", stats.characters]
  ];

  root.innerHTML = entries
    .map(([label, value]) => `<article class="stat-card"><strong>${value}</strong><span>${label}</span></article>`)
    .join("");
}

function renderFeature(selector, label, item, fallback) {
  const root = document.querySelector(`[data-feature="${selector}"]`);
  if (!root) {
    return;
  }

  root.innerHTML = `
    <p class="eyebrow">${label}</p>
    ${item ? renderCard(item) : `<p class="empty">${fallback}</p>`}
  `;
}

async function main() {
  try {
    const data = await loadJson("home.json");
    setGeneratedAt(data.generatedAt);
    document.querySelector("[data-home-intro]").textContent = data.intro;
    renderStats(data.stats);
    renderFeature("brewery", "Uitgelichte brouwerij", data.featured.brewery, "Nog geen brouwerijrecord.");
    renderFeature("location", "Uitgelichte plek", data.featured.location, "Nog geen locatierecord.");
    renderFeature("chronicle", "Laatste kroniek", data.featured.latestChronicle, "Nog geen publiek kroniek-item.");
  } catch (error) {
    setError(error);
  }
}

main();
