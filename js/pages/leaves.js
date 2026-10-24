/* pages/leaves.html — approve / reject with a comment */
(function () {
  const me = HCM.auth.guard("admin");
  if (!me) return;
  const { db, ui, date: D, leave: L } = HCM;
  const { icon, esc, avatar, leaveBadge } = ui;

  ui.shell(me, "leaves", { title: "Leave requests", subtitle: "Approvals" });

  const state = { tab: "pending", q: "" };
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="toolbar reveal">
      <div class="seg" id="tabs"></div>
      <div class="input-icon grow">${icon("search")}<input id="q" type="search" placeholder="Search by employee…" aria-label="Search"/></div>
    </div>
    <div id="list"></div>`;
  document.getElementById("q").oninput = (e) => { state.q = e.target.value.toLowerCase(); render(); };

  function render() {
    const all = db.leaves();
    const tabs = ["pending", "approved", "rejected", "all"];
    document.getElementById("tabs").innerHTML = tabs.map((t) => {
      const n = t === "all" ? all.length : all.filter((l) => l.status === t).length;
      return `<button data-t="${t}" class="${state.tab === t ? "on" : ""}">${t[0].toUpperCase() + t.slice(1)} <em>${n}</em></button>`;
    }).join("");
    document.querySelectorAll("#tabs button").forEach((b) => (b.onclick = () => { state.tab = b.dataset.t; render(); }));

    const items = all
      .filter((l) => state.tab === "all" || l.status === state.tab)
      .map((l) => ({ l, u: db.user(l.userId) }))
      .filter(({ u }) => u && (!state.q || u.name.toLowerCase().includes(state.q) || u.department.toLowerCase().includes(state.q)))
      .sort((a, b) => (state.tab === "pending" ? a.l.from.localeCompare(b.l.from) : b.l.createdAt.localeCompare(a.l.createdAt)));

    const el = document.getElementById("list");
    if (!items.length) {
      el.innerHTML = `<div class="card">${ui.empty(state.tab === "pending" ? "Inbox zero" : "Nothing here", state.tab === "pending" ? "No one is waiting on a decision. Enjoy the calm." : "No requests match.", "calendar")}</div>`;
      return;
    }
    el.innerHTML = items.map(({ l, u }, i) => {
      const bal = L.balance(u.id, +l.from.slice(0, 4));
      const t = L.TYPES[l.type];
      return `<article class="card spot req reveal" style="--d:${i * 40}ms" data-id="${l.id}">
        ${avatar(u, "lg")}
        <div class="req-main">
          <div class="req-line"><b>${esc(u.name)}</b><span class="muted">· ${esc(u.department)}</span>${leaveBadge(l.status)}<span class="badge" style="--c:${t.color}"><i></i>${t.label}</span></div>
          <div class="req-dates">${icon("calendar")}${D.nice(l.from, { weekday: "short", day: "numeric", month: "short" })} → ${D.nice(l.to, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}<span class="days-pill"><b>${l.days}</b> working day${l.days > 1 ? "s" : ""}</span></div>
          <p class="req-reason">“${esc(l.reason)}”</p>
          ${l.comment ? `<p class="req-reason">${icon("info")} <b>Admin:</b> ${esc(l.comment)}</p>` : ""}
          <small class="muted">Requested ${D.ago(l.createdAt)} · Balance ${bal.left} of ${bal.quota} left${l.status === "pending" && l.days > bal.left ? ` · <b style="color:var(--bad)">exceeds balance</b>` : ""}</small>
        </div>
        <div class="req-acts">${l.status === "pending"
          ? `<button class="btn" data-a="rejected">${icon("x")} Reject</button><button class="btn btn-primary" data-a="approved">${icon("check")} Approve</button>`
          : `<button class="btn btn-sm btn-ghost" data-a="${l.status === "approved" ? "rejected" : "approved"}">${l.status === "approved" ? "Revoke" : "Approve instead"}</button>`}</div>
      </article>`;
    }).join("");
    el.querySelectorAll("[data-a]").forEach((b) => (b.onclick = (e) => decide(b.closest("[data-id]"), b.dataset.a, e)));
    ui.reveal(el);
  }

  function decide(card, status, ev) {
    const l = db.leaves().find((x) => x.id === card.dataset.id);
    const u = db.user(l.userId);
    ui.modal({
      title: `${status === "approved" ? "Approve" : "Reject"} ${u.name}'s leave`,
      body: `<p class="muted" style="margin-bottom:14px">${L.TYPES[l.type].label} · ${l.days} day${l.days > 1 ? "s" : ""} · ${D.short(l.from)} – ${D.short(l.to)}</p>
        <form class="form-grid one" id="cForm" novalidate>${ui.field({ name: "comment", label: `Comment ${status === "approved" ? "(optional)" : ""}`, type: "textarea", placeholder: status === "approved" ? "Enjoy your time off!" : "Reason for rejecting…" })}</form>`,
      actions: [
        { label: "Cancel" },
        { label: status === "approved" ? `${icon("check")} Approve` : `${icon("x")} Reject`, cls: status === "approved" ? "btn-primary" : "btn-danger", onClick(close, wrap) {
          const f = wrap.querySelector("#cForm");
          const { comment } = ui.formData(f);
          if (status === "rejected" && !comment.trim()) return ui.showErrors(f, { comment: "Please add a short reason for the employee." });
          const r = L.decide(l.id, status, comment, me.id);
          if (r.error) return ui.showErrors(f, { comment: r.error });
          close();
          card.classList.add("leaving");
          if (status === "approved") ui.confetti(ev.clientX, ev.clientY);
          ui.toast(`${u.name}'s leave ${status}`);
          setTimeout(render, 380);
        } },
      ],
    });
  }

  render();
  HCM.store.onChange((k) => k === HCM.KEYS.leaves && !document.querySelector(".overlay") && render());
})();
