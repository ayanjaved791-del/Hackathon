/* =========================================================
   HCM Lite · leave.js
   Apply, validate, approve / reject, balances.
   Rules: from ≤ to · working days only · no overlap ·
          never above the Admin's yearly quota.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { db, date: D } = HCM;

  const TYPES = {
    casual: { label: "Casual", color: "var(--violet)" },
    sick: { label: "Sick", color: "var(--coral)" },
    annual: { label: "Annual", color: "var(--sky)" },
    other: { label: "Other", color: "var(--amber)" },
  };

  const leave = {
    TYPES,

    of(userId) { return db.leaves().filter((l) => l.userId === userId); },

    countDays(from, to, company = db.company()) { return D.workingDays(from, to, company).length; },

    /** used / pending / left for the given year (default: this year) */
    balance(userId, year = new Date().getFullYear()) {
      const company = db.company();
      const quota = Number(company.leaveQuota || 0);
      const mine = leave.of(userId).filter((l) => l.from.startsWith(String(year)));
      const used = mine.filter((l) => l.status === "approved").reduce((s, l) => s + l.days, 0);
      const pending = mine.filter((l) => l.status === "pending").reduce((s, l) => s + l.days, 0);
      return { quota, used, pending, left: Math.max(0, quota - used) };
    },

    onLeave(userId, key, list) {
      return (list || db.leaves()).some((l) => l.userId === userId && l.status === "approved" && key >= l.from && key <= l.to);
    },

    /** Validates an application. Returns { errors, days }. */
    validate(userId, { type, from, to, reason }, ignoreId) {
      const errors = {};
      const company = db.company();
      if (!type || !TYPES[type]) errors.type = "Choose a leave type.";
      if (!from) errors.from = "Pick a start date.";
      if (!to) errors.to = "Pick an end date.";
      if (from && to && from > to) errors.to = "End date must be on or after the start date.";
      if (!reason || reason.trim().length < 3) errors.reason = "Tell your manager briefly why.";

      let days = 0;
      if (from && to && from <= to) {
        days = leave.countDays(from, to, company);
        if (days === 0) errors.to = "These dates are all non-working days.";
        const clash = leave.of(userId).find(
          (l) => l.id !== ignoreId && l.status !== "rejected" && from <= l.to && to >= l.from
        );
        if (clash) errors.from = `Overlaps your ${clash.status} leave (${D.short(clash.from)} – ${D.short(clash.to)}).`;
        const bal = leave.balance(userId, Number(from.slice(0, 4)));
        const available = bal.quota - bal.used - bal.pending;
        if (days > available) {
          errors.to = `Needs ${days} day${days > 1 ? "s" : ""} but only ${Math.max(0, available)} left` +
            (bal.pending ? ` (${bal.pending} pending).` : ".");
        }
      }
      return { errors, days };
    },

    apply(userId, form) {
      const { errors, days } = leave.validate(userId, form);
      if (Object.keys(errors).length) return { errors };
      const item = {
        id: HCM.uid(),
        userId,
        type: form.type,
        from: form.from,
        to: form.to,
        days,
        reason: form.reason.trim(),
        status: "pending",
        comment: "",
        createdAt: new Date().toISOString(),
      };
      db.saveLeaves([...db.leaves(), item]);
      return { leave: item };
    },

    cancel(userId, id) {
      const l = db.leaves().find((x) => x.id === id);
      if (!l || l.userId !== userId || l.status !== "pending") return { error: "Only pending requests can be cancelled." };
      db.saveLeaves(db.leaves().filter((x) => x.id !== id));
      return { ok: true };
    },

    decide(id, status, comment, adminId) {
      const list = db.leaves();
      const l = list.find((x) => x.id === id);
      if (!l) return { error: "Request not found." };
      if (status === "approved") {
        const bal = leave.balance(l.userId, Number(l.from.slice(0, 4)));
        if (l.status !== "approved" && bal.used + l.days > bal.quota)
          return { error: `Approving would exceed the yearly quota (${bal.left} left).` };
      }
      Object.assign(l, { status, comment: (comment || "").trim(), decidedAt: new Date().toISOString(), decidedBy: adminId });
      db.saveLeaves(list);
      return { leave: l };
    },

    onLeaveOn(key = D.today()) {
      return db.leaves()
        .filter((l) => l.status === "approved" && key >= l.from && key <= l.to)
        .map((l) => ({ leave: l, user: db.user(l.userId) }))
        .filter((x) => x.user);
    },
  };

  HCM.leave = leave;
})();
