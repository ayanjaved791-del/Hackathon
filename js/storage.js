/* =========================================================
   HCM Lite · storage.js
   Single source of truth for reading / writing localStorage.
   Every page uses these helpers — nothing else touches storage.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});

  const KEYS = {
    company: "hcm_company",
    users: "hcm_users",
    attendance: "hcm_attendance",
    leaves: "hcm_leaves",
    session: "hcm_session",
    announcements: "hcm_announcements",
    theme: "hcm_theme",
    ai: "hcm_ai", // optional LLM config — lives only in this browser
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Could not save", key, e);
    }
    emit(key);
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    emit(key);
  }

  /* ---- change listeners (same tab + other tabs) ---- */
  const listeners = new Set();
  function emit(key) { listeners.forEach((fn) => fn(key)); }
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("hcm_")) emit(e.key);
  });

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const DEFAULT_COMPANY = {
    name: "",
    startTime: "09:00",
    graceMinutes: 15,
    halfDayHours: 5,
    leaveQuota: 20,
    workingDays: [1, 2, 3, 4, 5], // 0 = Sun … 6 = Sat
    currency: "PKR",
    office: null, // { lat, lng, radius } for geofenced check-in
  };

  HCM.KEYS = KEYS;
  HCM.uid = uid;
  HCM.store = { read, write, remove, onChange: (fn) => listeners.add(fn) };

  HCM.db = {
    /* company */
    company: () => {
      const c = read(KEYS.company, null);
      return c ? { ...DEFAULT_COMPANY, ...c } : null;
    },
    saveCompany: (c) => write(KEYS.company, c),
    defaults: () => ({ ...DEFAULT_COMPANY }),

    /* users */
    users: () => read(KEYS.users, []),
    saveUsers: (list) => write(KEYS.users, list),
    employees: () => read(KEYS.users, []).filter((u) => u.role === "employee"),
    user: (id) => read(KEYS.users, []).find((u) => u.id === id) || null,
    userByEmail: (email) =>
      read(KEYS.users, []).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase()) || null,
    updateUser(id, patch) {
      const list = this.users().map((u) => (u.id === id ? { ...u, ...patch } : u));
      this.saveUsers(list);
      return list.find((u) => u.id === id);
    },
    departments() {
      return [...new Set(this.employees().map((e) => e.department).filter(Boolean))].sort();
    },

    /* attendance */
    attendance: () => read(KEYS.attendance, []),
    saveAttendance: (list) => write(KEYS.attendance, list),

    /* leaves */
    leaves: () => read(KEYS.leaves, []),
    saveLeaves: (list) => write(KEYS.leaves, list),

    /* announcements */
    announcements: () => read(KEYS.announcements, []),
    saveAnnouncements: (list) => write(KEYS.announcements, list),

    /* session */
    session: () => read(KEYS.session, null),
    setSession: (s) => write(KEYS.session, s),
    clearSession: () => remove(KEYS.session),

    /* everything (backup / reset) */
    exportAll() {
      const out = {};
      Object.values(KEYS).forEach((k) => (out[k] = read(k, null)));
      return out;
    },
    importAll(data) {
      Object.values(KEYS).forEach((k) => {
        if (k in data && data[k] !== null) write(k, data[k]);
      });
    },
    resetAll() {
      Object.values(KEYS).forEach((k) => k !== KEYS.theme && remove(k));
    },
  };
})();
