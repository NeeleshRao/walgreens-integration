const form = document.getElementById("inventory-form");
const statusEl = document.getElementById("status");
const table = document.getElementById("inventory-table");
const tbody = document.getElementById("inventory-body");
const filterEl = document.getElementById("filter");

const MAX_ROWS = 200;
let items = [];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const params = new URLSearchParams(new FormData(form));
  statusEl.textContent = "Looking up inventory...";
  table.hidden = true;
  tbody.replaceChildren();

  try {
    const resp = await fetch(`${window.INVENTORY_URL}?${params}`);
    const body = await resp.json();
    console.log("inventory response", body);

    if (!resp.ok) {
      statusEl.textContent = `Error: ${body.error}`;
      return;
    }
    items = Array.isArray(body.data) ? body.data : [];
    filterEl.value = "";
    render();
  } catch (err) {
    statusEl.textContent = `Request failed: ${err.message}`;
  }
});

filterEl.addEventListener("input", render);

function render() {
  const q = filterEl.value.trim();
  const matches = q ? items.filter((i) => String(i.id).includes(q)) : items;
  const shown = matches.slice(0, MAX_ROWS);

  tbody.replaceChildren();
  for (const i of shown) {
    const tr = document.createElement("tr");
    const updated = i.ut ? new Date(i.ut).toLocaleString() : "";
    for (const text of [i.id, i.q, updated]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    }
    tbody.append(tr);
  }

  table.hidden = matches.length === 0;
  statusEl.textContent = matches.length
    ? `${matches.length} item(s)` + (matches.length > MAX_ROWS ? `, showing first ${MAX_ROWS}` : "")
    : items.length ? "No items match the filter" : "No inventory returned";
}
