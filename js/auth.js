/* =========================================================
   HCM Lite · auth.js
   First-run setup, login / logout, role guards, passwords.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const db = HCM.db;

  /* Tiny non-cryptographic hash (cyrb53) so passwords are not
     stored as plain text. Fine for a learning app — a real app
     hashes on a server with bcrypt/argon2. */
  function hash(str, seed = 7) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "h$" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  const ROOT = location.pathname.includes("/pages/") ? "../" : "./";
  const PAGES = {
    login: ROOT + "index.html",
    admin: ROOT + "pages/admin.html",
    employee: ROOT + "pages/employee.html",
  };

  const auth = {
    hash,
    ROOT,
    PAGES,
    isSetup: () => !!db.company() && db.users().some((u) => u.role === "admin"),

    setup({ company, admin }) {
      db.saveCompany({ ...db.defaults(), ...company, createdAt: new Date().toISOString() });
      const user = {
        id: HCM.uid(),
        name: admin.name.trim(),
        email: admin.email.trim().toLowerCase(),
        password: hash(admin.password),
        role: "admin",
        department: "Management",
        designation: "Administrator",
        salary: 0,
        joinDate: HCM.date.today(),
        createdAt: new Date().toISOString(),
      };
      db.saveUsers([user]);
      db.setSession({ userId: user.id, at: new Date().toISOString() });
      return user;
    },

    login(email, password) {
      const user = db.userByEmail(email);
      if (!user) return { error: { email: "No account found with this email." } };
      if (user.password !== hash(password)) return { error: { password: "Incorrect password." } };
      db.setSession({ userId: user.id, at: new Date().toISOString() });
      return { user };
    },

    logout() {
      db.clearSession();
      location.href = PAGES.login;
    },

    current() {
      const s = db.session();
      return s ? db.user(s.userId) : null;
    },

    home(user) { return user?.role === "admin" ? PAGES.admin : PAGES.employee; },

    /** Call at the top of every protected page; returns null (and redirects) when access is denied. */
    guard(role) {
      const user = auth.current();
      if (!user) { location.replace(PAGES.login); return null; }
      if (role && role !== "any" && user.role !== role) {
        location.replace(auth.home(user));
        return null;
      }
      return user;
    },

    changePassword(userId, current, next) {
      const u = db.user(userId);
      const errors = {};
      if (!u || u.password !== hash(current)) errors.current = "Current password is incorrect.";
      if (!next || next.length < 6) errors.next = "Use at least 6 characters.";
      if (Object.keys(errors).length) return { errors };
      db.updateUser(userId, { password: hash(next) });
      return { ok: true };
    },
  };

  HCM.auth = auth;
})();
