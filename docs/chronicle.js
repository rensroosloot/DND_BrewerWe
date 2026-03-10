import { loadJson, renderCard, setError, setGeneratedAt } from "./site.js";

async function main() {
  try {
    const data = await loadJson("chronicle.json");
    setGeneratedAt(data.generatedAt);

    const root = document.querySelector('[data-list="entries"]');
    if (!root) {
      return;
    }

    if (!data.entries.length) {
      root.innerHTML = '<p class="empty">No public chronicle entries yet.</p>';
      return;
    }

    root.innerHTML = data.entries.map(renderCard).join("");
  } catch (error) {
    setError(error);
  }
}

main();
