/* pages/admin.html — company dashboard */
(function () {
  const me = HCM.auth.guard("admin");
  if (!me) return;
  const { db, ui, date: D, attendance: A, leave: L, charts } = HCM;
  const { icon, esc, avatar, badge } = ui;

  ui.shell(me, "admin", {
    title: `${D.greeting()}, ${esc(me.name.split(" ")[0])}`,
    actions: `<a class="btn btn-primary" href="employees.html#new">${icon("plus")}<span class="lbl">Add employee</span></a>`,
  });

  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="bento">
      <div id="kpis" style="display:contents"></div>

      <section class="card spot c-8 reveal">
        <div class="card-head"><div><h3>Attendance trend</h3><p>People present on each of the last 14 working days</p></div><a class="card-link" href="attendance.html">Records ${icon("arrowUpRight")}</a></div>
        <div id="trend"></div>
      </section>
      <section class="card spot c-4 reveal">
        <div class="card-head"><div><h3>Today at a glance</h3><p id="todayLabel"></p></div></div>
        <div class="donut-row" id="donut"></div>
      </section>

      <section class="card spot c-7 reveal">
        <div class="card-head"><div><h3>Attendance by department</h3><p>Today, live</p></div></div>
        <div id="dept"></div>
      </section>
      <section class="card c-5 reveal" id="helper"></section>

      <section class="card spot c-4 reveal">
        <div class="card-head"><div><h3>Live check-ins</h3><p>Today's punches</p></div><span class="badge tone-ok live"><i></i>Live</span></div>
        <div id="feed" class="feed"></div>
      </section>
      <section class="card spot c-4 reveal">
        <div class="card-head"><div><h3>Pending leave</h3><p>Decide in one tap</p></div><a class="card-link" href="leaves.html">All ${icon("arrowUpRight")}</a></div>
        <div id="pending"></div>
      </section>
      <section class="card spot c-4 reveal">
        <div class="card-head"><div><h3>Announcements</h3><p>Visible to every employee</p></div><button class="icon-btn sm" id="newAnn" aria-label="New announcement">${icon("plus")}</button></div>
        <div id="anns"></div>
      </section>
    </div>`;

  HCM.helper.mount(document.getElementById("helper"), me);
  document.getElementById("newAnn").onclick = postAnnouncement;

  function render() {
    const today = D.today();
    const snap = A.companyDay(today);
    const pending = db.leaves().filter((l) => l.status === "pending");
    const pct = snap.total ? Math.round((snap.present / snap.total) * 100) : 0;

    document.getElementById("kpis").innerHTML = `
      <div class="card kpi ink c-3 reveal in">
        <div class="kpi-top">Employees<span class="kpi-ic">${icon("users")}</span></div>
        <div class="kpi-val" data-count="${snap.total}">0</div>
        <div class="kpi-sub">${db.departments().length} departments</div>
      </div>
      <div class="card kpi accent c-3 reveal in">
        <div class="kpi-top">Present today<span class="kpi-ic">${icon("check")}</span></div>
        <div class="kpi-val" data-count="${snap.present}">0</div>
        <div class="kpi-sub">${pct}% of team · ${snap.notyet} not in yet</div>
        <div class="meter" style="color:var(--on-volt);background:rgba(0,0,0,.1)"><i style="--v:${pct}%"></i></div>
      </div>
      <div class="card kpi spot c-3 reveal in">
        <div class="kpi-top">Late today<span class="kpi-ic" style="color:var(--warn)">${icon("clock")}</span></div>
        <div class="kpi-val" data-count="${snap.late}">0</div>
        <div class="kpi-sub">After ${D.time12(db.company().startTime)} + ${db.company().graceMinutes}m grace</div>
      </div>
      <div class="card kpi spot c-3 reveal in">
        <div class="kpi-top">On leave<span class="kpi-ic" style="color:var(--sky)">${icon("plane")}</span></div>
        <div class="kpi-val" data-count="${snap.leave}">0</div>
        <div class="kpi-sub">${pending.length} request${pending.length === 1 ? "" : "s"} pending</div>
      </div>`;

    /* trend */
    const company = db.company();
    const days = [];
    for (let k = today; days.length < 14 && k > D.addDays(today, -60); k = D.addDays(k, -1)) if (D.isWorkingDay(k, company) || k === today) days.unshift(k);
    const records = db.attendance();
    charts.area(document.getElementById("trend"), days.map((k) => ({
      label: D.nice(k, { weekday: "short", day: "numeric", month: "short" }),
      short: D.nice(k, { day: "numeric", month: "short" }),
      value: new Set(records.filter((r) => r.date === k).map((r) => r.userId)).size,
    })), { suffix: " present" });

    /* donut */
    document.getElementById("todayLabel").textContent = D.long();
    const onTime = snap.rows.filter((r) => ["present", "working"].includes(r.status) && !r.ev?.late).length;
    charts.donut(document.getElementById("donut"), [
      { name: "On time", value: onTime, color: "var(--ok)" },
      { name: "Late", value: snap.late, color: "var(--amber)" },
      { name: "Half day", value: snap.rows.filter((r) => r.status === "half" && !r.ev?.late).length, color: "var(--violet)" },
      { name: "On leave", value: snap.leave, color: "var(--sky)" },
      { name: "Not in", value: snap.notyet + snap.absent, color: "var(--line-2)" },
    ], { center: snap.total ? `${pct}%` : "—", sub: "present" });

    /* department bars */
    const C = { on: "var(--ok)", late: "var(--amber)", leave: "var(--sky)", out: "var(--line-2)" };
    charts.stackedBars(document.getElementById("dept"), db.departments().map((d) => {
      const rows = snap.rows.filter((r) => r.user.department === d);
      return {
        label: d,
        parts: [
          { name: "On time", value: rows.filter((r) => r.rec && !r.ev?.late).length, color: C.on },
          { name: "Late", value: rows.filter((r) => r.ev?.late).length, color: C.late },
          { name: "On leave", value: rows.filter((r) => r.status === "leave").length, color: C.leave },
          { name: "Not in", value: rows.filter((r) => ["notyet", "absent"].includes(r.status)).length, color: C.out },
        ],
      };
    }), { legend: [{ name: "On time", color: C.on }, { name: "Late", color: C.late }, { name: "On leave", color: C.leave }, { name: "Not in", color: C.out }] });

    /* live feed */
    const punched = snap.rows.filter((r) => r.rec).sort((a, b) => (b.rec.checkOut || b.rec.checkIn).localeCompare(a.rec.checkOut || a.rec.checkIn));
    document.getElementById("feed").innerHTML = punched.length
      ? punched.slice(0, 7).map((r) => `
        <div class="feed-item">${avatar(r.user, "sm")}
          <div class="grow"><b>${esc(r.user.name)}</b><small>${r.rec.checkOut ? "Checked out" : "Checked in"}${r.rec.method === "camera" ? " · 📷 face" : ""}</small></div>
          <div class="feed-time">${D.time(r.rec.checkOut || r.rec.checkIn)}<br>${badge(r.status)}</div>
        </div>`).join("")
      : ui.empty("No punches yet", snap.total ? "Check-ins will stream in here in real time." : "Add employees to get started.", "inbox");

    /* pending */
    const pendEl = document.getElementById("pending");
    pendEl.innerHTML = pending.length
      ? pending.slice(0, 4).map((l) => {
          const u = db.user(l.userId);
          return `<div class="feed-item" data-id="${l.id}">${avatar(u, "sm")}
            <div class="grow"><b>${esc(u?.name)}</b><small>${L.TYPES[l.type].label} · ${l.days}d · ${D.short(l.from)}${l.from !== l.to ? " – " + D.short(l.to) : ""}</small></div>
            <button class="icon-btn sm" data-a="rejected" aria-label="Reject" title="Reject">${icon("x")}</button>
            <button class="icon-btn sm solid" data-a="approved" aria-label="Approve" title="Approve">${icon("check")}</button>
          </div>`;
        }).join("")
      : ui.empty("All caught up", "No leave requests are waiting for you.", "calendar");
    pendEl.querySelectorAll("[data-a]").forEach((b) => (b.onclick = (e) => {
      const id = b.closest("[data-id]").dataset.id;
      const r = L.decide(id, b.dataset.a, "", me.id);
      if (r.error) return ui.toast(r.error, "bad");
      ui.toast(`Leave ${b.dataset.a}`);
      if (b.dataset.a === "approved") ui.confetti(e.clientX, e.clientY);
    }));

    /* announcements */
    const anns = db.announcements().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const annEl = document.getElementById("anns");
    annEl.innerHTML = anns.length
      ? anns.slice(0, 3).map((a) => `<article class="ann"><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p><small>${D.ago(a.createdAt)}</small><button class="icon-btn sm" data-del="${a.id}" aria-label="Delete">${icon("trash")}</button></article>`).join("")
      : ui.empty("Nothing posted", "Share news, holidays or reminders with the team.", "inbox");
    annEl.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
      if (await ui.confirm({ title: "Delete announcement?", text: "Employees will no longer see it.", ok: "Delete", danger: true }))
        db.saveAnnouncements(db.announcements().filter((a) => a.id !== b.dataset.del));
    }));

    ui.countUp(document.getElementById("kpis"));
  }

  function postAnnouncement() {
    ui.modal({
      title: "New announcement",
      body: `<form class="form-grid one" id="annForm" novalidate>
        ${ui.field({ name: "title", label: "Title", placeholder: "e.g. Office closed on Friday" })}
        ${ui.field({ name: "body", label: "Message", type: "textarea", placeholder: "Write a short note for everyone…" })}
      </form>`,
      actions: [
        { label: "Cancel" },
        { label: `${icon("megaphone")} Post`, cls: "btn-primary", onClick(close, el) {
          const f = el.querySelector("#annForm"); const d = ui.formData(f);
          const errs = {};
          if (!d.title.trim()) errs.title = "Add a title.";
          if (!d.body.trim()) errs.body = "Write a message.";
          if (!ui.showErrors(f, errs)) return;
          db.saveAnnouncements([...db.announcements(), { id: HCM.uid(), title: d.title.trim(), body: d.body.trim(), createdAt: new Date().toISOString(), by: me.id }]);
          ui.toast("Announcement posted"); close();
        } },
      ],
    });
  }

  render();
  // Live: re-render when an employee checks in from another tab, etc.
  let t; HCM.store.onChange((k) => { if (k !== HCM.KEYS.session && k !== HCM.KEYS.theme) { clearTimeout(t); t = setTimeout(render, 60); } });
  setInterval(render, 60000);
})();
