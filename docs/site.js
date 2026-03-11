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
    ? `Laatst gesynchroniseerd vanuit Kanka: ${new Date(value).toLocaleString()}`
    : "Kanka-sync is nog niet uitgevoerd.";
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
    return '<article class="entry-card"><p class="empty">Nog geen publiek item.</p></article>';
  }

  const meta = [item.type, item.title].filter(Boolean).join(" | ");
  const summary = item.summary || "Nog geen publieke samenvatting.";
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
      ${item.url ? `<p><a class="text-link" href="${item.url}" target="_blank" rel="noreferrer noopener">Bekijk in Kanka</a></p>` : ""}
    </article>
  `;
}

export function renderGrid(selector, items) {
  const root = document.querySelector(selector);
  if (!root) {
    return;
  }

  if (!items.length) {
    root.innerHTML = '<p class="empty">Nog geen publieke items.</p>';
    return;
  }

  root.innerHTML = items.map(renderCard).join("");
}
