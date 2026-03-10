export async function loadJson(fileName) {
  const response = await fetch(`./data/${fileName}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status}`);
  }
  return response.json();
}

export function setGeneratedAt(value) {
  const root = document.querySelector("[data-generated-at]");
  if (!root) {
    return;
  }
  root.textContent = value
    ? `Last synced from Kanka: ${new Date(value).toLocaleString()}`
    : "Kanka sync not run yet.";
}

export function setError(error) {
  const root = document.querySelector("[data-error]");
  if (!root) {
    return;
  }
  root.textContent = error.message;
  root.hidden = false;
}

export function renderCard(item) {
  if (!item) {
    return '<article class="entry-card"><p class="empty">No public entry yet.</p></article>';
  }

  const meta = [item.type, item.title].filter(Boolean).join(" | ");
  const summary = item.summary || "No public summary yet.";
  const image = item.image
    ? `
      <div class="card-media">
        <img src="${item.image}" alt="${item.name}">
      </div>
    `
    : "";
  return `
    <article class="entry-card">
      ${image}
      <h3>${item.name}</h3>
      ${meta ? `<p class="meta">${meta}</p>` : ""}
      <p>${summary}</p>
    </article>
  `;
}

export function renderGrid(selector, items) {
  const root = document.querySelector(selector);
  if (!root) {
    return;
  }

  if (!items.length) {
    root.innerHTML = '<p class="empty">No public entries yet.</p>';
    return;
  }

  root.innerHTML = items.map(renderCard).join("");
}
