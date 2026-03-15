import { loadJson, setError, setGeneratedAt } from "./site.js";

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const ZOOM_STEP = 0.35;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function trySetPointerCapture(element, pointerId) {
  try {
    element.setPointerCapture(pointerId);
  } catch {}
}

function tryReleasePointerCapture(element, pointerId) {
  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {}
}

function createMapController() {
  const viewport = document.querySelector("[data-map-viewport]");
  const canvas = document.querySelector("[data-map-canvas]");
  const image = document.querySelector(".map-image");
  const zoomInButton = document.querySelector("[data-map-zoom-in]");
  const zoomOutButton = document.querySelector("[data-map-zoom-out]");
  const resetButton = document.querySelector("[data-map-reset]");

  if (!viewport || !canvas || !image || !zoomInButton || !zoomOutButton || !resetButton) {
    return null;
  }

  const state = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    pinching: false,
    moved: false,
    suppressClick: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    activePointers: new Map(),
    pinchStartDistance: 0,
    pinchStartScale: 1
  };

  function applyTransform() {
    canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
    canvas.style.setProperty("--pin-scale", `${1 / state.scale}`);
  }

  function zoomToScale(nextScale, clientX = null, clientY = null) {
    const previousScale = state.scale;
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

    if (clampedScale === previousScale) {
      return;
    }

    if (clientX !== null && clientY !== null) {
      const rect = viewport.getBoundingClientRect();
      const pointX = clientX - rect.left;
      const pointY = clientY - rect.top;
      const contentX = (pointX - state.offsetX) / previousScale;
      const contentY = (pointY - state.offsetY) / previousScale;

      state.scale = clampedScale;
      state.offsetX = pointX - contentX * clampedScale;
      state.offsetY = pointY - contentY * clampedScale;
    } else {
      state.scale = clampedScale;
    }

    if (state.scale === 1) {
      state.offsetX = 0;
      state.offsetY = 0;
    }
    applyTransform();
  }

  function zoom(delta, clientX = null, clientY = null) {
    zoomToScale(state.scale + delta, clientX, clientY);
  }

  function getPointerDistance() {
    const [first, second] = [...state.activePointers.values()];
    if (!first || !second) {
      return 0;
    }

    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }

  function getPointerCenter() {
    const [first, second] = [...state.activePointers.values()];
    if (!first || !second) {
      return null;
    }

    return {
      x: (first.clientX + second.clientX) / 2,
      y: (first.clientY + second.clientY) / 2
    };
  }

  function startPinch() {
    state.pinching = true;
    state.dragging = false;
    state.moved = true;
    state.pinchStartDistance = getPointerDistance();
    state.pinchStartScale = state.scale;
    viewport.classList.remove("is-dragging");
  }

  function stopPinch() {
    state.pinching = false;
    state.pinchStartDistance = 0;
    state.pinchStartScale = state.scale;
  }

  function reset() {
    state.scale = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    applyTransform();
  }

  zoomInButton.addEventListener("click", () => zoom(ZOOM_STEP));
  zoomOutButton.addEventListener("click", () => zoom(-ZOOM_STEP));
  resetButton.addEventListener("click", reset);

  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP, event.clientX, event.clientY);
    },
    { passive: false }
  );

  viewport.addEventListener("pointerdown", (event) => {
    state.activePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY
    });
    trySetPointerCapture(viewport, event.pointerId);

    if (state.activePointers.size === 2) {
      startPinch();
      return;
    }

    if (state.activePointers.size === 1 && state.scale > 1) {
      state.dragging = true;
      state.moved = false;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.originX = state.offsetX;
      state.originY = state.offsetY;
      viewport.classList.add("is-dragging");
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (state.activePointers.has(event.pointerId)) {
      state.activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY
      });
    }

    if (state.pinching && state.activePointers.size >= 2) {
      const distance = getPointerDistance();
      const center = getPointerCenter();
      if (!distance || !center || !state.pinchStartDistance) {
        return;
      }

      const nextScale = state.pinchStartScale * (distance / state.pinchStartDistance);
      zoomToScale(nextScale, center.x, center.y);
      return;
    }

    if (!state.dragging) {
      return;
    }
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      state.moved = true;
    }
    state.offsetX = state.originX + (event.clientX - state.startX);
    state.offsetY = state.originY + (event.clientY - state.startY);
    applyTransform();
  });

  function endDrag(event) {
    state.activePointers.delete(event.pointerId);

    if (state.pinching && state.activePointers.size < 2) {
      stopPinch();
      state.suppressClick = true;
    }

    if (state.dragging) {
      if (state.moved) {
        state.suppressClick = true;
      }
      state.dragging = false;
      viewport.classList.remove("is-dragging");
    }

    if (event?.pointerId !== undefined) {
      tryReleasePointerCapture(viewport, event.pointerId);
    }

    if (state.activePointers.size === 1 && state.scale > 1) {
      const [remainingPointer] = state.activePointers.values();
      if (remainingPointer) {
        state.dragging = true;
        state.startX = remainingPointer.clientX;
        state.startY = remainingPointer.clientY;
        state.originX = state.offsetX;
        state.originY = state.offsetY;
        viewport.classList.add("is-dragging");
      }
    }
  }

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("pointerleave", endDrag);

  applyTransform();
  return {
    reset,
    focusOnPoint(xPercent, yPercent, scale = 3.6) {
      const rect = viewport.getBoundingClientRect();
      const width = image.clientWidth || 1;
      const height = image.clientHeight || 1;
      const nextScale = clamp(scale, MIN_SCALE, MAX_SCALE);
      const contentX = (xPercent / 100) * width;
      const contentY = (yPercent / 100) * height;

      state.scale = nextScale;
      state.offsetX = rect.width / 2 - contentX * nextScale;
      state.offsetY = rect.height / 2 - contentY * nextScale;
      applyTransform();
    },
    shouldSuppressClick() {
      if (!state.suppressClick) {
        return false;
      }
      state.suppressClick = false;
      return true;
    },
    getMapPoint(clientX, clientY) {
      const rect = viewport.getBoundingClientRect();
      const pointX = clientX - rect.left;
      const pointY = clientY - rect.top;
      const contentX = (pointX - state.offsetX) / state.scale;
      const contentY = (pointY - state.offsetY) / state.scale;
      const width = image.clientWidth || 1;
      const height = image.clientHeight || 1;

      return {
        x: clamp((contentX / width) * 100, 0, 100),
        y: clamp((contentY / height) * 100, 0, 100)
      };
    }
  };
}

function setupPinHelper(controller) {
  const viewport = document.querySelector("[data-map-viewport]");
  const xRoot = document.querySelector("[data-map-x]");
  const yRoot = document.querySelector("[data-map-y]");
  const snippetRoot = document.querySelector("#map-kanka-snippet");
  const nameInput = document.querySelector("#map-location-name");
  const toggle = document.querySelector("[data-map-helper-toggle]");

  if (!viewport || !controller || !xRoot || !yRoot || !snippetRoot || !nameInput || !toggle) {
    return;
  }

  function updateSnippet(x, y) {
    const locationName = nameInput.value.trim();
    const nameLine = locationName ? `naam: ${locationName}\n` : "";
    snippetRoot.value = `${nameLine}map_x: ${x}\nmap_y: ${y}`;
  }

  nameInput.addEventListener("input", () => {
    const x = xRoot.textContent === "-" ? "" : xRoot.textContent;
    const y = yRoot.textContent === "-" ? "" : yRoot.textContent;
    updateSnippet(x, y);
  });

  viewport.addEventListener("click", (event) => {
    if (event.target.closest(".map-pin") || event.target.closest(".map-control")) {
      return;
    }

    if (!toggle.checked) {
      return;
    }

    if (controller.shouldSuppressClick()) {
      return;
    }

    const point = controller.getMapPoint(event.clientX, event.clientY);
    const x = point.x.toFixed(2);
    const y = point.y.toFixed(2);

    xRoot.textContent = x;
    yRoot.textContent = y;
    updateSnippet(x, y);
  });
}

function renderActionLinks(location) {
  const links = ['<a class="action-link" href="./atlas.html">Atlas</a>'];

  if (location?.url) {
    links.push(`<a class="action-link" href="${location.url}" target="_blank" rel="noreferrer noopener">Kanka</a>`);
  }
  if (location?.forgottenRealms?.url) {
    links.push(`<a class="action-link" href="${location.forgottenRealms.url}" target="_blank" rel="noreferrer noopener">Wiki</a>`);
  }

  return `<div class="action-links">${links.join("")}</div>`;
}

function renderLocationRelations(location) {
  const parts = [];

  if (location?.parentLocation) {
    const parent = location.parentLocation.mapPin
      ? `<a class="text-link" href="./map.html?pin=${encodeURIComponent(location.parentLocation.mapPin.id)}&zoom=1.5">${location.parentLocation.name}</a>`
      : location.parentLocation.name;
    parts.push(`<p class="relation-line"><strong>Onder:</strong> ${parent}</p>`);
  }

  if (location?.childLocations?.length) {
    const children = location.childLocations
      .map((child) => {
        if (child.mapPin) {
          return `<a class="text-link" href="./map.html?pin=${encodeURIComponent(child.mapPin.id)}&zoom=1.5">${child.name}</a>`;
        }
        return child.name;
      })
      .join(", ");
    parts.push(`<p class="relation-line"><strong>Bevat:</strong> ${children}</p>`);
  }

  return parts.join("");
}

function renderSidebar(pin, location) {
  const root = document.querySelector("[data-map-selection]");
  if (!root) {
    return;
  }

  const body = location?.fullHtml
    ? `<div class="rich-text">${location.fullHtml}</div>`
    : `<p>${location?.summary || location?.fullText || "Nog geen publieke samenvatting."}</p>`;

  root.innerHTML = `
    <p class="eyebrow">${pin.label}</p>
    <h3>${location?.name || pin.label}</h3>
    ${renderLocationRelations(location)}
    ${body}
    ${location?.type ? `<p class="meta">${location.type}</p>` : ""}
    ${renderActionLinks(location)}
  `;
}

function createPin(pin, locations) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-pin";
  button.style.left = `${pin.x}%`;
  button.style.top = `${pin.y}%`;
  button.setAttribute("aria-label", pin.label);
  button.title = pin.label;

  const location = locations.find((item) => item.name === pin.locationName) || null;

  button.addEventListener("click", () => {
    document.querySelectorAll(".map-pin").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderSidebar(pin, location);
  });

  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  return button;
}

async function main() {
  try {
    const [atlas, pins] = await Promise.all([
      loadJson("atlas.json"),
      loadJson("map-pins.json")
    ]);

    setGeneratedAt(atlas.generatedAt);

    const root = document.querySelector("[data-map-pins]");
    if (!root) {
      return;
    }

    const controller = createMapController();
    setupPinHelper(controller);

    const pinMap = new Map();
    pins.forEach((pin, index) => {
      const element = createPin(pin, atlas.locations || []);
      pinMap.set(pin.id, { pin, element });
      root.appendChild(element);
      if (index === 0) {
        element.click();
      }
    });

    const params = new URLSearchParams(window.location.search);
    const focusPinId = params.get("pin");
    const requestedZoom = Number.parseFloat(params.get("zoom") || "");
    if (focusPinId && pinMap.has(focusPinId)) {
      const target = pinMap.get(focusPinId);
      target.element.click();
      requestAnimationFrame(() => {
        controller.focusOnPoint(
          target.pin.x,
          target.pin.y,
          Number.isFinite(requestedZoom) ? requestedZoom : 3.8
        );
      });
    }
  } catch (error) {
    setError(error);
  }
}

main();
