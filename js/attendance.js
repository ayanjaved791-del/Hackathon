/* =========================================================
   HCM Lite · attendance.js
   Check in / out and the Admin's attendance rules:
   - Late  : check-in after office start + grace minutes
   - Half  : worked less than `halfDayHours` (default 5)
   - Absent: no record on a past working day (and not on leave)
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { db, date: D } = HCM;

  const STATUS = {
    present: { label: "Present", tone: "ok" },
    late: { label: "Late", tone: "warn" },
    half: { label: "Half day", tone: "violet" },
    working: { label: "Working", tone: "sky" },
    leave: { label: "On leave", tone: "sky" },
    absent: { label: "Absent", tone: "bad" },
    off: { label: "Off day", tone: "muted" },
    future: { label: "—", tone: "muted" },
    notyet: { label: "Not checked in", tone: "muted" },
    prejoin: { label: "—", tone: "muted" },
  };

  const att = {
    STATUS,

    records(userId) {
      const all = db.attendance();
      return userId ? all.filter((r) => r.userId === userId) : all;
    },

    record(userId, key = D.today()) {
      return db.attendance().find((r) => r.userId === userId && r.date === key) || null;
    },

    /** Evaluates late / half-day for a record using the current company rules. */
    evaluate(rec, company = db.company()) {
      const out = { late: false, lateBy: 0, half: false, hours: null, open: false };
      if (!rec || !rec.checkIn) return out;
      const limit = D.toMinutes(company.startTime) + Number(company.graceMinutes || 0);
      const inMin = D.minutesOf(rec.checkIn);
      out.late = inMin > limit;
      out.lateBy = Math.max(0, Math.round(inMin - D.toMinutes(company.startTime)));
      if (rec.checkOut) {
        out.hours = (new Date(rec.checkOut) - new Date(rec.checkIn)) / 36e5;
        out.half = out.hours < Number(company.halfDayHours || 5);
      } else {
        out.open = true;
        // A past day that was never checked out counts as a half day.
        if (rec.date < D.today()) out.half = true;
      }
      return out;
    },

    checkIn(userId, extra = {}) {
      const company = db.company();
      const today = D.today();
      if (att.record(userId, today)) return { error: "You have already checked in today." };
      if (HCM.leave.onLeave(userId, today)) return { error: "You are on approved leave today." };

      const now = new Date();
      const rec = {
        id: HCM.uid(),
        userId,
        date: today,
        checkIn: now.toISOString(),
        checkOut: null,
        method: extra.method || "manual",
        location: extra.location || null,
        faceVerified: !!extra.faceVerified,
        offDay: !D.isWorkingDay(today, company),
      };
      const ev = att.evaluate(rec, company);
      rec.status = ev.late ? "late" : "present";
      rec.lateBy = ev.lateBy;
      db.saveAttendance([...db.attendance(), rec]);
      return { record: rec, late: ev.late, lateBy: ev.lateBy };
    },

    checkOut(userId) {
      const company = db.company();
      const rec = att.record(userId);
      if (!rec) return { error: "Check in first — you can only check out after checking in." };
      if (rec.checkOut) return { error: "You have already checked out today." };
      rec.checkOut = new Date().toISOString();
      const ev = att.evaluate(rec, company);
      rec.hours = Math.round(ev.hours * 100) / 100;
      rec.status = ev.half ? "half" : ev.late ? "late" : "present";
      db.saveAttendance(db.attendance().map((r) => (r.id === rec.id ? rec : r)));
      return { record: rec, half: ev.half, hours: ev.hours };
    },

    /** The status of one employee on one day. */
    dayStatus(user, key, ctx = {}) {
      const company = ctx.company || db.company();
      const today = D.today();
      const rec = ctx.records ? ctx.records.find((r) => r.userId === user.id && r.date === key) : att.record(user.id, key);
      if (user.joinDate && key < user.joinDate) return { status: "prejoin", rec: null };
      if (rec) {
        const ev = att.evaluate(rec, company);
        if (ev.open && key === today) return { status: ev.late ? "late" : "working", rec, ev };
        if (ev.half) return { status: "half", rec, ev };
        return { status: ev.late ? "late" : "present", rec, ev };
      }
      if (HCM.leave.onLeave(user.id, key, ctx.leaves)) return { status: "leave", rec: null };
      if (key > today) return { status: "future", rec: null };
      if (!D.isWorkingDay(key, company)) return { status: "off", rec: null };
      if (key === today) return { status: "notyet", rec: null };
      return { status: "absent", rec: null };
    },

    /** Month counters for one employee. */
    monthSummary(user, year, month) {
      const company = db.company();
      const ctx = { company, records: db.attendance(), leaves: db.leaves() };
      const s = { present: 0, late: 0, half: 0, absent: 0, leave: 0, off: 0, hours: 0, workingDays: 0, days: [] };
      D.monthKeys(year, month).forEach((key) => {
        const r = att.dayStatus(user, key, ctx);
        if (D.isWorkingDay(key, company)) s.workingDays++;
        s.days.push({ key, ...r });
        if (["present", "late", "working"].includes(r.status)) s.present++;
        if (r.ev?.late) s.late++;
        if (r.status === "half") s.half++;
        if (r.status === "absent") s.absent++;
        if (r.status === "leave") s.leave++;
        if (r.ev?.hours) s.hours += r.ev.hours;
      });
      return s;
    },

    hoursBetween(userId, fromKey, toKey) {
      return att.records(userId)
        .filter((r) => r.date >= fromKey && r.date <= toKey)
        .reduce((sum, r) => {
          if (r.checkOut) return sum + (new Date(r.checkOut) - new Date(r.checkIn)) / 36e5;
          if (r.date === D.today()) return sum + (Date.now() - new Date(r.checkIn)) / 36e5;
          return sum;
        }, 0);
    },

    /** Snapshot of the whole company for one day (admin dashboard). */
    companyDay(key = D.today()) {
      const company = db.company();
      const ctx = { company, records: db.attendance(), leaves: db.leaves() };
      const rows = db.employees().map((u) => ({ user: u, ...att.dayStatus(u, key, ctx) }));
      const count = (...st) => rows.filter((r) => st.includes(r.status)).length;
      return {
        rows,
        total: rows.length,
        present: count("present", "late", "working", "half"),
        late: rows.filter((r) => r.ev?.late).length,
        half: count("half"),
        leave: count("leave"),
        absent: count("absent"),
        notyet: count("notyet"),
      };
    },

    toCSV(rows) {
      const head = ["Date", "Employee", "Email", "Department", "Check in", "Check out", "Hours", "Status", "Late by (min)", "Method"];
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = rows.map((r) => [
        r.date, r.user.name, r.user.email, r.user.department,
        r.rec?.checkIn ? D.time(r.rec.checkIn) : "", r.rec?.checkOut ? D.time(r.rec.checkOut) : "",
        r.ev?.hours != null ? r.ev.hours.toFixed(2) : "", STATUS[r.status]?.label || r.status,
        r.ev?.late ? r.ev.lateBy : "", r.rec?.method || "",
      ].map(esc).join(","));
      return [head.map(esc).join(","), ...lines].join("\n");
    },
  };

  HCM.attendance = att;
})();
