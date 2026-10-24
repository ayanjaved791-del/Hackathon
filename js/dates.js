/* =========================================================
   HCM Lite · dates.js
   Small date + formatting helpers. All dates are LOCAL time
   and stored as "YYYY-MM-DD" keys.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const pad = (n) => String(n).padStart(2, "0");

  const D = {
    key(date = new Date()) {
      const d = new Date(date);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    today() { return D.key(new Date()); },
    parse(key) {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m - 1, d);
    },
    addDays(key, n) {
      const d = D.parse(key);
      d.setDate(d.getDate() + n);
      return D.key(d);
    },
    /** every date key from a to b (inclusive) */
    range(a, b) {
      const out = [];
      for (let k = a; k <= b; k = D.addDays(k, 1)) out.push(k);
      return out;
    },
    monthKeys(year, month /* 0-11 */) {
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => D.key(new Date(year, month, i + 1)));
    },
    monthValue(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`; },
    parseMonth(v) { const [y, m] = v.split("-").map(Number); return { year: y, month: m - 1 }; },
    weekday(key) { return D.parse(key).getDay(); },
    /** Monday of the week containing key */
    weekStart(key) {
      const d = D.parse(key);
      const diff = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - diff);
      return D.key(d);
    },
    isWorkingDay(key, company) {
      return (company?.workingDays || [1, 2, 3, 4, 5]).includes(D.weekday(key));
    },
    workingDays(a, b, company) {
      if (!a || !b || a > b) return [];
      return D.range(a, b).filter((k) => D.isWorkingDay(k, company));
    },
    /** "09:15" -> 555 */
    toMinutes(hhmm) {
      const [h, m] = String(hhmm || "0:0").split(":").map(Number);
      return h * 60 + (m || 0);
    },
    minutesOf(iso) { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; },
    fromMinutes(min) { return `${pad(Math.floor(min / 60) % 24)}:${pad(Math.round(min % 60))}`; },

    /* ---------- formatting ---------- */
    time(iso) {
      if (!iso) return "—";
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    time12(hhmm) {
      const m = D.toMinutes(hhmm);
      const h = Math.floor(m / 60), mm = m % 60;
      return `${((h + 11) % 12) + 1}:${pad(mm)} ${h < 12 ? "AM" : "PM"}`;
    },
    nice(key, opts = { day: "numeric", month: "short", year: "numeric" }) {
      if (!key) return "—";
      return D.parse(key).toLocaleDateString(undefined, opts);
    },
    short(key) { return D.nice(key, { day: "numeric", month: "short" }); },
    long(date = new Date()) {
      return new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    },
    monthName(year, month) {
      return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    },
    dayName(i, len = "short") {
      return new Date(2024, 0, 7 + i).toLocaleDateString(undefined, { weekday: len });
    },
    /** 27 -> "27 min", 742 -> "12h 22m" */
    late(min) { return min < 60 ? `${min} min` : D.hours(min / 60); },
    hours(h) {
      if (h == null || isNaN(h)) return "—";
      const total = Math.round(h * 60);
      return `${Math.floor(total / 60)}h ${pad(total % 60)}m`;
    },
    ago(iso) {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return "just now";
      if (s < 3600) return `${Math.floor(s / 60)}m ago`;
      if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
      if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
      return D.nice(D.key(iso));
    },
    greeting() {
      const h = new Date().getHours();
      return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    },
  };

  HCM.date = D;

  HCM.money = function (n, currency) {
    const cur = currency || HCM.db.company()?.currency || "PKR";
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return `${cur} ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };
})();
