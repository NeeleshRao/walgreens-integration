function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]').content;
}

/** POST a JSON payload to our Django endpoint. Never throws; returns {ok, status, body}. */
async function postJSON(url, payload) {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken() },
      body: JSON.stringify(payload),
    });
    let body = null;
    try { body = await resp.json(); } catch { /* empty or non-JSON body */ }
    return { ok: resp.ok, status: resp.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: { error: `Request failed: ${err.message}` } };
  }
}

/** Per-tab state shared between the scheduling pages. */
const store = {
  get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } },
};

/** Tiny DOM helper: h("p", "warn", "text") */
function h(tag, className = "", text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function showJSON(pre, value) {
  pre.hidden = false;
  pre.textContent = JSON.stringify(value, null, 2);
}
