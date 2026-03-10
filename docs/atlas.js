import { loadJson, renderGrid, setError, setGeneratedAt } from "./site.js";

async function main() {
  try {
    const data = await loadJson("atlas.json");
    setGeneratedAt(data.generatedAt);
    renderGrid('[data-list="locations"]', data.locations || []);
    renderGrid('[data-list="maps"]', data.maps || []);
  } catch (error) {
    setError(error);
  }
}

main();
