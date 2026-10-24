/* pages/attendance.html — every record, matrix view, CSV export, printable report */
(function () {
  const me = HCM.auth.guard("admin");
  if (!me) return;
  const { db, ui, date: D, attendance: A } = HCM;
  const { icon, esc, avatar, badge } = ui;

  ui.shell(me, "attendance", {
    title: "Attendance",
    subtitle: "All records",
    actions: `<button class="btn" id="csvBtn">${icon("download")}<span class="lbl">CSV</span></button><button class="btn btn-dark" id="printBtn">${icon("printer")}<span class="lbl">Report</span></button>`,
  });

  const state = { month: D.monthValue(), emp: "", status: "", mode: "matrix" };
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="print-only" id="printHead"></div>
    <div class="toolbar no-print reveal">
      <input type="month" id="month" value="${state.month}" style="width:auto" aria-label="Month"/>
      <select id="emp" style="width:auto;min-width:180px" aria-label="Employee"><option value="">All employees</option>${db.employees().map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join("")}</select>
      <select id="status" style="width:auto" aria-label="Status"><option value="">Any status</option>${["present", "late", "half", "absent", "leave"].map((s) => `<option value="${s}">${A.STATUS[s].label}</option>`).join("")}</select>
      <span class="grow"></span>
      <div class="seg" id="mode"><button data-m="matrix">${icon("grid")}Matrix</button><button data-m="log">${icon("list")}Log</button></div>
    </div>
    <div class="bento" id="sum" style="margin-bottom:16px"></div>
    <section class="card reveal" id="body"></section>`;

  ["month", "emp", "status"].forEach((id) => (document.getElementById(id).onchange = (e) => { state[id] = e.target.value; render(); }));
  document.querySelectorAll("#mode button").forEach((b) => (b.onclick = () => { state.mode = b.dataset.m; render(); }));
  document.getElementById("csvBtn").onclick = () => {
    const rows = collect();
    if (!rows.length) return ui.toast("Nothing to export for this filter", "info");
    ui.download(`attendance-${state.month}.csv`, A.toCSV(rows));
    ui.toast(`Exported ${rows.length} rows`);
  };
  document.getElementById("printBtn").onclick = () => window.print();

  function people() { return db.employees().filter((e) => !state.emp || e.id === state.emp).sort((a, b) => a.name.localeCompare(b.name)); }

  function collect() {
    const { year, month } = D.parseMonth(state.month);
    const keys = D.monthKeys(year, month).filter((k) => k <= D.today());
    const ctx = { company: db.company(), records: db.attendance(), leaves: db.leaves() };
    const out = [];
    people().forEach((u) => keys.forEach((k) => {
      const r = A.dayStatus(u, k, ctx);
      if (["off", "future", "prejoin", "notyet"].includes(r.status) && !r.rec) return;
      if (state.status && !(r.status === state.status || (state.status === "late" && r.ev?.late) || (state.status === "present" && r.status === "working"))) return;
      out.push({ date: k, user: u, ...r });
    }));
    return out.sort((a, b) => b.date.localeCompare(a.date) || a.user.name.localeCompare(b.user.name));
  }

  function render() {
    document.querySelectorAll("#mode button").forEach((b) => b.classList.toggle("on", b.dataset.m === state.mode));
    const { year, month } = D.parseMonth(state.month);
    const rows = collect();
    const count = (fn) => rows.filter(fn).length;
    const hours = rows.reduce((s, r) => s + (r.ev?.hours || 0), 0);
    document.getElementById("printHead").innerHTML = `<h2>${esc(db.company().name)} — Attendance report</h2><p class="muted">${D.monthName(year, month)} · generated ${D.long()}</p><br>`;
    document.getElementById("sum").innerHTML = [
      ["Present", count((r) => ["present", "late", "working"].includes(r.status)), "var(--ok)"],
      ["Late", count((r) => r.ev?.late), "var(--amber)"],
      ["Half days", count((r) => r.status === "half"), "var(--violet)"],
      ["Absent", count((r) => r.status === "absent"), "var(--bad)"],
      ["Leave", count((r) => r.status === "leave"), "var(--sky)"],
      ["Hours logged", Math.round(hours), "var(--text)"],
    ].map(([l, v, c]) => `<div class="card mini c-2" style="--c:${c}"><small><i></i>${l}</small><b data-count="${v}">0</b></div>`).join("");
    ui.countUp(document.getElementById("sum"));

    const body = document.getElementById("body");
    if (!db.employees().length) { body.innerHTML = ui.empty("No employees yet", "Attendance shows up once your team starts checking in.", "people"); return; }

    if (state.mode === "matrix") {
      const keys = D.monthKeys(year, month);
      const ctx = { company: db.company(), records: db.attendance(), leaves: db.leaves() };
      body.innerHTML = `
        <div class="card-head"><div><h3>${D.monthName(year, month)}</h3><p>Each square is one day — hover for details</p></div></div>
        <div class="matrix"><table>
          <thead><tr><th>Employee</th>${keys.map((k) => `<th class="${D.isWorkingDay(k, ctx.company) ? "" : "muted"}">${D.dayName(D.weekday(k), "narrow")}<br>${+k.slice(8)}</th>`).join("")}</tr></thead>
          <tbody>${people().map((u) => `<tr><td><div class="person">${avatar(u, "sm")}<div><b>${esc(u.name)}</b><small>${esc(u.department)}</small></div></div></td>
            ${keys.map((k) => {
              const r = A.dayStatus(u, k, ctx);
              const dim = state.status && !(r.status === state.status || (state.status === "late" && r.ev?.late));
              return `<td><span class="mx st-${r.status}" style="${dim ? "opacity:.15" : ""}" title="${esc(u.name)} · ${D.nice(k)} · ${A.STATUS[r.status].label}${r.rec ? ` · ${D.time(r.rec.checkIn)}–${D.time(r.rec.checkOut)}` : ""}"></span></td>`;
            }).join("")}</tr>`).join("")}</tbody>
        </table></div>
        <div class="legend">${[["present", "var(--ok)"], ["late", "var(--amber)"], ["half", "var(--violet)"], ["leave", "var(--sky)"], ["absent", "var(--bad)"]].map(([s, c]) => `<span><i style="background:${c}"></i>${A.STATUS[s].label}</span>`).join("")}<span><i style="border:1px dashed var(--line-2)"></i>Off day</span></div>`;
    } else {
      body.innerHTML = rows.length
        ? `<div class="table-wrap stack" style="margin-top:-20px;border-top:0"><table>
            <thead><tr><th>Date</th><th>Employee</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th>Method</th></tr></thead>
            <tbody>${rows.map((r) => `<tr>
              <td class="mono">${D.nice(r.date, { weekday: "short", day: "numeric", month: "short" })}</td>
              <td><div class="person">${avatar(r.user, "sm")}<div><b>${esc(r.user.name)}</b><small>${esc(r.user.department)}</small></div></div></td>
              <td class="mono">${D.time(r.rec?.checkIn)}${r.ev?.late ? ` <small style="color:var(--warn)">+${D.late(r.ev.lateBy)}</small>` : ""}</td>
              <td class="mono">${D.time(r.rec?.checkOut)}</td>
              <td class="mono">${r.ev?.hours != null ? D.hours(r.ev.hours) : "—"}</td>
              <td>${badge(r.status)}</td>
              <td>${r.rec ? (r.rec.method === "camera" ? `${icon("face")} Face` : "Quick") : "—"}</td>
            </tr>`).join("")}</tbody></table></div>`
        : ui.empty("No records", "Nothing matches these filters for this month.", "calendar");
    }
  }

  render();
  HCM.store.onChange((k) => [HCM.KEYS.attendance, HCM.KEYS.leaves].includes(k) && render());
})();
