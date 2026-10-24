/* =========================================================
   HCM Lite · charts.js
   Hand-made, animated SVG charts — no chart library needed.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const esc = (s) => HCM.ui.esc(s);

  const charts = {
    /** Stacked horizontal bars per department. rows: [{label, parts:[{value,color,name}]}] */
    stackedBars(el, rows, { legend = [] } = {}) {
      if (!rows.length) { el.innerHTML = HCM.ui.empty("No departments yet", "Add employees to see attendance by department.", "people"); return; }
      const max = Math.max(1, ...rows.map((r) => r.parts.reduce((s, p) => s + p.value, 0)));
      el.innerHTML = `
        <div class="sbars">
          ${rows.map((r) => {
            const total = r.parts.reduce((s, p) => s + p.value, 0);
            return `<div class="sbar-row">
              <span class="sbar-label">${esc(r.label)}</span>
              <div class="sbar-track">${r.parts.map((p) => p.value ? `<span class="sbar-seg" title="${esc(p.name)}: ${p.value}" style="--w:${(p.value / max) * 100}%;background:${p.color}"></span>` : "").join("")}</div>
              <span class="sbar-val mono">${total}</span>
            </div>`;
          }).join("")}
        </div>
        ${legend.length ? `<div class="legend">${legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.name)}</span>`).join("")}</div>` : ""}`;
      requestAnimationFrame(() => el.querySelectorAll(".sbar-seg").forEach((s, i) => setTimeout(() => s.classList.add("grow"), i * 40)));
    },

    /** Smooth area chart. points: [{label, value}] */
    area(el, points, { color = "var(--volt)", suffix = "", height = 180 } = {}) {
      const w = 600, h = height, pad = { t: 16, r: 8, b: 26, l: 8 };
      const max = Math.max(1, ...points.map((p) => p.value));
      const x = (i) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, points.length - 1);
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      const pts = points.map((p, i) => [x(i), y(p.value)]);
      const path = pts.reduce((d, [px, py], i) => {
        if (!i) return `M${px},${py}`;
        const [qx, qy] = pts[i - 1], cx = (qx + px) / 2;
        return `${d} C${cx},${qy} ${cx},${py} ${px},${py}`;
      }, "");
      const id = "g" + Math.random().toString(36).slice(2, 7);
      el.innerHTML = `
        <div class="area-wrap">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="area">
          <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".45"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
          ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${w}" y1="${pad.t + f * (h - pad.t - pad.b)}" y2="${pad.t + f * (h - pad.t - pad.b)}" class="gridline"/>`).join("")}
          <path d="${path} L${x(points.length - 1)},${h - pad.b} L${x(0)},${h - pad.b} Z" fill="url(#${id})" class="area-fill"/>
          <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" class="area-line" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="area-dots">${pts.map(([px, py], i) => `<span class="adot" style="left:${(px / w) * 100}%;top:${(py / h) * 100}%" data-tip="${esc(points[i].label)} · ${points[i].value}${suffix}"></span>`).join("")}</div>
        <div class="area-x">${points.map((p, i) => ((i % Math.ceil(points.length / 7) === 0 && points.length - 1 - i >= Math.ceil(points.length / 7)) || i === points.length - 1 ? `<span style="left:${(x(i) / w) * 100}%">${esc(p.short || p.label)}</span>` : "")).join("")}</div>
        </div>`;
      const line = el.querySelector(".area-line");
      const len = line.getTotalLength ? line.getTotalLength() : 1000;
      line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
      requestAnimationFrame(() => { line.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.6,0,.2,1)"; line.style.strokeDashoffset = 0; });
    },

    /** Donut with center label. parts: [{name, value, color}] */
    donut(el, parts, { center = "", sub = "" } = {}) {
      const total = parts.reduce((s, p) => s + p.value, 0);
      const r = 42, C = 2 * Math.PI * r;
      let off = 0;
      const segs = total
        ? parts.filter((p) => p.value).map((p) => {
            const len = (p.value / total) * C;
            const s = `<circle r="${r}" cx="50" cy="50" fill="none" stroke="${p.color}" stroke-width="11" stroke-dasharray="0 ${C}" data-len="${Math.max(0, len - 1.5)}" stroke-dashoffset="${-off}" stroke-linecap="butt" class="dseg"><title>${esc(p.name)}: ${p.value}</title></circle>`;
            off += len; return s;
          }).join("")
        : "";
      el.innerHTML = `
        <div class="donut">
          <svg viewBox="0 0 100 100"><circle r="${r}" cx="50" cy="50" fill="none" class="dtrack" stroke-width="11"/>${segs}</svg>
          <div class="donut-c"><b>${center}</b><small>${sub}</small></div>
        </div>
        <ul class="donut-legend">${parts.map((p) => `<li><i style="background:${p.color}"></i>${esc(p.name)}<b class="mono">${p.value}</b></li>`).join("")}</ul>`;
      requestAnimationFrame(() => el.querySelectorAll(".dseg").forEach((c, i) => setTimeout(() => {
        c.style.transition = "stroke-dasharray .9s cubic-bezier(.6,0,.2,1)";
        c.setAttribute("stroke-dasharray", `${c.dataset.len} ${C}`);
      }, 80 + i * 120)));
    },

    /** Progress ring: value 0..1 */
    ring(value, { size = 120, stroke = 10, color = "var(--volt)", track = "var(--line-2)" } = {}) {
      const r = (size - stroke) / 2, C = 2 * Math.PI * r;
      return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
        <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, Math.max(0, value)))}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>`;
    },

    /** Month calendar heatmap. days: [{key,status}] */
    calendar(el, year, month, days) {
      const first = new Date(year, month, 1).getDay();
      const offset = (first + 6) % 7; // Monday first
      const today = HCM.date.today();
      const S = HCM.attendance.STATUS;
      el.innerHTML = `
        <div class="cal">
          ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<span class="cal-h">${HCM.date.dayName(d, "narrow")}</span>`).join("")}
          ${Array.from({ length: offset }, () => `<span></span>`).join("")}
          ${days.map((d, i) => `<span class="cal-d st-${d.status} ${d.key === today ? "is-today" : ""}" style="--i:${i}" title="${HCM.date.nice(d.key)} · ${S[d.status]?.label || ""}${d.rec?.checkIn ? " · in " + HCM.date.time(d.rec.checkIn) : ""}${d.rec?.checkOut ? " · out " + HCM.date.time(d.rec.checkOut) : ""}">${Number(d.key.slice(8))}</span>`).join("")}
        </div>`;
    },
  };

  HCM.charts = charts;
})();
