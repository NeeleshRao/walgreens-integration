const form = document.getElementById("details-form");
const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const params = new URLSearchParams(new FormData(form));
  statusEl.textContent = "Loading...";
  detailsEl.hidden = true;
  detailsEl.replaceChildren();

  try {
    const resp = await fetch(`${window.DETAILS_URL}?${params}`);
    const body = await resp.json();
    if (!resp.ok) {
      statusEl.textContent = `Error: ${body.error}`;
      return;
    }
    const d = body.data;
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      statusEl.textContent = "Unexpected response: " + JSON.stringify(d).slice(0, 200);
      return;
    }
    render(d);
  } catch (err) {
    statusEl.textContent = `Request failed: ${err.message}`;
  }
});

/* ---------- DOM helpers ---------- */

function card(title, ...children) {
  const el = document.createElement("article");
  el.className = "card";
  const h = document.createElement("h3");
  h.textContent = title;
  el.append(h, ...children);
  return el;
}

function line(text, muted = false) {
  const p = document.createElement("p");
  p.textContent = text;
  if (muted) p.style.color = "#777";
  return p;
}

function row(table, ...cells) {
  const tr = document.createElement("tr");
  for (const c of cells) {
    const td = document.createElement("td");
    td.textContent = c;
    tr.append(td);
  }
  table.append(tr);
}

/* ---------- formatting ---------- */

function formatPhone(p) {
  if (!p || !p.number) return "";
  const digits = `${p.areaCode || ""}${p.number}`.replace(/\D/g, "");
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : `${p.areaCode || ""} ${p.number}`.trim();
}

function formatFax(p) {
  return p && p.faxNumber ? formatPhone({ areaCode: p.areaCode, number: p.faxNumber }) : "";
}

function openText(h) {
  if (h["24Hrs"] === true || h["24Hrs"] === "Y") return "Open 24 hours";
  if (!h.open || !h.close || h.open === h.close) return "Closed";
  return `${h.open} – ${h.close}`;
}

/* ---------- hours ---------- */

// Weekly summary (Mon - Fri, Sat - Sun), with meal-break notes.
function hoursTable(block) {
  const hours = (block && block.hours) || [];
  if (!hours.length) return line("Hours not available.");

  const table = document.createElement("table");
  for (const h of hours) {
    row(table, h.day || "", openText(h));
    for (const m of h.mealBreak || []) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 2;
      td.textContent = m.message;
      td.style.color = "#777";
      td.style.fontSize = ".85rem";
      tr.append(td);
      table.append(tr);
    }
  }
  return table;
}

// Next 7 dated days (more accurate around holidays).
function dailyHoursTable(block) {
  const days = (block && block.hrs) || [];
  if (!days.length) return line("Daily hours not available.");

  const table = document.createElement("table");
  for (const h of days) {
    row(table, `${h.day} ${h.date || ""}`.trim(), openText(h));
  }
  return table;
}

/* ---------- render ---------- */

function render(d) {
  const a = d.address || {};
  const addressLine = [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
  const phone = formatPhone(d.phone);
  const pharmacyPhone = formatPhone(d.pharmacyPhoneNumber);
  const fax = formatFax(d.phone);

  const hasStoreHours =
    d.storeInfo && ((d.storeInfo.hours || []).length || (d.storeInfo.hrs || []).length);

  const pharmacyStatus =
    (d.storeNewStatus && d.storeNewStatus.pharmacyStatus) ||
    (d.storeStatus && d.storeStatus.pharmacyStatus) || "Unknown";
  const storeStatus =
    (d.storeNewStatus && d.storeNewStatus.storeStatus) ||
    (d.storeStatus && d.storeStatus.storeStatus) || "Unknown";

  statusEl.textContent = `Store #${d.storeNumber}`;

  detailsEl.append(
    card("Status",
      line(`Pharmacy: ${pharmacyStatus}`),
      line(`Store: ${storeStatus}`)),

    card("Location",
      line(d.storeBrand || a.locationName || ""),
      line(addressLine),
      line(phone ? `Store phone: ${phone}` : ""),
      line(pharmacyPhone ? `Pharmacy phone: ${pharmacyPhone}` : ""),
      line(fax ? `Fax: ${fax}` : ""),
      line(`Lat/Lng: ${d.latitude}, ${d.longitude}`, true)),

    hasStoreHours
      ? card("Store hours", hoursTable(d.storeInfo))
      : card("Store hours", line("No retail store hours. This location is pharmacy-only.")),

    card("Pharmacy hours", hoursTable(d.pharmacy)),
    card("Pharmacy: next 7 days", dailyHoursTable(d.pharmacy)),

    card("Services", ...(d.services || []).map((s) => line(s.serviceName)))
  );

  // drop cards that came out empty (e.g. no fax, no phone lines)
  for (const p of detailsEl.querySelectorAll("p")) {
    if (!p.textContent.trim()) p.remove();
  }
  detailsEl.hidden = false;
}
