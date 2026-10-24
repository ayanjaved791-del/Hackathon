/* pages/employee.html — "My day": check in/out, my attendance, leave, helper */
(function () {
  const me = HCM.auth.guard("employee");
  if (!me) return;
  const { db, ui, date: D, attendance: A, leave: L, charts } = HCM;
  const { icon, esc, badge, leaveBadge, field } = ui;

  ui.shell(me, location.hash === "#leave" ? "myleaves" : "employee", {
    title: `${D.greeting()}, ${esc(me.name.split(" ")[0])}`,
    subtitle: `${D.long()} · ${esc(db.company().name)}`,
  });

  const cal = { year: new Date().getFullYear(), month: new Date().getMonth() };
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="bento">
      <section class="card spot day-hero c-8 reveal" id="hero"></section>
      <section class="card spot c-4 reveal" id="balance"></section>

      <section class="card spot c-7 reveal">
        <div class="card-head"><div><h3 id="calTitle"></h3><p>Your attendance, day by day</p></div>
          <div style="display:flex;gap:6px"><button class="icon-btn sm" id="calPrev" aria-label="Previous month">${icon("chevronLeft")}</button><button class="icon-btn sm" id="calNext" aria-label="Next month">${icon("chevronRight")}</button></div></div>
        <div class="mini-stats" id="monthStats" style="margin-bottom:16px"></div>
        <div id="calendar"></div>
      </section>
      <section class="card c-5 reveal" id="helper"></section>

      <section class="card spot c-6 reveal" id="leave">
        <div class="card-head"><div><h3>Apply for leave</h3><p>Weekends and off days are skipped automatically</p></div></div>
        <form class="form-grid" id="leaveForm" novalidate>
          ${field({ name: "type", label: "Type", options: [{ value: "", label: "Choose…" }, ...Object.entries(L.TYPES).map(([v, t]) => ({ value: v, label: t.label }))] })}
          <div class="field"><span class="label">Working days</span><div class="days-pill" id="dayCount" style="height:46px;justify-content:center"><b>0</b> days</div></div>
          ${field({ name: "from", label: "From", type: "date", attrs: `min="${D.today()}"` })}
          ${field({ name: "to", label: "To", type: "date", attrs: `min="${D.today()}"` })}
          ${field({ name: "reason", label: "Reason", type: "textarea", placeholder: "e.g. Family wedding in Lahore", full: true })}
          <div class="field full"><button class="btn btn-primary btn-lg" type="submit">${icon("send")} Send request</button></div>
        </form>
      </section>
      <section class="card spot c-6 reveal">
        <div class="card-head"><div><h3>My requests</h3><p>Status updates appear instantly</p></div></div>
        <div id="myLeaves"></div>
      </section>

      <section class="card spot c-8 reveal">
        <div class="card-head"><div><h3>Recent attendance</h3><p>Your last 10 working days</p></div></div>
        <div id="recent"></div>
      </section>
      <section class="card spot c-4 reveal">
        <div class="card-head"><div><h3>Announcements</h3><p>From your admin</p></div>${icon("megaphone")}</div>
        <div id="anns"></div>
      </section>
    </div>`;

  HCM.helper.mount(document.getElementById("helper"), me);

  /* ---------------- hero: live clock + punch ---------------- */
  let ticker;
  function renderHero() {
    const company = db.company();
    const rec = A.record(me.id);
    const ev = A.evaluate(rec, company);
    const onLeave = L.onLeave(me.id, D.today());
    const working = D.isWorkingDay(D.today(), company);
    const target = 8;
    const ticks = Array.from({ length: 60 }, (_, i) => `<i style="transform:rotate(${i * 6}deg);${i % 5 ? "" : "height:11px;background:var(--faint)"}"></i>`).join("");

    let title, sub, actions;
    if (onLeave) {
      title = "You're on leave today 🌴"; sub = "Enjoy your time off — nothing to do here.";
      actions = `<span class="done-stamp">${icon("plane")} Approved leave</span>`;
    } else if (!rec) {
      title = working ? "Ready to start your day?" : "It's an off day.";
      const limit = D.toMinutes(company.startTime) + company.graceMinutes;
      const nowMin = D.minutesOf(new Date().toISOString());
      sub = working
        ? nowMin <= limit ? `Check in before <b>${D.fromMinutes(limit)}</b> to be on time.` : `Office started at ${D.time12(company.startTime)} — you'll be marked <b style="color:var(--warn)">late</b>.`
        : "You can still check in if you're working today.";
      actions = `<button class="btn btn-primary btn-lg punch pulse" id="inBtn">${icon("zap")} Check in</button>
                 <button class="btn btn-lg" id="camBtn">${icon("camera")} Camera check-in</button>`;
    } else if (!rec.checkOut) {
      title = ev.late ? "Checked in — a little late" : "You're checked in ✓";
      sub = ev.late ? `You arrived ${ev.lateBy} min after start. Work ${company.halfDayHours}h+ to avoid a half day.` : `Stay at least ${company.halfDayHours}h to avoid a half day.`;
      actions = `<button class="btn btn-dark btn-lg punch" id="outBtn">${icon("logout")} Check out</button>`;
    } else {
      title = ev.half ? "Done — counted as a half day" : "That's a wrap for today 🎉";
      sub = `You worked <b>${D.hours(ev.hours)}</b>. See you tomorrow!`;
      actions = `<span class="done-stamp">${icon("check")} Day complete</span>`;
    }

    document.getElementById("hero").innerHTML = `
      <div class="clock-ring">
        <div class="ticks">${ticks}</div>
        ${charts.ring(0, { size: 210, stroke: 12, color: ev.late ? "var(--amber)" : "var(--volt)", track: "transparent" })}
        <div class="clock-c"><div class="t" id="clock">--:--</div><div class="s" id="clockSub"></div></div>
      </div>
      <div class="day-info">
        <h2>${title}</h2><p>${sub}</p>
        <div class="day-meta">
          <div><small>Check in</small><b>${D.time(rec?.checkIn)}</b></div>
          <div><small>Check out</small><b>${D.time(rec?.checkOut)}</b></div>
          <div><small>Worked</small><b id="worked">${rec ? D.hours(A.hoursBetween(me.id, D.today(), D.today())) : "—"}</b></div>
          <div><small>Status</small><b style="font-family:var(--f-body);font-size:15px">${badge(A.dayStatus(me, D.today()).status)}</b></div>
        </div>
        <div class="day-actions">${actions}</div>
      </div>`;

    document.getElementById("inBtn")?.addEventListener("click", (e) => doCheckIn({ method: "manual" }, e));
    document.getElementById("camBtn")?.addEventListener("click", async (e) => {
      const r = await HCM.camera.open();
      if (r) doCheckIn(r, e);
    });
    document.getElementById("outBtn")?.addEventListener("click", doCheckOut);

    clearInterval(ticker);
    const ringEl = document.querySelector("#hero .ring-val");
    const C = 2 * Math.PI * ((210 - 12) / 2);
    const tick = () => {
      const now = new Date();
      document.getElementById("clock").innerHTML = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}<small>:${String(now.getSeconds()).padStart(2, "0")}</small>`;
      let p = 0, label = "";
      if (rec) {
        const h = A.hoursBetween(me.id, D.today(), D.today());
        p = h / target; label = `${Math.round(Math.min(1, p) * 100)}% of ${target}h`;
        const w = document.getElementById("worked"); if (w) w.textContent = D.hours(h);
      } else {
        const s = D.toMinutes(company.startTime), n = now.getHours() * 60 + now.getMinutes();
        p = n / (24 * 60); label = n < s ? `starts in ${D.hours((s - n) / 60)}` : "day in progress";
      }
      ringEl.style.strokeDashoffset = C * (1 - Math.min(1, p));
      document.getElementById("clockSub").textContent = label;
    };
    tick(); ticker = setInterval(tick, 1000);
  }

  function doCheckIn(extra, e) {
    const r = A.checkIn(me.id, extra);
    if (r.error) return ui.toast(r.error, "bad");
    ui.confetti(e?.clientX, e?.clientY);
    ui.toast(r.late ? `Checked in at ${D.time(r.record.checkIn)} — ${r.lateBy} min late` : `Checked in at ${D.time(r.record.checkIn)} — on time!`, r.late ? "info" : "ok");
    renderAll();
  }
  async function doCheckOut() {
    const rec = A.record(me.id);
    const h = (Date.now() - new Date(rec.checkIn)) / 36e5;
    const company = db.company();
    if (h < company.halfDayHours) {
      const ok = await ui.confirm({ title: "Check out early?", text: `You've worked ${D.hours(h)}. Checking out now under ${company.halfDayHours}h will count today as a <b>half day</b>.`, ok: "Check out anyway" });
      if (!ok) return;
    }
    const r = A.checkOut(me.id);
    if (r.error) return ui.toast(r.error, "bad");
    ui.toast(`Checked out · ${D.hours(r.hours)} worked${r.half ? " (half day)" : ""}`);
    renderAll();
  }

  /* ---------------- leave balance ---------------- */
  function renderBalance() {
    const bal = L.balance(me.id);
    const frac = bal.quota ? bal.left / bal.quota : 0;
    document.getElementById("balance").innerHTML = `
      <div class="card-head"><div><h3>Leave balance</h3><p>${new Date().getFullYear()} allowance</p></div></div>
      <div class="bal">
        <div class="bal-ring">${charts.ring(frac, { size: 116, stroke: 11, color: "var(--violet)" })}<div><b data-count="${bal.left}">0</b><small>days left</small></div></div>
        <div class="bal-list">
          <div><span>Yearly quota</span><b>${bal.quota}</b></div>
          <div><span>Used</span><b>${bal.used}</b></div>
          <div><span>Pending</span><b>${bal.pending}</b></div>
        </div>
      </div>
      <a class="btn" style="width:100%;margin-top:18px" href="#leave" id="jumpLeave">${icon("plane")} Plan time off</a>`;
    document.getElementById("jumpLeave").onclick = (e) => { e.preventDefault(); document.getElementById("leave").scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => document.querySelector("#leaveForm select").focus(), 500); };
    ui.countUp(document.getElementById("balance"));
  }

  /* ---------------- month ---------------- */
  function renderMonth() {
    const s = A.monthSummary(me, cal.year, cal.month);
    document.getElementById("calTitle").textContent = D.monthName(cal.year, cal.month);
    document.getElementById("monthStats").innerHTML = [
      ["Present", s.present, "var(--ok)"], ["Late", s.late, "var(--amber)"], ["Half day", s.half, "var(--violet)"], ["Absent", s.absent, "var(--bad)"],
    ].map(([l, v, c]) => `<div class="mini" style="--c:${c}"><small><i></i>${l}</small><b data-count="${v}">0</b></div>`).join("");
    charts.calendar(document.getElementById("calendar"), cal.year, cal.month, s.days);
    const now = new Date();
    document.getElementById("calNext").disabled = cal.year === now.getFullYear() && cal.month === now.getMonth();
    ui.countUp(document.getElementById("monthStats"));
  }
  document.getElementById("calPrev").onclick = () => { cal.month--; if (cal.month < 0) { cal.month = 11; cal.year--; } renderMonth(); };
  document.getElementById("calNext").onclick = () => { cal.month++; if (cal.month > 11) { cal.month = 0; cal.year++; } renderMonth(); };

  /* ---------------- leave form ---------------- */
  const lf = document.getElementById("leaveForm");
  const updateCount = () => {
    const v = ui.formData(lf);
    if (v.from && !v.to) lf.to.value = v.from;
    if (v.from) lf.to.min = v.from;
    const n = v.from && (v.to || v.from) >= v.from ? L.countDays(v.from, v.to || v.from) : 0;
    document.getElementById("dayCount").innerHTML = `<b>${n}</b> day${n === 1 ? "" : "s"}`;
  };
  lf.addEventListener("change", updateCount);
  lf.onsubmit = (e) => {
    e.preventDefault();
    const r = L.apply(me.id, ui.formData(lf));
    if (r.errors) return ui.showErrors(lf, r.errors);
    ui.showErrors(lf, {});
    lf.reset(); updateCount();
    ui.toast(`Request sent for ${r.leave.days} day${r.leave.days > 1 ? "s" : ""}`);
    renderAll();
  };

  function renderMyLeaves() {
    const mine = L.of(me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const el = document.getElementById("myLeaves");
    el.innerHTML = mine.length
      ? mine.slice(0, 6).map((l) => {
          const t = L.TYPES[l.type];
          return `<div class="leave-item">
            <span class="ltype" style="--c:${t.color}">${t.label[0]}</span>
            <div><b>${t.label} · ${l.days} day${l.days > 1 ? "s" : ""}</b><small>${D.short(l.from)}${l.from !== l.to ? " – " + D.short(l.to) : ""} · ${esc(l.reason)}</small>
              ${l.comment ? `<span class="cmt">💬 ${esc(l.comment)}</span>` : ""}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">${leaveBadge(l.status)}${l.status === "pending" ? `<button class="btn btn-sm btn-ghost" data-cancel="${l.id}">Cancel</button>` : ""}</div>
          </div>`;
        }).join("")
      : ui.empty("No requests yet", "When you apply for leave it will show up here with its status.", "calendar");
    el.querySelectorAll("[data-cancel]").forEach((b) => (b.onclick = async () => {
      if (!(await ui.confirm({ title: "Cancel this request?", text: "It will be removed and the days returned to your balance.", ok: "Cancel request", danger: true }))) return;
      const r = L.cancel(me.id, b.dataset.cancel);
      r.error ? ui.toast(r.error, "bad") : (ui.toast("Request cancelled"), renderAll());
    }));
  }

  function renderRecent() {
    const ctx = { company: db.company(), records: db.attendance(), leaves: db.leaves() };
    const days = [];
    for (let k = D.today(); days.length < 10 && k >= (me.joinDate || "2000-01-01"); k = D.addDays(k, -1)) {
      const r = A.dayStatus(me, k, ctx);
      if (r.status !== "off" || r.rec) days.push({ k, ...r });
      if (days.length === 0 && k < D.addDays(D.today(), -60)) break;
    }
    document.getElementById("recent").innerHTML = days.length
      ? `<div class="table-wrap" style="margin-top:-4px"><table><thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead><tbody>
        ${days.map((d) => `<tr><td class="mono">${D.nice(d.k, { weekday: "short", day: "numeric", month: "short" })}</td><td class="mono">${D.time(d.rec?.checkIn)}${d.ev?.late ? ` <small style="color:var(--warn)">+${d.ev.lateBy}m</small>` : ""}</td><td class="mono">${D.time(d.rec?.checkOut)}</td><td class="mono">${d.ev?.hours != null ? D.hours(d.ev.hours) : "—"}</td><td>${badge(d.status)}</td></tr>`).join("")}
        </tbody></table></div>`
      : ui.empty("No history yet", "Your check-ins will appear here.", "calendar");
  }

  function renderAnns() {
    const anns = db.announcements().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    document.getElementById("anns").innerHTML = anns.length
      ? anns.slice(0, 4).map((a) => `<article class="ann ${Date.now() - new Date(a.createdAt) < 3 * 864e5 ? "new" : ""}"><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p><small>${D.ago(a.createdAt)}</small></article>`).join("")
      : ui.empty("All quiet", "Company news will appear here.", "inbox");
  }

  function renderAll() { renderHero(); renderBalance(); renderMonth(); renderMyLeaves(); renderRecent(); renderAnns(); }
  renderAll();

  if (location.hash === "#leave") setTimeout(() => document.getElementById("leave").scrollIntoView({ behavior: "smooth" }), 300);
  window.addEventListener("hashchange", () => location.hash === "#leave" && document.getElementById("leave").scrollIntoView({ behavior: "smooth" }));

  // Admin approves in another tab → this page updates live.
  let t;
  HCM.store.onChange((k) => {
    if (![HCM.KEYS.leaves, HCM.KEYS.announcements, HCM.KEYS.company, HCM.KEYS.attendance].includes(k)) return;
    clearTimeout(t);
    t = setTimeout(() => {
      const prev = JSON.stringify(L.of(me.id).map((l) => l.status));
      renderAll();
      if (k === HCM.KEYS.leaves && prev) {
        const latest = L.of(me.id).filter((l) => l.decidedAt && Date.now() - new Date(l.decidedAt) < 4000)[0];
        if (latest) ui.toast(`Your ${L.TYPES[latest.type].label.toLowerCase()} leave was ${latest.status}`, latest.status === "approved" ? "ok" : "bad", 5000);
      }
    }, 60);
  });
})();
