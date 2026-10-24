/* =========================================================
   HCM Lite · helper.js — the Smart helper
   1. Keyword intents answer from real localStorage data.
   2. Optional: unknown questions go to an LLM (OpenAI-compatible
      endpoint) with a short data summary. The key is entered in
      Settings and stays in this browser only — never committed.
   Employees only ever see their own data.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { db, date: D, attendance: A, leave: L, ui } = HCM;

  const has = (t, ...words) => words.some((w) => t.includes(w));
  const all = (t, ...words) => words.every((w) => t.includes(w));
  const list = (names) => names.length <= 1 ? names.join("") : names.slice(0, -1).join(", ") + " and " + names.at(-1);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const b = (s) => `<b>${ui.esc(String(s))}</b>`;

  /* ---------------- admin intents ---------------- */
  function adminAnswer(t) {
    const today = D.today();
    const emps = db.employees();
    const snap = () => A.companyDay(today);

    // look up a specific person by name
    const person = emps.find((e) => e.name.toLowerCase().split(" ").some((part) => part.length > 2 && new RegExp(`\\b${part}\\b`).test(t)));
    if (person && !has(t, "how many employees")) {
      const st = A.dayStatus(person, today);
      const bal = L.balance(person.id);
      const rec = st.rec;
      return `${b(person.name)} (${ui.esc(person.designation)}, ${ui.esc(person.department)}) is ${b(A.STATUS[st.status].label.toLowerCase())} today` +
        (rec?.checkIn ? ` — checked in at ${b(D.time(rec.checkIn))}${st.ev?.late ? ` (${D.late(st.ev.lateBy)} after start)` : ""}${rec.checkOut ? `, out at ${b(D.time(rec.checkOut))}` : ""}` : "") +
        `. Leave left this year: ${b(bal.left)} of ${bal.quota}.`;
    }

    if (has(t, "how many employee", "headcount", "head count", "number of employee", "total employee", "staff", "team size", "how many people"))
      return emps.length ? `You have ${b(plural(emps.length, "employee"))} across ${b(plural(db.departments().length, "department"))}.` : "You have no employees yet — add your first one on the Employees page.";

    if (has(t, "department", "dept")) {
      const by = db.departments().map((d) => `${d}: ${emps.filter((e) => e.department === d).length}`);
      return by.length ? `Headcount by department — ${b(by.join(" · "))}.` : "No departments yet.";
    }

    if (has(t, "leave", "off today", "vacation") && !has(t, "pending", "request")) {
      const on = L.onLeaveOn(today);
      if (!on.length) return "Nobody is on approved leave today. 🎉";
      const types = Object.entries(on.reduce((m, x) => ((m[x.leave.type] = (m[x.leave.type] || 0) + 1), m), {})).map(([k, v]) => `${v} ${L.TYPES[k].label.toLowerCase()}`);
      return `${b(plural(on.length, "employee"))} on leave today (${types.join(", ")}): ${list(on.map((x) => x.user.name))}.`;
    }

    if (has(t, "late")) {
      if (has(t, "month", "most", "often", "frequent")) {
        const now = new Date();
        const rows = emps.map((e) => ({ e, n: A.monthSummary(e, now.getFullYear(), now.getMonth()).late })).filter((r) => r.n).sort((a, c) => c.n - a.n);
        return rows.length ? `Late arrivals this month: ${rows.slice(0, 5).map((r) => `${ui.esc(r.e.name)} (${r.n})`).join(", ")}.` : "No late arrivals this month.";
      }
      const late = snap().rows.filter((r) => r.ev?.late);
      return late.length ? `${b(plural(late.length, "person"))} late today: ${late.map((r) => `${ui.esc(r.user.name)} (+${D.late(r.ev.lateBy)})`).join(", ")}.` : "No one was late today. ⏱️";
    }

    if (has(t, "absent", "missing", "not checked", "hasn't", "haven't", "not in", "not come", "not here")) {
      const s = snap();
      const nobody = s.rows.filter((r) => r.status === "notyet" || r.status === "absent");
      return nobody.length ? `${b(plural(nobody.length, "employee"))} not checked in yet: ${list(nobody.map((r) => r.user.name))}.` : "Everyone expected today has checked in or is on leave. ✅";
    }

    if (has(t, "present", "in office", "checked in", "who is in", "who's in", "attendance")) {
      const s = snap();
      return `Today: ${b(s.present)} present, ${b(s.late)} late, ${b(s.leave)} on leave, ${b(s.notyet + s.absent)} not in yet (of ${s.total}).`;
    }

    if (has(t, "pending", "request", "approve", "waiting")) {
      const p = db.leaves().filter((l) => l.status === "pending");
      return p.length ? `${b(plural(p.length, "leave request"))} waiting: ${p.slice(0, 5).map((l) => `${ui.esc(db.user(l.userId)?.name)} (${l.days}d ${L.TYPES[l.type].label.toLowerCase()})`).join(", ")}.` : "No pending leave requests. Inbox zero!";
    }

    if (has(t, "payroll", "salary", "salaries", "cost", "pay")) {
      const now = new Date();
      const tot = HCM.payroll.totals(now.getFullYear(), now.getMonth());
      return `Payroll for ${D.monthName(now.getFullYear(), now.getMonth())} so far: gross ${b(HCM.money(tot.gross))}, deductions ${b(HCM.money(tot.deduction))}, net ${b(HCM.money(tot.net))}.`;
    }

    return common(t);
  }

  /* ---------------- employee intents (own data only) ---------------- */
  function employeeAnswer(t, me) {
    const today = D.today();
    const company = db.company();

    const other = db.employees().find((e) => e.id !== me.id && e.name.toLowerCase().split(" ").some((p) => p.length > 2 && new RegExp(`\\b${p}\\b`).test(t)));
    if (other || has(t, "who is", "who was", "who's", "everyone", "colleague", "how many employees", "others", "team"))
      return "I can only share <b>your own</b> records. For team questions, please ask your admin. 🔒";

    if (has(t, "leave", "holiday", "vacation", "day off", "days off")) {
      const bal = L.balance(me.id);
      if (has(t, "status", "pending", "approved", "rejected", "my request", "last")) {
        const mine = L.of(me.id).sort((a, c) => c.createdAt.localeCompare(a.createdAt));
        if (!mine.length) return "You haven't applied for any leave yet.";
        const l = mine[0];
        return `Your latest request (${L.TYPES[l.type].label}, ${D.short(l.from)} – ${D.short(l.to)}, ${l.days}d) is ${b(l.status)}${l.comment ? ` — “${ui.esc(l.comment)}”` : ""}.`;
      }
      return `You have ${b(plural(bal.left, "leave day"))} left this year (quota ${bal.quota}, used ${bal.used}${bal.pending ? `, ${bal.pending} pending approval` : ""}).`;
    }

    if (has(t, "late")) {
      if (has(t, "month", "how many times", "how often")) {
        const now = new Date();
        const s = A.monthSummary(me, now.getFullYear(), now.getMonth());
        return `You were late ${b(plural(s.late, "time"))} this month.`;
      }
      const rec = A.record(me.id, today);
      if (!rec) return "You haven't checked in today yet.";
      const ev = A.evaluate(rec, company);
      return ev.late ? `Yes — you checked in at ${b(D.time(rec.checkIn))}, ${b(D.late(ev.lateBy))} after the ${D.time12(company.startTime)} start.` : `No, you were on time today — in at ${b(D.time(rec.checkIn))}. 👏`;
    }

    if (has(t, "hour", "worked", "work time")) {
      if (has(t, "month")) {
        const now = new Date();
        const from = D.key(new Date(now.getFullYear(), now.getMonth(), 1));
        return `You've worked ${b(D.hours(A.hoursBetween(me.id, from, today)))} this month.`;
      }
      if (has(t, "today")) return `Today you've worked ${b(D.hours(A.hoursBetween(me.id, today, today)))}.`;
      const ws = D.weekStart(today);
      const h = A.hoursBetween(me.id, ws, today);
      const days = A.records(me.id).filter((r) => r.date >= ws && r.date <= today).length;
      return `This week (since ${D.short(ws)}) you've worked ${b(D.hours(h))} over ${plural(days, "day")}.`;
    }

    if (has(t, "check", "clock", "punch", "today")) {
      const rec = A.record(me.id, today);
      if (!rec) return `You haven't checked in today. Office starts at ${b(D.time12(company.startTime))} (+${company.graceMinutes} min grace).`;
      return rec.checkOut ? `You checked in at ${b(D.time(rec.checkIn))} and out at ${b(D.time(rec.checkOut))}.` : `You checked in at ${b(D.time(rec.checkIn))} and are still working.`;
    }

    if (has(t, "absent", "attendance", "present", "half")) {
      const now = new Date();
      const s = A.monthSummary(me, now.getFullYear(), now.getMonth());
      return `This month: ${b(s.present)} present, ${b(s.late)} late, ${b(s.half)} half days, ${b(s.absent)} absent, ${b(s.leave)} on leave.`;
    }

    if (has(t, "salary", "pay", "slip", "deduction", "earn")) {
      const now = new Date();
      const p = HCM.payroll.slip(me, now.getFullYear(), now.getMonth());
      return `For ${p.period} so far: salary ${b(HCM.money(p.salary))}, deduction ${b(HCM.money(p.deduction))}, net ${b(HCM.money(p.net))}. Open the Payslip page for the full slip.`;
    }

    if (has(t, "start", "office time", "timing", "grace", "rule"))
      return `Office starts at ${b(D.time12(company.startTime))} with ${b(company.graceMinutes + " min")} grace. Under ${company.halfDayHours} hours counts as a half day.`;

    return common(t);
  }

  function common(t) {
    if (has(t, "announcement", "news", "notice", "update")) {
      const a = db.announcements().sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0];
      return a ? `Latest announcement: ${b(a.title)} — ${ui.esc(a.body)}` : "No announcements yet.";
    }
    if (/^(hi|hello|hey|salam|assalam|aoa)\b/.test(t)) return "Hi! 👋 Ask me about attendance, leave or pay — try one of the suggestions below.";
    if (has(t, "thank")) return "Anytime! 🙌";
    return null;
  }

  /* ---------------- LLM (bonus) ---------------- */
  function summary(user) {
    const today = D.today();
    const c = db.company();
    if (user.role === "admin") {
      const s = A.companyDay(today);
      return {
        company: c.name, today, rules: { start: c.startTime, grace: c.graceMinutes, halfDayHours: c.halfDayHours, leaveQuota: c.leaveQuota },
        employees: s.rows.map((r) => ({ name: r.user.name, dept: r.user.department, title: r.user.designation, today: r.status, in: r.rec?.checkIn && D.time(r.rec.checkIn), leaveLeft: L.balance(r.user.id).left })),
        pendingLeaves: db.leaves().filter((l) => l.status === "pending").map((l) => ({ who: db.user(l.userId)?.name, from: l.from, to: l.to, days: l.days, type: l.type })),
      };
    }
    const now = new Date();
    const m = A.monthSummary(user, now.getFullYear(), now.getMonth());
    return {
      me: { name: user.name, dept: user.department, title: user.designation }, today,
      rules: { start: c.startTime, grace: c.graceMinutes, halfDayHours: c.halfDayHours },
      thisMonth: { present: m.present, late: m.late, half: m.half, absent: m.absent, leave: m.leave, hours: Math.round(m.hours * 10) / 10 },
      leave: L.balance(user.id),
      recentAttendance: A.records(user.id).slice(-10).map((r) => ({ date: r.date, in: D.time(r.checkIn), out: r.checkOut ? D.time(r.checkOut) : null })),
      myLeaves: L.of(user.id).map((l) => ({ from: l.from, to: l.to, days: l.days, status: l.status, type: l.type })),
    };
  }

  async function askLLM(question, user) {
    const cfg = HCM.store.read(HCM.KEYS.ai, null);
    if (!cfg?.key) return null;
    const res = await fetch(cfg.endpoint || "https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        model: cfg.model || "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: `You are the HR helper inside HCM Lite. Answer in 1-3 short sentences using ONLY this JSON data. If the data does not contain the answer, say so. ${user.role === "employee" ? "The user is an employee: never reveal other people's data." : "The user is the admin."}\nDATA: ${JSON.stringify(summary(user))}` },
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) throw new Error("AI request failed (" + res.status + ")");
    const json = await res.json();
    return ui.esc(json.choices?.[0]?.message?.content?.trim() || "");
  }

  /* ---------------- widget ---------------- */
  const SUGGEST = {
    admin: ["How many employees do we have?", "Who is on leave today?", "Who was late today?", "Pending requests", "Who hasn't checked in?", "Payroll this month"],
    employee: ["How many leaves do I have left?", "Was I late today?", "How many hours did I work this week?", "My attendance this month", "Status of my leave", "My salary this month"],
  };

  function mount(el, user) {
    const aiOn = !!HCM.store.read(HCM.KEYS.ai, null)?.key;
    el.classList.add("helper");
    el.innerHTML = `
      <div class="helper-head">
        <span class="helper-orb"><i></i></span>
        <div><b>Smart helper</b><small>${aiOn ? "Keyword engine + AI" : "Answers from live app data"}</small></div>
        <span class="badge tone-${aiOn ? "violet" : "ok"}"><i></i>${aiOn ? "AI on" : "Live"}</span>
      </div>
      <div class="helper-log" aria-live="polite"></div>
      <div class="helper-chips">${SUGGEST[user.role].map((s) => `<button class="chip" type="button">${s}</button>`).join("")}</div>
      <form class="helper-form"><input placeholder="Ask about ${user.role === "admin" ? "your team" : "your attendance, leave or pay"}…" aria-label="Ask the helper"/><button class="icon-btn solid" aria-label="Send">${ui.icon("send")}</button></form>`;
    const log = el.querySelector(".helper-log");
    const input = el.querySelector("input");

    const push = (who, html) => {
      const m = document.createElement("div");
      m.className = `msg msg-${who}`;
      m.innerHTML = html;
      log.appendChild(m);
      log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
      return m;
    };
    push("bot", `${D.greeting()}, ${ui.esc(user.name.split(" ")[0])}! I read your HCM data live. Ask me anything below.`);

    async function ask(q) {
      q = q.trim(); if (!q) return;
      push("me", ui.esc(q));
      const typing = push("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
      const t = q.toLowerCase();
      let ans = user.role === "admin" ? adminAnswer(t) : employeeAnswer(t, user);
      await new Promise((r) => setTimeout(r, 380 + Math.random() * 300));
      if (!ans) {
        try { ans = await askLLM(q, user); } catch (e) { ans = `⚠️ ${ui.esc(e.message)}`; }
      }
      typing.innerHTML = ans || `I'm not sure yet. Try: <em>${SUGGEST[user.role].slice(0, 3).join(" · ")}</em>`;
      log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    }

    el.querySelector("form").onsubmit = (e) => { e.preventDefault(); const q = input.value; input.value = ""; ask(q); };
    el.querySelectorAll(".chip").forEach((c) => (c.onclick = () => ask(c.textContent)));
  }

  HCM.helper = { mount, adminAnswer, employeeAnswer, summary };
})();
