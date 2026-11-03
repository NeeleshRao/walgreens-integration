const geoForm = document.getElementById("geo-form");
const addressForm = document.getElementById("address-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const zipForm = document.getElementById("zip-form");

document.getElementById("use-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation is not supported by this browser.";
    return;
  }
  statusEl.textContent = "Getting your location...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoForm.lat.value = pos.coords.latitude.toFixed(6);
      geoForm.lng.value = pos.coords.longitude.toFixed(6);
      statusEl.textContent = "Location filled in. Press Search.";
    },
    (err) => (statusEl.textContent = `Location error: ${err.message}`)
  );
});

geoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch("/storelocator/api/search/geo/", new FormData(geoForm));
});

addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch("/storelocator/api/search/address/", new FormData(addressForm));
});

async function runSearch(url, formData) {
  const params = new URLSearchParams(formData);
  statusEl.textContent = "Searching...";
  resultsEl.replaceChildren();

  try {
    const resp = await fetch(`${url}?${params}`);
    const body = await resp.json();
    if (!resp.ok) {
      statusEl.textContent = `Error: ${body.error}`;
      return;
    }
    renderResults(body.data.results || []);
  } catch (err) {
    statusEl.textContent = `Request failed: ${err.message}`;
  }
}

zipForm.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch("/storelocator/api/search/zip/", new FormData(zipForm));
});


function renderResults(results) {
  statusEl.textContent = results.length ? `${results.length} store(s) found` : "No stores found";
  for (const r of results) {
    const store = r.store || {};
    const addr = store.address || {};
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = `Store #${r.storeNumber}`;

    const line = document.createElement("p");
    line.textContent = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", ");

    const dist = document.createElement("p");
    dist.textContent = `${r.distance} mi away`;

    card.append(title, line, dist);
    resultsEl.append(card);
  }
}


// function showInspector(body) {
//   inspector.hidden = false;
//   document.getElementById("inspector-meta").textContent =
//     body.debug ? `POST ${body.debug.url}\nHTTP ${body.debug.status} in ${body.debug.elapsed_ms} ms\n\n` +
//       JSON.stringify(body.debug.request, null, 2) : "";
//   document.getElementById("inspector-json").textContent = JSON.stringify(body.data ?? body, null, 2);
// }
