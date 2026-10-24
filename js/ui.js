/* =========================================================
   HCM Lite · ui.js
   App shell (sidebar, top bar, mobile dock), icons, toasts,
   modals, drawers, command palette, theme, micro-animations.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});

  /* ---------------- icons (24px stroke) ---------------- */
  const P = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    receipt: '<path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5 13.9 12.4 12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    command: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    face: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  };
  const icon = (name, cls = "") =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ""}</svg>`;

  const LOGO = `<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="var(--volt)"/><path d="M12 28V12M28 28V12M12 20h9" stroke="#0b0d10" stroke-width="3.4" stroke-linecap="round"/><circle cx="27.5" cy="20" r="2.6" fill="#0b0d10"/></svg>`;

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const initials = (name = "?") => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function hue(str = "") { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
  const avatar = (user, size = "") =>
    `<span class="avatar ${size}" style="--h:${hue(user?.email || user?.name || "")}">${esc(initials(user?.name))}</span>`;
  const badge = (status) => {
    const s = HCM.attendance?.STATUS[status] || { label: status, tone: "muted" };
    return `<span class="badge tone-${s.tone}"><i></i>${esc(s.label)}</span>`;
  };
  const leaveBadge = (st) => `<span class="badge tone-${{ pending: "warn", approved: "ok", rejected: "bad" }[st]}"><i></i>${st[0].toUpperCase() + st.slice(1)}</span>`;

  /* ---------------- theme ---------------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("hcm_theme", t); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    if (document.startViewTransition) document.startViewTransition(() => setTheme(next));
    else setTheme(next);
  }

  /* ---------------- toasts ---------------- */
  function toast(msg, type = "ok", ms = 3200) {
    let host = $("#toasts");
    if (!host) { host = document.createElement("div"); host.id = "toasts"; host.setAttribute("role", "status"); document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icon(type === "ok" ? "check" : type === "bad" ? "alert" : "info")}<span>${esc(msg)}</span><b class="toast-bar" style="animation-duration:${ms}ms"></b>`;
    host.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 350); }, ms);
  }

  /* ---------------- modal / drawer ---------------- */
  function modal({ title, body, actions = [], wide = false, kind = "modal", onOpen } = {}) {
    const wrap = document.createElement("div");
    wrap.className = `overlay overlay-${kind}`;
    wrap.innerHTML = `
      <div class="${kind} ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header class="${kind}-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${icon("x")}</button></header>
        <div class="${kind}-body">${body}</div>
        ${actions.length ? `<footer class="${kind}-foot">${actions.map((a, i) => `<button class="btn ${a.cls || "btn-ghost"}" data-act="${i}">${a.label}</button>`).join("")}</footer>` : ""}
      </div>`;
    const close = () => { wrap.classList.add("closing"); setTimeout(() => wrap.remove(), 260); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => e.key === "Escape" && close();
    wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) close(); });
    wrap.querySelector("[data-close]").onclick = close;
    actions.forEach((a, i) => (wrap.querySelector(`[data-act="${i}"]`).onclick = () => (a.onClick ? a.onClick(close, wrap) : close())));
    document.addEventListener("keydown", onKey);
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    const first = wrap.querySelector("input,select,textarea");
    if (first) setTimeout(() => first.focus(), 120);
    onOpen && onOpen(wrap, close);
    return { el: wrap, close };
  }
  const drawer = (opts) => modal({ ...opts, kind: "drawer" });

  function confirm({ title, text, ok = "Confirm", danger = false }) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title,
        body: `<p class="muted">${text}</p>`,
        actions: [
          { label: "Cancel", onClick: (c) => { done = true; resolve(false); c(); } },
          { label: ok, cls: danger ? "btn-danger" : "btn-primary", onClick: (c) => { done = true; resolve(true); c(); } },
        ],
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } });
      obs.observe(document.body, { childList: true });
    });
  }

  /* ---------------- forms ---------------- */
  function formData(form) {
    const out = {};
    new FormData(form).forEach((v, k) => (out[k] = typeof v === "string" ? v : v));
    return out;
  }
  function showErrors(form, errors = {}) {
    $$(".field", form).forEach((f) => {
      f.classList.remove("has-error");
      const e = f.querySelector(".err"); if (e) e.textContent = "";
    });
    let first = null;
    Object.entries(errors).forEach(([name, msg]) => {
      const input = form.querySelector(`[name="${name}"]`);
      const field = input?.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      let e = field.querySelector(".err");
      if (!e) { e = document.createElement("small"); e.className = "err"; field.appendChild(e); }
      e.textContent = msg;
      first = first || input;
    });
    if (first) { first.focus(); first.closest(".field").animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 260 }); }
    return !Object.keys(errors).length;
  }
  const field = ({ name, label, type = "text", value = "", placeholder = "", attrs = "", hint = "", options, full }) => `
    <label class="field ${full ? "full" : ""}">
      <span class="label">${label}</span>
      ${options
        ? `<select name="${name}" ${attrs}>${options.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`
        : type === "textarea"
        ? `<textarea name="${name}" placeholder="${esc(placeholder)}" ${attrs}>${esc(value)}</textarea>`
        : `<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs}/>`}
      ${hint ? `<small class="hint">${hint}</small>` : ""}
      <small class="err"></small>
    </label>`;

  /* ---------------- motion ---------------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countUp(root = document) {
    $$("[data-count]", root).forEach((el) => {
      const end = Number(el.dataset.count) || 0;
      const dec = Number(el.dataset.dec || 0);
      const fmt = (v) => (el.dataset.money ? HCM.money(v) : v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }));
      if (reduce || end === 0) { el.textContent = fmt(end); return; }
      const t0 = performance.now(), dur = 900;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(end * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function reveal(root = document) {
    const items = $$(".reveal:not(.in)", root);
    if (reduce || !("IntersectionObserver" in window)) return items.forEach((i) => i.classList.add("in"));
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    items.forEach((el, i) => { el.style.setProperty("--d", `${Math.min(i, 10) * 55}ms`); io.observe(el); });
  }
  /* cursor spotlight on cards */
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".spot");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
  /* ripple on buttons */
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest?.(".btn");
    if (!b || reduce) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.left = `${e.clientX - r.left}px`; s.style.top = `${e.clientY - r.top}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 600);
  });

  /* magnetic primary buttons + 3D tilt cards (mouse only) */
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduce) {
    document.addEventListener("pointermove", (e) => {
      const m = e.target.closest?.(".btn-primary, .icon-btn.solid");
      if (m) {
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
        m.onpointerleave = () => (m.style.transform = "");
      }
      const t = e.target.closest?.(".tilt");
      if (t && !t.closest(".overlay")) {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
        t.onpointerleave = () => (t.style.transform = "");
      }
    }, { passive: true });
  }

  function confetti(x = innerWidth / 2, y = innerHeight / 2) {
    if (reduce) return;
    const colors = ["#c8f43c", "#7c6cff", "#ff6b4a", "#2bb3e6", "#f5a524"];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("i");
      p.className = "confetti";
      p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
      p.animate(
        [{ transform: "translate(0,0) rotate(0)", opacity: 1 },
         { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 180}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.2,.7,.3,1)" }
      ).onfinish = () => p.remove();
    }
  }

  function empty(title, text, art = "inbox") {
    const arts = {
      inbox: `<svg viewBox="0 0 120 90"><rect x="18" y="22" width="84" height="54" rx="12" class="e1"/><path d="M18 54h24l6 10h24l6-10h24" class="e2"/><circle cx="92" cy="20" r="8" class="e3"/></svg>`,
      people: `<svg viewBox="0 0 120 90"><circle cx="46" cy="36" r="14" class="e1"/><circle cx="80" cy="40" r="11" class="e3"/><path d="M20 80c4-16 16-24 26-24s22 8 26 24" class="e2"/><path d="M66 80c3-11 9-17 16-17s13 6 16 17" class="e2"/></svg>`,
      calendar: `<svg viewBox="0 0 120 90"><rect x="24" y="16" width="72" height="62" rx="12" class="e1"/><path d="M24 34h72" class="e2"/><circle cx="48" cy="54" r="5" class="e3"/><circle cx="72" cy="54" r="5" class="e2b"/></svg>`,
    };
    return `<div class="empty"><div class="empty-art">${arts[art] || arts.inbox}</div><h4>${title}</h4><p>${text}</p></div>`;
  }

  /* ---------------- shell ---------------- */
  const NAV = {
    admin: [
      { id: "admin", label: "Dashboard", short: "Home", icon: "grid", href: "admin.html" },
      { id: "employees", label: "Employees", short: "People", icon: "users", href: "employees.html" },
      { id: "attendance", label: "Attendance", icon: "clock", href: "attendance.html" },
      { id: "leaves", label: "Leave requests", short: "Leave", icon: "plane", href: "leaves.html", badge: () => HCM.db.leaves().filter((l) => l.status === "pending").length },
      { id: "payslip", label: "Payslips", icon: "receipt", href: "payslip.html" },
      { id: "settings", label: "Settings", icon: "settings", href: "settings.html" },
    ],
    employee: [
      { id: "employee", label: "My day", short: "Today", icon: "zap", href: "employee.html" },
      { id: "myleaves", label: "My leave", short: "Leave", icon: "plane", href: "employee.html#leave" },
      { id: "payslip", label: "Payslip", icon: "receipt", href: "payslip.html" },
    ],
  };

  function shell(user, active, { title, subtitle, actions = "" } = {}) {
    const company = HCM.db.company();
    const nav = NAV[user.role];
    const main = $("#main");
    const navHTML = nav.map((n) => {
      const b = n.badge ? n.badge() : 0;
      return `<a href="${n.href}" class="nav-item ${n.id === active ? "active" : ""}" data-nav="${n.id}" data-label="${n.label}">${icon(n.icon)}<span>${n.label}</span>${b ? `<em class="nav-badge">${b}</em>` : ""}</a>`;
    }).join("");

    const side = document.createElement("aside");
    side.className = "sidebar";
    side.innerHTML = `
      <a class="brand" href="${nav[0].href}">${LOGO}<span><b>HCM Lite</b><small>${esc(company?.name || "")}</small></span></a>
      <button class="search-trigger" data-cmdk data-label="Search · ⌘K" aria-label="Search">${icon("search")}<span>Search or jump…</span><kbd>⌘K</kbd></button>
      <nav class="nav">${navHTML}</nav>
      <div class="side-foot">
        <button class="nav-item" data-theme-toggle data-label="Theme">${icon("moon", "only-light")}${icon("sun", "only-dark")}<span>Theme</span></button>
        <button class="user-chip" data-user-menu>
          ${avatar(user)}
          <span class="uc-text"><b>${esc(user.name)}</b><small>${user.role === "admin" ? "Administrator" : esc(user.designation || "Employee")}</small></span>
          ${icon("chevronDown")}
        </button>
      </div>`;

    const dock = document.createElement("nav");
    dock.className = "dock";
    dock.innerHTML = nav.slice(0, 5).map((n) => `<a href="${n.href}" class="${n.id === active ? "active" : ""}">${icon(n.icon)}<span>${n.short || n.label}</span></a>`).join("") +
      `<button data-more>${icon("menu")}<span>More</span></button>`;

    const top = document.createElement("header");
    top.className = "topbar";
    top.innerHTML = `
      <div class="tb-left">
        <a class="brand brand-mobile" href="${nav[0].href}">${LOGO}</a>
        <div><p class="eyebrow">${esc(subtitle || D_long())}<span class="tb-clock mono" aria-hidden="true"></span></p><h1 class="page-title">${accent(title || "")}</h1></div>
      </div>
      <div class="tb-right">${actions}
        <button class="icon-btn hide-desk" data-cmdk aria-label="Search">${icon("search")}</button>
        <button class="icon-btn hide-desk" data-theme-toggle aria-label="Toggle theme">${icon("moon", "only-light")}${icon("sun", "only-dark")}</button>
      </div>`;

    document.body.classList.add("has-shell");
    document.body.prepend(side);
    main.prepend(top);
    document.body.appendChild(dock);

    $$("[data-theme-toggle]").forEach((b) => (b.onclick = toggleTheme));

    // A link to the page you're already on scrolls to the top instead of reloading.
    document.addEventListener("click", (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const to = new URL(a.href, location.href);
      if (to.pathname === location.pathname && to.search === location.search && !to.hash) {
        e.preventDefault();
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        syncActive();
      }
    });
    const syncActive = () => {
      const here = location.pathname.split("/").pop() + location.hash;
      const match = nav.find((n) => n.href === here) || nav.find((n) => n.href === location.pathname.split("/").pop());
      if (!match) return;
      $$("[data-nav]").forEach((el) => el.classList.toggle("active", el.dataset.nav === match.id));
      $$(".dock a").forEach((el) => el.classList.toggle("active", el.getAttribute("href") === match.href));
    };
    addEventListener("hashchange", syncActive);
    $$("[data-cmdk]").forEach((b) => (b.onclick = () => palette(user)));
    $("[data-user-menu]").onclick = () => userMenu(user);
    $("[data-more]", dock).onclick = () => userMenu(user, true);
    dock.addEventListener("pointerdown", () => navigator.vibrate?.(8));

    /* keep nav badges fresh when data changes in another tab */
    HCM.store.onChange((k) => {
      if (k !== HCM.KEYS.leaves) return;
      nav.forEach((n) => {
        if (!n.badge) return;
        const a = side.querySelector(`[data-nav="${n.id}"]`);
        a.querySelector(".nav-badge")?.remove();
        const b = n.badge();
        if (b) a.insertAdjacentHTML("beforeend", `<em class="nav-badge">${b}</em>`);
      });
    });
    /* session ended elsewhere → leave */
    HCM.store.onChange((k) => { if (k === HCM.KEYS.session && !HCM.auth.leaving && !HCM.auth.current()) location.replace(HCM.auth.PAGES.login); });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(user); }
    });
    ambience();
    splash(user);
    requestAnimationFrame(() => { reveal(); countUp(); });
  }
  const D_long = () => HCM.date.long();

  /** Puts the last word (or the name after a comma) in serif italic. */
  function accent(title) {
    const i = title.lastIndexOf(", ");
    if (i > -1) return `${title.slice(0, i + 2)}<span class="serif">${title.slice(i + 2)}</span>`;
    const j = title.lastIndexOf(" ");
    return j > -1 ? `${title.slice(0, j + 1)}<span class="serif">${title.slice(j + 1)}</span>` : `<span class="serif">${title}</span>`;
  }

  /* ---------------- luxe: ambient light, scroll glass, progress ---------------- */
  function ambience() {
    const amb = document.createElement("div");
    amb.className = "ambient"; amb.setAttribute("aria-hidden", "true");
    amb.innerHTML = "<i></i><i></i><i></i>";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    document.body.append(amb, bar);
    const top = $(".topbar");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      top?.classList.toggle("scrolled", scrollY > 12);
    };
    const up = document.createElement("button");
    up.className = "to-top"; up.setAttribute("aria-label", "Back to top"); up.innerHTML = icon("chevronRight");
    up.onclick = () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.body.appendChild(up);
    const clock = $(".tb-clock");
    const tick = () => clock && (clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick(); setInterval(tick, 15000);
    addEventListener("scroll", () => up.classList.toggle("show", scrollY > 700), { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    enhance();
    let queued = false;
    new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; enhance(); }); } })
      .observe($("#main"), { childList: true, subtree: true });
    addEventListener("resize", () => requestAnimationFrame(enhance));
  }

  /* Runs after every render: gliding segment indicators + labels for phone-stacked tables. */
  function enhance() {
    $$(".seg").forEach((seg) => {
      const on = seg.querySelector("button.on");
      let ind = seg.querySelector(".seg-ind");
      if (!on) { ind?.remove(); seg.classList.remove("glide"); return; }
      if (!ind) { ind = document.createElement("span"); ind.className = "seg-ind"; seg.prepend(ind); }
      seg.classList.add("glide");
      ind.style.width = on.offsetWidth + "px";
      ind.style.transform = `translateX(${on.offsetLeft}px)`;
    });
    $$(".table-wrap.stack table").forEach((t) => {
      const heads = $$("thead th", t).map((th) => th.textContent.trim());
      $$("tbody tr", t).forEach((tr) => [...tr.children].forEach((td, i) => { if (!td.hasAttribute("data-label")) td.setAttribute("data-label", heads[i] || ""); }));
    });
  }

  /* Expanding rings from a point — used for check-in success. */
  function burst(x = innerWidth / 2, y = innerHeight / 2) {
    if (reduce) return;
    ["", "b2"].forEach((c) => {
      const r = document.createElement("i");
      r.className = `burst ${c}`; r.style.left = x + "px"; r.style.top = y + "px";
      document.body.appendChild(r); setTimeout(() => r.remove(), 1200);
    });
  }

  /* welcome splash, shown once right after signing in */
  function splash(user) {
    let flag = null;
    try { flag = sessionStorage.getItem("hcm_splash"); sessionStorage.removeItem("hcm_splash"); } catch (e) {}
    if (!flag || reduce) return;
    const el = document.createElement("div");
    el.className = "splash";
    el.innerHTML = `<div class="aurora"><i></i><i></i><i></i></div><div class="splash-in">${LOGO}
      <h2>${esc(HCM.date.greeting())}, <span class="serif">${esc(user.name.split(" ")[0])}</span></h2>
      <p>${esc(HCM.db.company()?.name || "")} · ${esc(HCM.date.long())}</p><div class="splash-bar"><i></i></div></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  function userMenu(user, mobile = false) {
    const nav = NAV[user.role];
    modal({
      title: user.name,
      body: `
        <div class="menu-profile">${avatar(user, "lg")}<div><b>${esc(user.email)}</b><small class="muted">${esc(user.department || "")} · ${user.role}</small></div></div>
        <div class="menu-list">
          ${mobile ? nav.map((n) => `<a class="menu-item" href="${n.href}">${icon(n.icon)}${n.label}</a>`).join("") : ""}
          <button class="menu-item" data-m="pw">${icon("key")}Change password</button>
          <button class="menu-item" data-m="theme">${icon("moon")}Toggle dark mode</button>
          <button class="menu-item danger" data-m="out">${icon("logout")}Log out</button>
        </div>`,
      onOpen(el, close) {
        el.querySelector('[data-m="pw"]').onclick = () => { close(); changePassword(user); };
        el.querySelector('[data-m="theme"]').onclick = () => { toggleTheme(); };
        el.querySelector('[data-m="out"]').onclick = () => HCM.auth.logout();
      },
    });
  }

  function changePassword(user) {
    modal({
      title: "Change password",
      body: `<form class="form-grid one" id="pwForm" novalidate>
        ${field({ name: "current", label: "Current password", type: "password", attrs: 'autocomplete="current-password"' })}
        ${field({ name: "next", label: "New password", type: "password", attrs: 'autocomplete="new-password"', hint: "At least 6 characters." })}
        ${field({ name: "confirm", label: "Repeat new password", type: "password", attrs: 'autocomplete="new-password"' })}
      </form>`,
      actions: [
        { label: "Cancel" },
        { label: "Update password", cls: "btn-primary", onClick(close, el) {
          const f = el.querySelector("#pwForm"); const d = formData(f);
          if (d.next !== d.confirm) return showErrors(f, { confirm: "Passwords do not match." });
          const r = HCM.auth.changePassword(user.id, d.current, d.next);
          if (r.errors) return showErrors(f, r.errors);
          toast("Password updated"); close();
        } },
      ],
    });
  }

  /* ---------------- command palette ---------------- */
  function palette(user) {
    if ($(".overlay-palette")) return;
    const root = HCM.auth.ROOT + "pages/";
    const items = [
      ...NAV[user.role].map((n) => ({ label: n.label, hint: "Go to", icon: n.icon, run: () => (location.href = root + n.href) })),
      { label: "Toggle dark mode", hint: "Action", icon: "moon", run: toggleTheme },
      { label: "Change password", hint: "Action", icon: "key", run: () => changePassword(user) },
      { label: "Log out", hint: "Action", icon: "logout", run: () => HCM.auth.logout() },
    ];
    if (user.role === "admin") {
      items.splice(1, 0, { label: "Add employee", hint: "Action", icon: "plus", run: () => (location.href = root + "employees.html#new") });
      HCM.db.employees().forEach((e) => items.push({ label: e.name, hint: e.department, icon: "users", person: e, run: () => (location.href = root + "employees.html?q=" + encodeURIComponent(e.name)) }));
    } else {
      items.splice(1, 0, { label: "Apply for leave", hint: "Action", icon: "plane", run: () => (location.href = root + "employee.html#leave") });
    }

    const wrap = document.createElement("div");
    wrap.className = "overlay overlay-palette";
    wrap.innerHTML = `<div class="palette" role="dialog" aria-label="Command palette">
      <div class="pal-input">${icon("search")}<input placeholder="Type a command or a name…" aria-label="Search"/><kbd>esc</kbd></div>
      <div class="pal-list" role="listbox"></div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("open"));
    const input = $("input", wrap), list = $(".pal-list", wrap);
    let sel = 0, shown = items;
    const close = () => { wrap.classList.add("closing"); setTimeout(() => wrap.remove(), 200); };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      shown = items.filter((i) => !q || (i.label + " " + i.hint).toLowerCase().includes(q)).slice(0, 9);
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      list.innerHTML = shown.length
        ? shown.map((i, n) => `<button class="pal-item ${n === sel ? "sel" : ""}" data-i="${n}">${i.person ? avatar(i.person, "sm") : icon(i.icon)}<span>${esc(i.label)}</span><small>${esc(i.hint || "")}</small></button>`).join("")
        : `<p class="pal-empty">Nothing matches “${esc(input.value)}”.</p>`;
    };
    const run = (i) => { close(); shown[i]?.run(); };
    input.oninput = () => { sel = 0; render(); };
    input.onkeydown = (e) => {
      if (e.key === "ArrowDown") { sel = (sel + 1) % shown.length; render(); e.preventDefault(); }
      if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % shown.length; render(); e.preventDefault(); }
      if (e.key === "Enter") run(sel);
      if (e.key === "Escape") close();
    };
    list.onclick = (e) => { const b = e.target.closest(".pal-item"); if (b) run(Number(b.dataset.i)); };
    wrap.onmousedown = (e) => e.target === wrap && close();
    render(); input.focus();
  }

  function download(name, text, type = "text/csv") {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  HCM.ui = { burst, icon, LOGO, esc, $, $$, avatar, badge, leaveBadge, initials, hue, toast, modal, drawer, confirm, formData, showErrors, field, countUp, reveal, confetti, empty, shell, toggleTheme, setTheme, download, changePassword };
})();
