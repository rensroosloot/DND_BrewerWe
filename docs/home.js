import { loadJson, renderCard, setError, setGeneratedAt } from "./site.js";

function renderStats(stats) {
  const root = document.querySelector("[data-home-stats]");
  if (!root) {
    return;
  }

  const entries = [
    ["Entries", stats.totalEntries],
    ["Locations", stats.locations],
    ["Organisations", stats.organisations],
    ["Characters", stats.characters]
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
    renderFeature("brewery", "Featured Brewery", data.featured.brewery, "No brewery record yet.");
    renderFeature("location", "Featured Place", data.featured.location, "No location record yet.");
    renderFeature("chronicle", "Latest Chronicle", data.featured.latestChronicle, "No public chronicle entry yet.");
  } catch (error) {
    setError(error);
  }
}

main();
