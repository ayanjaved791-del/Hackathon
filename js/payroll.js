/* =========================================================
   HCM Lite · payroll.js
   Per day   = monthly salary ÷ working days in the month
   Deduction = per day × (absent days + 0.5 × half days)
   Net       = salary − deduction
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { db, date: D } = HCM;

  HCM.payroll = {
    slip(user, year, month) {
      const s = HCM.attendance.monthSummary(user, year, month);
      const salary = Number(user.salary) || 0;
      const perDay = s.workingDays ? salary / s.workingDays : 0;
      const deduction = perDay * (s.absent + 0.5 * s.half);
      const round = (n) => Math.round(n * 100) / 100;
      return {
        user,
        year,
        month,
        period: D.monthName(year, month),
        salary,
        workingDays: s.workingDays,
        perDay: round(perDay),
        present: s.present,
        late: s.late,
        half: s.half,
        absent: s.absent,
        leave: s.leave,
        hours: s.hours,
        deduction: round(deduction),
        net: round(Math.max(0, salary - deduction)),
        days: s.days,
        number: `PS-${year}${String(month + 1).padStart(2, "0")}-${user.id.slice(-5).toUpperCase()}`,
      };
    },

    totals(year, month) {
      return db.employees().reduce(
        (t, u) => {
          const p = HCM.payroll.slip(u, year, month);
          t.gross += p.salary; t.deduction += p.deduction; t.net += p.net;
          return t;
        },
        { gross: 0, deduction: 0, net: 0 }
      );
    },
  };
})();
