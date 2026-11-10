const forms = [...document.querySelectorAll("form[data-endpoint]")];

function setEngagementId(id) {
  store.set("sched.engagementId", id);
  for (const f of forms) if (f.elements.engagementId) f.elements.engagementId.value = id;
}
const savedId = store.get("sched.engagementId");
if (savedId) setEngagementId(savedId);

/* ---------- Hold step: driven by the slot picked on the Timeslots page ---------- */
const holdForm = document.getElementById("hold-form");
const selection = store.get("sched.selection");
const questions = (store.get("sched.questions") ?? [])
  .filter((q) => selection?.vaccines.some((v) => v.code === q.vaccineCode));

if (!selection) {
  document.getElementById("no-selection").hidden = false;
  document.getElementById("hold-submit").disabled = true;
} else {
  const box = document.getElementById("selection");
  box.hidden = false;
  box.append(
    h("h3", "", selection.locationName),
    h("p", "muted", selection.address),
    h("p", "", `${selection.date} at ${selection.slot}`),
    h("p", "", "Vaccines: " + selection.vaccines.map((v) => v.name || v.code).join(", ")),
  );
  if (!selection.offset) document.getElementById("offset-field").hidden = false;

  // Prescription questionnaire, shown only when Eligibility returned a question
  const qBox = document.getElementById("questionnaire");
  for (const q of questions) {
    const label = h("label", "", `${q.vaccineName}: ${q.question}`);
    const sel = h("select");
    sel.dataset.question = q.question;
    sel.dataset.vaccine = q.vaccineCode;
    sel.append(new Option("None of these apply", ""));
    for (const a of q.answers) sel.append(new Option(a, a));
    label.append(sel);
    qBox.append(label);
  }
}

function buildHoldPayload(form) {
  if (!selection) throw new Error("Pick a slot on the Timeslots page first");
  const offset = selection.offset || form.elements.offset.value;
  if (!offset) throw new Error("Choose the store's UTC offset");

  const details = [];
  const rx = new Set();
  for (const sel of form.querySelectorAll("select[data-question]")) {
    if (!sel.value) continue;
    details.push({ question: sel.dataset.question, answer: sel.value });
    rx.add(sel.dataset.vaccine);
  }
  return {
    locationId: selection.locationId,
    appointmentDate: `${selection.date}T${selection.time24}${offset}`,
    slot: selection.slot,
    channel: form.elements.channel.value,
    vaccines: selection.vaccines.map((v) => ({
      code: v.code,
      productId: v.productId,
      rxRequired: v.rxRequired || rx.has(v.code),
    })),
    userResponses: details.length ? [{ details }] : undefined,
  };
}

function buildPayload(step, form) {
  if (step === "hold") return buildHoldPayload(form);
  const f = Object.fromEntries(new FormData(form));
  if (step === "patient") {
    return { ...f, smsConsent: form.elements.smsConsent.checked ? "Agree" : "Disagree" };
  }
  return f;   // confirm
}

for (const form of forms) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const out = form.nextElementSibling;
    const step = form.dataset.step;

    let payload;
    try {
      payload = buildPayload(step, form);
    } catch (err) {
      showJSON(out, { error: err.message });
      return;
    }

    const r = await postJSON(form.dataset.endpoint, payload);
    showJSON(out, r.body);
    if (r.ok && step === "hold" && r.body?.data?.engagementId) {
      setEngagementId(r.body.data.engagementId);
    }
  });
}
