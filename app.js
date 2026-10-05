import { getPage, createPage, updatePage } from "./lib/api.js";
import { newSlug, newCode } from "./lib/codes.js";
import { calc } from "./lib/calc.js";

const $ = (s) => document.querySelector(s);
const app = $("#app");
const key = (s) => "bclock:" + s;
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const num = (v, min, max) => Math.min(max, Math.max(min, +v || 0));
let slug, data, code, timer;

function msg(t) {
  app.innerHTML = `<p>${esc(t)}</p><a href="#/">Create a tracker</a>`;
}

async function route() {
  slug = location.hash.slice(2);
  if (!slug) return home();
  app.innerHTML = '<p class="muted">Loading…</p>';
  try {
    data = await getPage(slug);
  } catch (e) {
    return msg(e.message);
  }
  if (!data) return msg("No tracker with this link.");
  code = localStorage.getItem(key(slug));
  view();
}

function home() {
  app.innerHTML = `<h1>LockedIn</h1><p class="muted">Track course progress. One link to view, one code to edit.</p>
  <div class="card form">
    <label>Courses<input id="n" type="number" value="5" min="1" max="20"></label>
    <label>Planned days<input id="d" type="number" value="30" min="1"></label>
    <label>Current day<input id="c" type="number" value="1" min="1"></label>
    <button id="go">Create tracker</button>
  </div><p id="err" class="err"></p>`;
  $("#go").onclick = async () => {
    const n = num($("#n").value, 1, 20),
      total = num($("#d").value, 1, 3650);
    const d = {
      totalDays: total,
      currentDay: num($("#c").value, 1, total),
      courses: Array.from({ length: n }, (_, i) => ({
        name: "Course " + (i + 1),
        weight: 1,
        pct: 0,
      })),
    };
    const s = newSlug(),
      k = newCode();
    try {
      await createPage(s, k, d);
      localStorage.setItem(key(s), k);
      sessionStorage.setItem("new:" + s, k);
      location.hash = "#/" + s;
    } catch (e) {
      $("#err").textContent = e.message;
    }
  };
}

function view() {
  const edit = !!code,
    dis = edit ? "" : "disabled",
    fresh = sessionStorage.getItem("new:" + slug);
  app.innerHTML = `<h1>LockedIn <span class="muted">${esc(slug)}</span></h1>
  ${fresh ? `<div class="card note row">Your edit code (shown once, save it): <b>${esc(fresh)}</b> <button id="dis">Done</button></div>` : ""}
  ${edit ? "" : `<div class="card row"><input id="code" placeholder="Edit code"><button id="unlock">Unlock editing</button></div><p id="err" class="err"></p>`}
  <div class="card top">
    <label>Planned days<input data-f="totalDays" type="number" min="1" value="${data.totalDays}" ${dis}></label>
    <label>Current day<input data-f="currentDay" type="number" min="1" value="${data.currentDay}" ${dis}></label>
    <div class="sum">
      <div class="summary-heading"><strong>Progress overview</strong><span id="delta" class="delta"></span></div>
      <div class="compare-line">
        <div class="compare-label"><span>Your progress</span><b id="av"></b></div>
        <div class="compare-track actual-track"><i id="ba"></i></div>
      </div>
      <div class="compare-line">
        <div class="compare-label"><span>Planned by today</span><b id="ev"></b></div>
        <div class="compare-track expected-track"><i id="be"></i></div>
      </div>
      <p id="st" class="summary-note"></p>
    </div>
  </div>
  <div class="grid">${data.courses
    .map(
      (c, i) => `
    <div class="card course-card"><div class="row course-head">
      <input data-i="${i}" data-f="name" value="${esc(c.name)}" aria-label="Course name" ${dis}>
      <div class="course-actions">
        <label class="weight-field">Weight<input data-i="${i}" data-f="weight" type="number" min="0" value="${c.weight}" title="Weight" aria-label="Weight" ${dis}></label>
        ${edit ? `<button type="button" class="remove-course" data-remove="${i}" aria-label="Remove ${esc(c.name)}">Remove</button>` : ""}
      </div>
    </div>
    <div class="progress-entry">
      <div class="track"><input type="range" data-i="${i}" data-f="pct" min="0" max="100" value="${c.pct}" aria-label="Percent complete" ${dis}></div>
      <label class="percent-field">Progress<input data-i="${i}" data-f="pct" type="number" min="0" max="100" value="${c.pct}" aria-label="Progress percentage" ${dis}></label>
    </div>
    <div class="course-compare">
      <div class="course-compare-line">
        <div class="compare-label"><span>Your progress</span><b data-actual="${i}"></b></div>
        <div class="compare-track actual-track"><i data-actual-bar="${i}"></i></div>
      </div>
      <div class="course-compare-line">
        <div class="compare-label"><span>Planned by today</span><b data-expected="${i}"></b></div>
        <div class="compare-track expected-track"><i data-expected-bar="${i}"></i></div>
      </div>
    </div>
    <p class="muted" data-info="${i}"></p></div>`,
    )
    .join("")}
  </div>
  ${edit ? '<div class="editor-actions"><button id="add">Add course</button><span id="save-error" class="err" role="alert"></span></div>' : ""}`;
  if ($("#dis"))
    $("#dis").onclick = () => {
      sessionStorage.removeItem("new:" + slug);
      view();
    };
  if ($("#unlock"))
    $("#unlock").onclick = async () => {
      const k = $("#code").value.trim();
      try {
        // update_page returns true only if the code matches (rewrites identical data).
        if (await updatePage(slug, k, data)) {
          localStorage.setItem(key(slug), k);
          code = k;
          view();
        } else $("#err").textContent = "Wrong edit code.";
      } catch (e) {
        $("#err").textContent = e.message;
      }
    };
  if ($("#add"))
    $("#add").onclick = () => {
      if (data.courses.length >= 20) return;
      data.courses.push({
        name: "Course " + (data.courses.length + 1),
        weight: 1,
        pct: 0,
      });
      view();
      queueSave();
    };
  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.onclick = () => {
      if (data.courses.length <= 1) return;
      const i = Number(button.dataset.remove);
      data.courses.splice(i, 1);
      view();
      queueSave();
    };
  });
  refresh();
}

function refresh() {
  const r = calc(data);
  $("#ba").style.width = r.actual + "%";
  $("#be").style.width = r.expected + "%";
  $("#av").textContent = `${r.actual.toFixed(1)}%`;
  $("#ev").textContent = `${r.expected.toFixed(1)}%`;
  $("#delta").textContent =
    `${r.delta >= 0 ? "+" : "-"}${Math.abs(r.delta).toFixed(1)}%`;
  $("#delta").className = `delta ${r.delta >= 0 ? "ahead" : "behind"}`;
  $("#st").textContent =
    r.delta >= 0
      ? "You are ahead of the planned pace."
      : "You are behind the planned pace.";
  document.querySelectorAll("[data-info]").forEach((p) => {
    const i = p.dataset.info;
    const c = data.courses[i];
    const expected = r.expected;
    document.querySelector(`[data-actual="${i}"]`).textContent =
      `${c.pct.toFixed(1)}%`;
    document.querySelector(`[data-actual-bar="${i}"]`).style.width =
      `${c.pct}%`;
    document.querySelector(`[data-expected="${i}"]`).textContent =
      `${expected.toFixed(1)}%`;
    document.querySelector(`[data-expected-bar="${i}"]`).style.width =
      `${expected}%`;
    document
      .querySelectorAll(`[data-i="${i}"][data-f="pct"]`)
      .forEach((input) => {
        if (input.value !== String(c.pct)) input.value = c.pct;
      });
    p.textContent = `${c.pct}% done, needs ${r.perDay(c).toFixed(1)}%/day to reach the planned pace`;
  });
}

function queueSave() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      if (!(await updatePage(slug, code, data))) {
        localStorage.removeItem(key(slug));
        code = null;
        return view();
      }
    } catch (e) {
      const error = $("#save-error");
      if (error) error.textContent = e.message;
    }
  }, 700);
}

app.oninput = (e) => {
  const t = e.target,
    f = t.dataset.f;
  if (!f || !code) return;
  if (t.dataset.i !== undefined) {
    const c = data.courses[t.dataset.i];
    c[f] = f === "name" ? t.value : num(t.value, 0, f === "pct" ? 100 : 1e6);
  } else data[f] = num(t.value, 1, 3650);
  refresh();
  queueSave();
};

window.onhashchange = route;
route();
