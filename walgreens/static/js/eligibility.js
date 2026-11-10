const form = document.getElementById("eligibility-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("eligibility-results");
const eligibleEl = document.getElementById("eligible");
const ineligibleEl = document.getElementById("ineligible");
const debugEl = document.getElementById("debug");
let lastQuery = null;
let lastData = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(form));
  statusEl.textContent = "Checking eligibility...";
  resultsEl.hidden = true;

  const r = await postJSON(window.ELIGIBILITY_URL, payload);
  showJSON(debugEl, r.body);
  if (!r.ok) {
    statusEl.textContent = `Error: ${r.body?.error ?? r.status}`;
    return;
  }

  const data = r.body.data ?? {};
  lastData = data;

  lastQuery = { state: payload.state.toUpperCase(), dob: payload.dob };
  renderList(eligibleEl, data.eligibleVaccineList, true);
  renderList(ineligibleEl, data.inEligibleVaccineList, false);
  resultsEl.hidden = false;
  statusEl.textContent = `Age ${data.age ?? "?"}: ${(data.eligibleVaccineList ?? []).length} eligible vaccine(s)`;
});

function renderList(container, list, selectable) {
  container.replaceChildren();
  for (const v of list ?? []) {
    const card = h("article", "card");
    if (selectable) {
      const label = h("label", "check");
      const box = h("input");
      box.type = "checkbox";
      box.value = v.vaccineCode;
      box.setAttribute("form", "");   // keep it out of the form's data
      label.append(box, ` ${v.displayName} (${v.vaccineCode})`);
      card.append(label);
    } else {
      card.append(h("h3", "", `${v.displayName} (${v.vaccineCode})`));
    }
    if (v.multiDose) card.append(h("p", "muted", "Multi-dose series"));

    // The doc requires showing every restriction / warning message to the user.
    for (const r of v.restrictions ?? []) card.append(h("p", "restrict", `Restriction: ${r.message}`));
    for (const w of v.warnings ?? []) {
      card.append(h("p", "warn", `Warning: ${w.message}`));
      if (w.question) card.append(h("p", "muted", `${w.question} — ${(w.answers ?? []).join(" / ")}`));
    }
    container.append(card);
  }
  if (!container.children.length) container.append(h("p", "muted", "None"));
}

document.getElementById("to-timeslots").addEventListener("click", () => {
  const vaccines = [...eligibleEl.querySelectorAll('input[type="checkbox"]:checked')].map((b) => b.value);
  if (!vaccines.length) { statusEl.textContent = "Tick at least one eligible vaccine."; return; }
  if (vaccines.length > 4) { statusEl.textContent = "Timeslots accepts at most 4 vaccines."; return; }

  // Prescription questionnaire items for the chosen vaccines (used on the Booking page)
  const questions = [];
  for (const v of lastData?.eligibleVaccineList ?? []) {
    if (!vaccines.includes(v.vaccineCode)) continue;
    for (const w of v.warnings ?? []) {
      if (w.code === "WAG_FC_PRESCRIPTIONNEEDED_USER_RESPONSE" && w.question) {
        questions.push({ vaccineCode: v.vaccineCode, vaccineName: v.displayName, question: w.question, answers: w.answers ?? [] });
      }
    }
  }
  store.set("sched.questions", questions);
  store.set("sched.search", { ...lastQuery, vaccines });
  window.location.href = window.TIMESLOTS_URL;
});

