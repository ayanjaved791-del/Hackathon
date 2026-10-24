/* index.html — login + first-run setup wizard */
(function () {
  const { auth, db, ui, employees } = HCM;
  const { icon, field, formData, showErrors, esc } = ui;
  const box = document.getElementById("authBox");

  document.getElementById("artBrand").innerHTML = `${ui.LOGO}<span><b>HCM Lite</b></span>`;
  document.getElementById("artFoot").innerHTML = `
    <span>${icon("clock")}Smart attendance</span><span>${icon("plane")}Leave workflow</span>
    <span>${icon("receipt")}Payslips</span><span>${icon("sparkle")}AI helper</span>`;
  const themeBtn = document.getElementById("themeBtn");
  themeBtn.innerHTML = icon("moon", "only-light") + icon("sun", "only-dark");
  themeBtn.onclick = ui.toggleTheme;

  // Already logged in? Go straight home.
  const me = auth.current();
  if (me) return location.replace(auth.home(me));

  auth.isSetup() ? renderLogin() : renderSetup();

  /* ---------------- login ---------------- */
  function renderLogin() {
    const company = db.company();
    box.innerHTML = `
      <p class="step-label">${esc(company.name)}</p>
      <h2>Welcome back.</h2>
      <p>Sign in with the email your admin set up for you.</p>
      <form id="loginForm" novalidate>
        <label class="field"><span class="label">Email</span>
          <div class="input-icon">${icon("users")}<input name="email" type="email" autocomplete="username" placeholder="you@company.com" /></div><small class="err"></small></label>
        <label class="field"><span class="label">Password</span>
          <div class="input-icon">${icon("key")}<input name="password" type="password" autocomplete="current-password" placeholder="••••••••" /><button type="button" class="pw-toggle">Show</button></div><small class="err"></small></label>
        <button class="btn btn-primary btn-lg" type="submit">Sign in ${icon("arrowRight")}</button>
      </form>
      <div class="note" style="margin-top:18px">${icon("info")}<span>Employees: your login is created when the admin adds you. Forgot your password? Ask your admin to reset it.</span></div>`;
    wirePwToggle();
    const form = box.querySelector("#loginForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      const d = formData(form);
      const errs = {};
      if (!d.email.trim()) errs.email = "Email is required.";
      else if (!employees.EMAIL_RE.test(d.email.trim())) errs.email = "Enter a valid email.";
      if (!d.password) errs.password = "Password is required.";
      if (!showErrors(form, errs)) return;
      const r = auth.login(d.email, d.password);
      if (r.error) return showErrors(form, r.error);
      form.querySelector("button[type=submit]").innerHTML = `${icon("check")} Signed in`;
      setTimeout(() => (location.href = auth.home(r.user)), 250);
    };
  }

  /* ---------------- first-run setup ---------------- */
  function renderSetup() {
    const d = db.defaults();
    const days = [1, 2, 3, 4, 5, 6, 0];
    box.innerHTML = `
      <div class="steps"><i class="done"></i><i></i><i></i></div>
      <form id="setupForm" novalidate>
        <div class="step on" data-step="0">
          <p class="step-label">Step 1 of 3 · First-run setup</p>
          <h2>Let's set up your company.</h2>
          <p class="muted">This takes under a minute. Everything stays in this browser.</p>
          ${field({ name: "companyName", label: "Company name", placeholder: "e.g. Saylani Tech", attrs: 'autocomplete="organization"' })}
          ${field({ name: "currency", label: "Currency", value: "PKR", options: ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"].map((c) => ({ value: c, label: c })) })}
          <div class="step-actions"><button type="button" class="btn btn-primary btn-lg" data-next>Continue ${icon("arrowRight")}</button></div>
        </div>

        <div class="step" data-step="1">
          <p class="step-label">Step 2 of 3 · Work rules</p>
          <h2>How does your day run?</h2>
          <div class="form-grid">
            ${field({ name: "startTime", label: "Office start", type: "time", value: d.startTime })}
            ${field({ name: "graceMinutes", label: "Grace minutes", type: "number", value: d.graceMinutes, attrs: 'min="0" max="180"' })}
            ${field({ name: "leaveQuota", label: "Yearly leave quota", type: "number", value: d.leaveQuota, attrs: 'min="0" max="365"', hint: "Working days per employee" })}
            ${field({ name: "halfDayHours", label: "Half day under (hours)", type: "number", value: d.halfDayHours, attrs: 'min="1" max="12" step="0.5"' })}
          </div>
          <div class="field"><span class="label">Working days</span>
            <div class="days-toggle">${days.map((n) => `<label><input type="checkbox" name="wd" value="${n}" ${d.workingDays.includes(n) ? "checked" : ""}/><span>${HCM.date.dayName(n)}</span></label>`).join("")}</div>
            <small class="err" data-err="wd"></small>
          </div>
          <div class="step-actions"><button type="button" class="btn btn-lg" data-back>${icon("chevronLeft")} Back</button><button type="button" class="btn btn-primary btn-lg" data-next>Continue ${icon("arrowRight")}</button></div>
        </div>

        <div class="step" data-step="2">
          <p class="step-label">Step 3 of 3 · Admin account</p>
          <h2>Create your admin login.</h2>
          ${field({ name: "adminName", label: "Your name", placeholder: "Full name", attrs: 'autocomplete="name"' })}
          ${field({ name: "adminEmail", label: "Email", type: "email", placeholder: "admin@company.com", attrs: 'autocomplete="email"' })}
          ${field({ name: "adminPassword", label: "Password", type: "password", placeholder: "At least 6 characters", attrs: 'autocomplete="new-password"' })}
          <div class="step-actions"><button type="button" class="btn btn-lg" data-back>${icon("chevronLeft")} Back</button><button type="submit" class="btn btn-primary btn-lg">Launch ${icon("zap")}</button></div>
        </div>
      </form>`;

    const form = box.querySelector("#setupForm");
    const steps = [...form.querySelectorAll(".step")];
    const bars = [...box.querySelectorAll(".steps i")];
    let cur = 0;
    const go = (n) => {
      steps[cur].classList.remove("on"); cur = n; steps[cur].classList.add("on");
      bars.forEach((b, i) => b.classList.toggle("done", i <= cur));
      steps[cur].querySelector("input")?.focus();
    };

    const validate = (n) => {
      const v = formData(form);
      const errs = {};
      if (n === 0 && !v.companyName.trim()) errs.companyName = "Company name is required.";
      if (n === 1) {
        if (!v.startTime) errs.startTime = "Pick a start time.";
        if (v.graceMinutes === "" || +v.graceMinutes < 0) errs.graceMinutes = "0 or more.";
        if (v.leaveQuota === "" || +v.leaveQuota < 0) errs.leaveQuota = "0 or more.";
        if (!(+v.halfDayHours > 0)) errs.halfDayHours = "Must be more than 0.";
        const wdErr = form.querySelector('[data-err="wd"]');
        const wd = form.querySelectorAll('[name="wd"]:checked').length;
        wdErr.textContent = wd ? "" : "Pick at least one working day.";
        wdErr.closest(".field").classList.toggle("has-error", !wd);
        if (!wd) return false;
      }
      if (n === 2) {
        if (!v.adminName.trim()) errs.adminName = "Your name is required.";
        if (!v.adminEmail.trim()) errs.adminEmail = "Email is required.";
        else if (!employees.EMAIL_RE.test(v.adminEmail.trim())) errs.adminEmail = "Enter a valid email.";
        if (!v.adminPassword || v.adminPassword.length < 6) errs.adminPassword = "Use at least 6 characters.";
      }
      return showErrors(steps[n], errs);
    };

    form.querySelectorAll("[data-next]").forEach((b) => (b.onclick = () => validate(cur) && go(cur + 1)));
    form.querySelectorAll("[data-back]").forEach((b) => (b.onclick = () => go(cur - 1)));
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && cur < 2 && e.target.tagName === "INPUT") { e.preventDefault(); validate(cur) && go(cur + 1); }
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!validate(2)) return;
      const v = formData(form);
      auth.setup({
        company: {
          name: v.companyName.trim(),
          currency: v.currency,
          startTime: v.startTime,
          graceMinutes: Number(v.graceMinutes),
          leaveQuota: Number(v.leaveQuota),
          halfDayHours: Number(v.halfDayHours),
          workingDays: [...form.querySelectorAll('[name="wd"]:checked')].map((c) => Number(c.value)),
        },
        admin: { name: v.adminName, email: v.adminEmail, password: v.adminPassword },
      });
      ui.confetti();
      setTimeout(() => (location.href = auth.PAGES.admin), 650);
    };
  }

  function wirePwToggle() {
    box.querySelectorAll(".pw-toggle").forEach((b) => (b.onclick = () => {
      const i = b.previousElementSibling;
      i.type = i.type === "password" ? "text" : "password";
      b.textContent = i.type === "password" ? "Show" : "Hide";
    }));
  }
})();
