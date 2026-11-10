const form = document.getElementById("timeslots-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("slot-results");
const debugEl = document.getElementById("debug");
const boxes = () => [...document.querySelectorAll('input[name="vaccine"]')];

// Defaults, plus anything handed over from the Eligibility page
form.elements.startDateTime.value = new Date().toISOString().slice(0, 10);
const prev = store.get("sched.search");
if (prev) {
  form.elements.state.value = prev.state;
  form.elements.dob.value = prev.dob;
  for (const b of boxes()) b.checked = prev.vaccines.includes(b.value);
}

document.getElementById("use-location").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.elements.latitude.value = pos.coords.latitude.toFixed(5);
      form.elements.longitude.value = pos.coords.longitude.toFixed(5);
    },
    (err) => { statusEl.textContent = `Could not get location: ${err.message}`; },
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const vaccine = boxes().filter((b) => b.checked).map((b) => b.value);
  if (!vaccine.length || vaccine.length > 4) {
    statusEl.textContent = "Select between 1 and 4 vaccines.";
    return;
  }
  const f = Object.fromEntries(new FormData(form));
  statusEl.textContent = "Searching...";
  resultsEl.replaceChildren();

  const r = await postJSON(window.TIMESLOTS_API_URL, { ...f, endDateTime: f.endDateTime || undefined, vaccine });
  showJSON(debugEl, r.body);
  if (!r.ok) {
    statusEl.textContent = `Error: ${r.body?.error ?? r.status}`;
    return;
  }
  const locations = r.body.data?.locations ?? [];
  statusEl.textContent = locations.length ? `${locations.length} location(s)` : "No locations with availability";
  for (const loc of locations) resultsEl.append(renderLocation(loc));
});

function renderLocation(loc) {
  const card = h("article", "card");
  card.append(h("h3", "", loc.name || `Store ${loc.storenumber}`));
  const a = loc.address ?? {};
  card.append(h("p", "", [a.line1, a.city, a.state, a.zip].filter(Boolean).join(", ")));
  const phone = loc.phone?.[0]?.number;
  card.append(h("p", "muted", `${loc.distance ?? "?"} mi${phone ? " · " + phone : ""} · location ${loc.locationId}`));

  for (const day of loc.appointmentAvailability ?? []) {
    const vaccineNames = (day.manufacturer ?? []).map((m) => m.vaccineName).join(", ");
    card.append(h("strong", "", `${day.day ?? ""} ${day.date}`), h("span", "muted", ` — ${vaccineNames}`));
    const slots = h("div", "slots");
    for (const slot of day.slots ?? []) {
      const btn = h("button", "", slot);
      btn.type = "button";
      btn.addEventListener("click", () => selectSlot(loc, day, slot));
      slots.append(btn);
    }
    card.append(slots);
  }
  return card;
}

function selectSlot(loc, day, slot) {
  const a = loc.address ?? {};
  store.set("sched.selection", {
    locationId: loc.locationId,
    locationName: loc.name || `Store ${loc.storenumber}`,
    address: [a.line1, a.city, a.state, a.zip].filter(Boolean).join(", "),
    date: day.date,
    time24: to24h(slot),
    slot,
    timeZone: loc.timeZone || "",
    offset: offsetFor(loc.timeZone, day.date),   // "" if we can't resolve it
    vaccines: (day.manufacturer ?? []).map((m) => ({
      code: m.vaccineCode,
      name: m.vaccineName,
      productId: m.productId,
      rxRequired: Boolean(m.prescriptionRequired),
    })),
  });
  window.location.href = window.BOOKING_URL;
}


/* "09:30 am" -> "09:30:00" */
function to24h(slot) {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(slot.trim());
  if (!m) return "00:00:00";
  let hours = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") hours += 12;
  return `${String(hours).padStart(2, "0")}:${m[2]}:00`;
}

const IANA = {
  ET: "America/New_York", EST: "America/New_York", EDT: "America/New_York",
  CT: "America/Chicago", CST: "America/Chicago", CDT: "America/Chicago",
  MT: "America/Denver", MST: "America/Denver", MDT: "America/Denver",
  PT: "America/Los_Angeles", PST: "America/Los_Angeles", PDT: "America/Los_Angeles",
  AK: "America/Anchorage", AKST: "America/Anchorage", AKDT: "America/Anchorage",
  HI: "Pacific/Honolulu", HST: "Pacific/Honolulu",
  AZ: "America/Phoenix",
};

function offsetFor(tzCode, date) {
  const key = (tzCode || "").trim();
  const zone = key.includes("/") ? key : IANA[key.toUpperCase()];
  if (!zone) return "";                        // unknown: the Booking page will ask
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" })
      .formatToParts(new Date(`${date}T12:00:00Z`));
    const name = parts.find((p) => p.type === "timeZoneName").value;   // "GMT-06:00" or "GMT"
    return name === "GMT" ? "+00:00" : name.replace("GMT", "");
  } catch {
    return "";
  }
}


function toIsoWithOffset(date, slot, tzCode) {
  return `${date}T${to24h(slot)}${offsetFor(tzCode, date)}`;
}
