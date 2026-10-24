/* pages/settings.html — company rules, geofence, AI helper, data */
(function () {
  const me = HCM.auth.guard("admin");
  if (!me) return;
  const { db, ui, date: D } = HCM;
  const { icon, esc, field } = ui;

  ui.shell(me, "settings", { title: "Settings", subtitle: "Company & rules" });

  const view = document.getElementById("view");
  function render() {
    const c = db.company();
    const ai = HCM.store.read(HCM.KEYS.ai, {}) || {};
    view.innerHTML = `
      <form class="card reveal" id="setForm" novalidate>
        <div class="set-grid">
          <div><h3>Company</h3><p>Shown in the sidebar and on payslips.</p></div>
          <div class="form-grid">
            ${field({ name: "name", label: "Company name", value: c.name })}
            ${field({ name: "currency", label: "Currency", value: c.currency, options: ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"].map((v) => ({ value: v, label: v })) })}
          </div>
        </div>
        <div class="set-grid">
          <div><h3>Attendance rules</h3><p>Late = check-in after start + grace. Fewer hours than the half-day limit = half day.</p></div>
          <div>
            <div class="form-grid">
              ${field({ name: "startTime", label: "Office start time", type: "time", value: c.startTime })}
              ${field({ name: "graceMinutes", label: "Grace minutes", type: "number", value: c.graceMinutes, attrs: 'min="0" max="180"' })}
              ${field({ name: "halfDayHours", label: "Half day if under (hours)", type: "number", value: c.halfDayHours, attrs: 'min="1" max="12" step="0.5"' })}
            </div>
            <div class="rule-preview" id="rulePreview"></div>
          </div>
        </div>
        <div class="set-grid">
          <div><h3>Leave & working days</h3><p>Leave counts working days only. Payslips divide salary by working days in the month.</p></div>
          <div class="form-grid one">
            ${field({ name: "leaveQuota", label: "Yearly leave quota (days per employee)", type: "number", value: c.leaveQuota, attrs: 'min="0" max="365"' })}
            <div class="field"><span class="label">Working days</span>
              <div class="days-toggle">${[1, 2, 3, 4, 5, 6, 0].map((n) => `<label><input type="checkbox" name="wd" value="${n}" ${c.workingDays.includes(n) ? "checked" : ""}/><span>${D.dayName(n)}</span></label>`).join("")}</div>
              <small class="err" data-err="wd"></small>
            </div>
          </div>
        </div>
        <div class="set-grid">
          <div><h3>Office geofence</h3><p>Optional. Camera check-in only works inside this radius.</p></div>
          <div>
            <div class="form-grid">
              ${field({ name: "lat", label: "Latitude", type: "number", value: c.office?.lat ?? "", attrs: 'step="any"', placeholder: "24.8607" })}
              ${field({ name: "lng", label: "Longitude", type: "number", value: c.office?.lng ?? "", attrs: 'step="any"', placeholder: "67.0011" })}
              ${field({ name: "radius", label: "Radius (meters)", type: "number", value: c.office?.radius ?? 200, attrs: 'min="20" max="10000"' })}
              <div class="field" style="justify-content:flex-end"><button type="button" class="btn" id="hereBtn">${icon("pin")} Use my location</button></div>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:18px;border-top:1px solid var(--line)">
          <button type="submit" class="btn btn-primary">${icon("check")} Save settings</button>
        </div>
      </form>

      <section class="card reveal" style="margin-top:16px">
        <div class="set-grid">
          <div><h3>${icon("sparkle")} AI helper (bonus)</h3><p>Questions the keyword engine can't answer go to a free OpenAI-compatible LLM (e.g. Groq). The key is stored <b>only in this browser</b> and is never part of the code.</p></div>
          <form class="form-grid" id="aiForm" novalidate>
            ${field({ name: "endpoint", label: "Endpoint", value: ai.endpoint || "https://api.groq.com/openai/v1/chat/completions", full: true })}
            ${field({ name: "model", label: "Model", value: ai.model || "llama-3.1-8b-instant" })}
            ${field({ name: "key", label: "API key", type: "password", value: ai.key || "", placeholder: "gsk_…", attrs: 'autocomplete="off"' })}
            <div class="field full" style="flex-direction:row;gap:8px;justify-content:flex-end">
              ${ai.key ? `<button type="button" class="btn btn-ghost" id="aiClear">Remove key</button>` : ""}
              <button class="btn">${icon("check")} Save AI settings</button>
            </div>
          </form>
        </div>
      </section>

      <section class="card danger-zone reveal" style="margin-top:16px">
        <div class="set-grid">
          <div><h3>Data</h3><p>Everything lives in this browser's localStorage. Back it up or start over.</p></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn" id="exportBtn">${icon("download")} Export backup</button>
            <label class="btn">${icon("upload")} Import backup<input type="file" accept="application/json" id="importFile" hidden/></label>
            <button class="btn btn-danger" id="resetBtn">${icon("trash")} Reset everything</button>
          </div>
        </div>
      </section>`;
    wire();
    ui.reveal(view);
  }

  function wire() {
    const form = document.getElementById("setForm");
    const preview = () => {
      const v = ui.formData(form);
      const s = D.toMinutes(v.startTime || "09:00"), g = Number(v.graceMinutes || 0);
      document.getElementById("rulePreview").innerHTML = `
        <div class="on">On time<small>until ${D.fromMinutes(s)}</small></div>
        <div class="gr">Grace<small>${D.fromMinutes(s)}–${D.fromMinutes(s + g)}</small></div>
        <div class="lt">Late<small>after ${D.fromMinutes(s + g)}</small></div>`;
    };
    form.addEventListener("input", preview); preview();

    document.getElementById("hereBtn").onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = `${icon("pin")} Locating…`;
      const loc = await HCM.camera.locate();
      b.disabled = false; b.innerHTML = `${icon("pin")} Use my location`;
      if (loc.error) return ui.toast(loc.error, "bad");
      form.lat.value = loc.lat.toFixed(6); form.lng.value = loc.lng.toFixed(6);
      ui.toast(`Location set (±${loc.accuracy} m)`);
    };

    form.onsubmit = (e) => {
      e.preventDefault();
      const v = ui.formData(form);
      const errs = {};
      if (!v.name.trim()) errs.name = "Company name is required.";
      if (!v.startTime) errs.startTime = "Pick a start time.";
      if (v.graceMinutes === "" || +v.graceMinutes < 0) errs.graceMinutes = "Must be 0 or more.";
      if (!(+v.halfDayHours > 0)) errs.halfDayHours = "Must be more than 0.";
      if (v.leaveQuota === "" || +v.leaveQuota < 0) errs.leaveQuota = "Must be 0 or more.";
      const hasLat = v.lat !== "", hasLng = v.lng !== "";
      if (hasLat !== hasLng) errs[hasLat ? "lng" : "lat"] = "Enter both latitude and longitude.";
      if (hasLat && (Math.abs(+v.lat) > 90)) errs.lat = "Between -90 and 90.";
      if (hasLng && (Math.abs(+v.lng) > 180)) errs.lng = "Between -180 and 180.";
      if (hasLat && !(+v.radius >= 20)) errs.radius = "At least 20 m.";
      const wd = [...form.querySelectorAll('[name="wd"]:checked')].map((c) => +c.value);
      const wdErr = form.querySelector('[data-err="wd"]');
      wdErr.textContent = wd.length ? "" : "Pick at least one working day.";
      wdErr.closest(".field").classList.toggle("has-error", !wd.length);
      if (!ui.showErrors(form, errs) || !wd.length) return;
      db.saveCompany({
        ...db.company(),
        name: v.name.trim(), currency: v.currency, startTime: v.startTime,
        graceMinutes: +v.graceMinutes, halfDayHours: +v.halfDayHours, leaveQuota: +v.leaveQuota, workingDays: wd,
        office: hasLat ? { lat: +v.lat, lng: +v.lng, radius: +v.radius } : null,
      });
      document.querySelector(".brand small").textContent = v.name.trim();
      ui.toast("Settings saved — rules apply instantly");
    };

    const aiForm = document.getElementById("aiForm");
    aiForm.onsubmit = (e) => {
      e.preventDefault();
      const v = ui.formData(aiForm);
      if (v.key && !/^https:\/\//.test(v.endpoint)) return ui.showErrors(aiForm, { endpoint: "Use an https:// endpoint." });
      HCM.store.write(HCM.KEYS.ai, { endpoint: v.endpoint.trim(), model: v.model.trim(), key: v.key.trim() });
      ui.toast(v.key ? "AI helper enabled" : "AI settings saved");
      render();
    };
    document.getElementById("aiClear")?.addEventListener("click", () => { HCM.store.remove(HCM.KEYS.ai); ui.toast("Key removed"); render(); });

    document.getElementById("exportBtn").onclick = () => {
      const data = db.exportAll(); delete data[HCM.KEYS.ai]; delete data[HCM.KEYS.session];
      ui.download(`hcm-lite-backup-${D.today()}.json`, JSON.stringify(data, null, 2), "application/json");
    };
    document.getElementById("importFile").onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data[HCM.KEYS.company] || !Array.isArray(data[HCM.KEYS.users])) throw new Error("Not an HCM Lite backup");
        if (!(await ui.confirm({ title: "Import backup?", text: "This replaces the current company data with the file's data.", ok: "Import" }))) return;
        db.importAll({ ...data, [HCM.KEYS.session]: db.session() });
        if (!HCM.auth.current()) return HCM.auth.logout();
        ui.toast("Backup imported"); render();
      } catch (err) { ui.toast(err.message || "Invalid file", "bad"); }
    };
    document.getElementById("resetBtn").onclick = async () => {
      const ok = await ui.confirm({ title: "Reset everything?", text: "All employees, attendance, leave and settings will be deleted from this browser. You will go back to first-run setup.", ok: "Yes, delete all", danger: true });
      if (!ok) return;
      db.resetAll();
      location.href = HCM.auth.PAGES.login;
    };
  }

  render();
})();
