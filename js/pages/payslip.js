/* pages/payslip.html — monthly salary slip, print / save as PDF */
(function () {
  const me = HCM.auth.guard("any");
  if (!me) return;
  const { db, ui, date: D, payroll } = HCM;
  const { icon, esc, avatar } = ui;
  const isAdmin = me.role === "admin";

  ui.shell(me, "payslip", {
    title: isAdmin ? "Payslips" : "My payslip",
    subtitle: "Payroll",
    actions: `<button class="btn btn-dark" id="printBtn">${icon("printer")}<span class="lbl">Print / PDF</span></button>`,
  });

  const params = new URLSearchParams(location.search);
  const emps = db.employees().sort((a, b) => a.name.localeCompare(b.name));
  const state = { month: params.get("month") || D.monthValue(), emp: isAdmin ? params.get("emp") || emps[0]?.id || "" : me.id };

  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="toolbar no-print reveal">
      ${isAdmin ? `<select id="emp" style="width:auto;min-width:220px" aria-label="Employee">${emps.map((e) => `<option value="${e.id}" ${e.id === state.emp ? "selected" : ""}>${esc(e.name)} — ${esc(e.department)}</option>`).join("")}</select>` : ""}
      <input type="month" id="month" value="${state.month}" max="${D.monthValue()}" style="width:auto" aria-label="Month"/>
      <span class="grow"></span>
      ${isAdmin ? `<span class="muted" id="totals" style="font-size:13px"></span>` : ""}
    </div>
    <div id="slip"></div>`;

  document.getElementById("printBtn").onclick = () => window.print();
  document.getElementById("month").onchange = (e) => { state.month = e.target.value || D.monthValue(); render(); };
  document.getElementById("emp")?.addEventListener("change", (e) => { state.emp = e.target.value; render(); });

  function render() {
    const el = document.getElementById("slip");
    const user = db.user(state.emp);
    if (!user || user.role !== "employee") {
      el.innerHTML = `<div class="card">${ui.empty("No employees yet", "Add employees to generate payslips.", "people")}</div>`;
      return;
    }
    const { year, month } = D.parseMonth(state.month);
    const p = payroll.slip(user, year, month);
    const company = db.company();
    const isCurrent = state.month === D.monthValue();

    if (isAdmin) {
      const t = payroll.totals(year, month);
      document.getElementById("totals").innerHTML = `Company net for ${p.period}: <b class="mono">${HCM.money(t.net)}</b>`;
    }

    el.innerHTML = `
      <article class="card slip reveal">
        <header class="slip-head">
          <div>
            <a class="brand">${ui.LOGO}<span><b style="color:inherit">${esc(company.name)}</b><small style="color:inherit;opacity:.6">Salary slip</small></span></a>
          </div>
          <div style="text-align:right;position:relative;z-index:1">
            <h2>${p.period}</h2>
            <p class="mono">${p.number}</p>
          </div>
        </header>
        <div class="slip-body">
          <div class="slip-who">
            <div><small>Employee</small><b>${esc(user.name)}</b></div>
            <div><small>Designation</small><b>${esc(user.designation)}</b></div>
            <div><small>Department</small><b>${esc(user.department)}</b></div>
            <div><small>Email</small><b>${esc(user.email)}</b></div>
          </div>
          <div class="slip-cols">
            <div>
              <h4>Attendance</h4>
              <div class="slip-row"><span>Working days in month</span><b>${p.workingDays}</b></div>
              <div class="slip-row"><span>Days present</span><b>${p.present}</b></div>
              <div class="slip-row"><span>Late arrivals</span><b>${p.late}</b></div>
              <div class="slip-row"><span>Paid leave</span><b>${p.leave}</b></div>
              <div class="slip-row"><span>Half days</span><b>${p.half}</b></div>
              <div class="slip-row"><span>Absent days</span><b>${p.absent}</b></div>
              <div class="slip-strip" title="Daily attendance">${p.days.map((d) => `<i class="st-${d.status}" title="${D.nice(d.key)}"></i>`).join("")}</div>
            </div>
            <div>
              <h4>Earnings & deductions</h4>
              <div class="slip-row"><span>Monthly salary</span><b>${HCM.money(p.salary)}</b></div>
              <div class="slip-row"><span>Per day rate</span><b>${HCM.money(p.perDay)}</b></div>
              <div class="slip-row neg"><span>Absent (${p.absent} × per day)</span><b>− ${HCM.money(p.perDay * p.absent)}</b></div>
              <div class="slip-row neg"><span>Half days (${p.half} × 0.5 × per day)</span><b>− ${HCM.money(p.perDay * p.half * 0.5)}</b></div>
              <div class="slip-row neg"><span>Total deduction</span><b>− ${HCM.money(p.deduction)}</b></div>
            </div>
          </div>
          <div class="slip-net">
            <div><small>Net pay</small><b data-count="${p.net}" data-money="1">${HCM.money(p.net)}</b></div>
            <div style="text-align:right">${avatar(user, "lg")}</div>
          </div>
          <p class="slip-formula">Per day = ${HCM.money(p.salary)} ÷ ${p.workingDays} working days = ${HCM.money(p.perDay)}<br>
            Deduction = ${HCM.money(p.perDay)} × (${p.absent} absent + 0.5 × ${p.half} half) = ${HCM.money(p.deduction)}<br>
            Net = ${HCM.money(p.salary)} − ${HCM.money(p.deduction)} = <b>${HCM.money(p.net)}</b></p>
          ${isCurrent ? `<p class="note no-print" style="margin-top:14px">${icon("info")}<span>This month is still running — days after today aren't counted as absent yet.</span></p>` : ""}
        </div>
        <footer class="slip-foot"><span>Generated ${D.long()}</span><span>System-generated by HCM Lite · no signature required</span></footer>
      </article>`;
    ui.reveal(el);
    ui.countUp(el);
  }

  render();
  HCM.store.onChange((k) => [HCM.KEYS.attendance, HCM.KEYS.leaves, HCM.KEYS.company, HCM.KEYS.users].includes(k) && render());
})();
