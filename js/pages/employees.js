/* pages/employees.html — add (creates login), edit, delete, search, filter */
(function () {
  const me = HCM.auth.guard("admin");
  if (!me) return;
  const { db, ui, date: D, attendance: A, leave: L, employees: E } = HCM;
  const { icon, esc, avatar, badge, field } = ui;

  ui.shell(me, "employees", {
    title: "Employees",
    subtitle: "People directory",
    actions: `<button class="btn btn-primary" id="addBtn">${icon("plus")}<span class="lbl">Add employee</span></button>`,
  });

  const params = new URLSearchParams(location.search);
  const state = { q: params.get("q") || "", dept: "", view: localStorageGet("hcm_emp_view") || "grid" };

  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="toolbar reveal">
      <div class="input-icon grow">${icon("search")}<input id="q" type="search" placeholder="Search name, email, title…" value="${esc(state.q)}" aria-label="Search employees"/></div>
      <div class="seg" id="viewSeg"><button data-v="grid" aria-label="Grid view">${icon("grid")}</button><button data-v="table" aria-label="Table view">${icon("list")}</button></div>
    </div>
    <div class="chips-row reveal" id="depts" style="margin-bottom:16px"></div>
    <div id="list"></div>`;

  const qEl = document.getElementById("q");
  qEl.oninput = () => { state.q = qEl.value; renderList(); };
  document.getElementById("addBtn").onclick = () => openForm();
  document.querySelectorAll("#viewSeg button").forEach((b) => (b.onclick = () => { state.view = b.dataset.v; localStorageSet("hcm_emp_view", state.view); renderList(); }));

  function renderDepts() {
    const depts = db.departments();
    const counts = Object.fromEntries(depts.map((d) => [d, db.employees().filter((e) => e.department === d).length]));
    document.getElementById("depts").innerHTML =
      `<button class="chip ${!state.dept ? "on" : ""}" data-d="">All · ${db.employees().length}</button>` +
      depts.map((d) => `<button class="chip ${state.dept === d ? "on" : ""}" data-d="${esc(d)}">${esc(d)} · ${counts[d]}</button>`).join("");
    document.querySelectorAll("#depts .chip").forEach((c) => (c.onclick = () => { state.dept = c.dataset.d; renderDepts(); renderList(); }));
  }

  function renderList() {
    document.querySelectorAll("#viewSeg button").forEach((b) => b.classList.toggle("on", b.dataset.v === state.view));
    const list = E.search(state.q, state.dept).sort((a, b) => a.name.localeCompare(b.name));
    const el = document.getElementById("list");
    if (!db.employees().length) {
      el.innerHTML = `<div class="card">${ui.empty("No employees yet", "Add your first team member — it creates their login automatically.", "people")}<div style="text-align:center;padding-bottom:12px"><button class="btn btn-primary" id="emptyAdd">${icon("plus")} Add employee</button></div></div>`;
      document.getElementById("emptyAdd").onclick = () => openForm();
      return;
    }
    if (!list.length) { el.innerHTML = `<div class="card">${ui.empty("No matches", "Try a different name or department.", "people")}</div>`; return; }

    const today = D.today();
    const ctx = { records: db.attendance(), leaves: db.leaves(), company: db.company() };
    const rows = list.map((e) => ({ e, st: A.dayStatus(e, today, ctx).status, bal: L.balance(e.id) }));

    el.innerHTML = state.view === "grid"
      ? `<div class="emp-grid">${rows.map(({ e, st, bal }, i) => `
          <article class="card spot emp-card tilt reveal" style="--d:${i * 40}ms" data-id="${e.id}">
            <div class="emp-top">${avatar(e, "lg")}<div><b>${esc(e.name)}</b><small>${esc(e.designation)}</small></div></div>
            <div class="emp-facts">
              <div><small>Department</small><b>${esc(e.department)}</b></div>
              <div><small>Salary</small><b class="mono">${HCM.money(e.salary)}</b></div>
              <div><small>Email</small><b>${esc(e.email)}</b></div>
              <div><small>Leave left</small><b class="mono">${bal.left} / ${bal.quota}</b></div>
            </div>
            <div class="emp-actions">${badge(st)}
              <button class="icon-btn sm" data-edit aria-label="Edit ${esc(e.name)}">${icon("edit")}</button>
              <button class="icon-btn sm" data-del aria-label="Delete ${esc(e.name)}">${icon("trash")}</button>
            </div>
          </article>`).join("")}</div>`
      : `<div class="card reveal"><div class="table-wrap" style="margin-top:-20px;border-top:0"><table>
          <thead><tr><th>Employee</th><th>Department</th><th>Joined</th><th>Salary</th><th>Leave left</th><th>Today</th><th></th></tr></thead>
          <tbody>${rows.map(({ e, st, bal }) => `<tr data-id="${e.id}">
            <td><div class="person">${avatar(e, "sm")}<div><b>${esc(e.name)}</b><small>${esc(e.email)}</small></div></div></td>
            <td>${esc(e.department)}<br><small class="muted">${esc(e.designation)}</small></td>
            <td class="mono">${D.nice(e.joinDate)}</td>
            <td class="mono">${HCM.money(e.salary)}</td>
            <td class="mono">${bal.left} / ${bal.quota}</td>
            <td>${badge(st)}</td>
            <td style="text-align:right"><button class="icon-btn sm" data-edit aria-label="Edit">${icon("edit")}</button> <button class="icon-btn sm" data-del aria-label="Delete">${icon("trash")}</button></td>
          </tr>`).join("")}</tbody></table></div></div>`;

    el.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => openForm(db.user(b.closest("[data-id]").dataset.id))));
    el.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => removeEmp(db.user(b.closest("[data-id]").dataset.id), b.closest("[data-id]"))));
    ui.reveal(el);
  }

  function openForm(emp) {
    const editing = !!emp;
    const depts = db.departments();
    const e = emp || { joinDate: D.today() };
    const pw = editing ? "" : suggestPassword();
    ui.drawer({
      title: editing ? `Edit ${emp.name}` : "Add employee",
      body: `
        <div class="emp-preview" id="empPreview"></div>
        <p class="muted" style="margin-bottom:16px;font-size:13.5px">${editing ? "Update details. Leave the password empty to keep it." : "This also creates the employee's login with the email and password below."}</p>
        <form class="form-grid" id="empForm" novalidate>
          <p class="form-section">Identity</p>
          ${field({ name: "name", label: "Full name", value: e.name, placeholder: "Sara Khan", full: true, attrs: 'autocomplete="off"' })}
          ${field({ name: "email", label: "Work email", type: "email", value: e.email, placeholder: "sara@company.com", attrs: 'autocomplete="off"' })}
          ${field({ name: "phone", label: "Phone (optional)", type: "tel", value: e.phone, placeholder: "+92 300 0000000" })}
          <p class="form-section">Role & pay</p>
          ${field({ name: "department", label: "Department", value: e.department, placeholder: "Engineering", attrs: 'list="deptList" autocomplete="off"' })}
          ${field({ name: "designation", label: "Job title", value: e.designation, placeholder: "Frontend Developer" })}
          ${field({ name: "salary", label: `Monthly salary (${db.company().currency})`, type: "number", value: e.salary, placeholder: "80000", attrs: 'min="1" step="1" inputmode="numeric"' })}
          ${field({ name: "joinDate", label: "Joining date", type: "date", value: e.joinDate })}
          <p class="form-section">Login</p>
          ${field({ name: "password", label: editing ? "New password (optional)" : "First password", type: "text", value: pw, full: true, hint: editing ? "Fill only to reset their password." : "Share this with the employee. They can change it after logging in.", attrs: 'autocomplete="new-password"' })}
          <button type="submit" hidden></button>
        </form>
        <datalist id="deptList">${["Engineering", "Design", "Sales", "Marketing", "Finance", "HR", "Operations", "Support", ...depts].filter((v, i, a) => a.indexOf(v) === i).map((d) => `<option value="${esc(d)}">`).join("")}</datalist>`,
      actions: [
        { label: "Cancel" },
        { label: editing ? `${icon("check")} Save changes` : `${icon("plus")} Add & create login`, cls: "btn-primary", onClick(close, el) {
          const form = el.querySelector("#empForm");
          const d = ui.formData(form);
          const r = editing ? E.update(emp.id, d) : E.add(d);
          if (r.errors) return ui.showErrors(form, r.errors);
          close(); renderDepts(); renderList();
          if (editing) return ui.toast(`${r.user.name} updated`);
          ui.confetti();
          showCredentials(r.user, d.password);
        } },
      ],
    });
    // live preview card + Enter submits + inline validation once a field was touched
    setTimeout(() => {
      const form = document.getElementById("empForm");
      if (!form) return;
      const pv = document.getElementById("empPreview");
      const paint = () => {
        const d = ui.formData(form);
        const wd = HCM.date.monthKeys(new Date().getFullYear(), new Date().getMonth()).filter((k) => HCM.date.isWorkingDay(k, db.company())).length;
        pv.innerHTML = `${avatar({ name: d.name || "New Person", email: d.email || d.name }, "lg")}
          <div><b>${esc(d.name || "New employee")}</b><small>${esc([d.designation, d.department].filter(Boolean).join(" · ") || "Job title · Department")}</small></div>
          <div class="pv-sal"><b>${d.salary > 0 ? HCM.money(d.salary) : "—"}</b><small>${d.salary > 0 ? HCM.money(Math.round(d.salary / wd)) + " / day" : "per month"}</small></div>`;
      };
      paint();
      form.addEventListener("input", paint);
      form.addEventListener("submit", (ev) => { ev.preventDefault(); form.closest(".drawer").querySelector(".drawer-foot .btn-primary").click(); });
      form?.addEventListener("focusout", (ev) => {
        const name = ev.target.name; if (!name) return;
        const errs = E.validate(ui.formData(form), emp?.id);
        const fieldEl = ev.target.closest(".field");
        fieldEl.classList.toggle("has-error", !!errs[name]);
        fieldEl.querySelector(".err").textContent = errs[name] || "";
      });
    }, 50);
  }

  function showCredentials(user, password) {
    const loginUrl = new URL("../index.html", location.href).href;
    ui.modal({
      title: "Employee added",
      body: `<div class="success-burst">${icon("check")}</div>
        <p style="text-align:center"><b>${esc(user.name)}</b> can now sign in.</p>
        <div class="cred"><div><span>Login</span><b>${esc(loginUrl.replace(/^https?:\/\//, ""))}</b></div><div><span>Email</span><b>${esc(user.email)}</b></div><div><span>Password</span><b>${esc(password)}</b></div></div>`,
      actions: [
        { label: `${icon("copy")} Copy details`, onClick() {
          navigator.clipboard?.writeText(`HCM Lite login\n${loginUrl}\nEmail: ${user.email}\nPassword: ${password}`).then(() => ui.toast("Copied to clipboard"), () => ui.toast("Copy not allowed", "bad"));
        } },
        { label: "Done", cls: "btn-primary" },
      ],
    });
  }

  async function removeEmp(emp, card) {
    const ok = await ui.confirm({ title: `Delete ${emp.name}?`, text: "This removes their login, attendance and leave history. This cannot be undone.", ok: "Delete", danger: true });
    if (!ok) return;
    card?.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.94)" }], { duration: 250 }).finished.then(() => {
      E.remove(emp.id); renderDepts(); renderList(); ui.toast(`${emp.name} removed`);
    });
  }

  function suggestPassword() {
    const words = ["mango", "river", "falcon", "cedar", "orbit", "pixel", "lotus", "ember", "comet", "maple"];
    return words[Math.floor(Math.random() * words.length)] + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  function localStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  renderDepts();
  renderList();
  if (location.hash === "#new") { history.replaceState(null, "", location.pathname); openForm(); }
  HCM.store.onChange((k) => { if ([HCM.KEYS.attendance, HCM.KEYS.leaves].includes(k) && !document.querySelector(".overlay")) renderList(); });
})();
