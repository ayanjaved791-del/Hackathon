/* =========================================================
   HCM Lite · employees.js
   Add (creates the login), edit, delete, validate.
   ========================================================= */
(function () {
  const HCM = (window.HCM = window.HCM || {});
  const { db } = HCM;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const emp = {
    EMAIL_RE,

    validate(form, editingId) {
      const errors = {};
      const name = (form.name || "").trim();
      const email = (form.email || "").trim().toLowerCase();
      if (!name) errors.name = "Name is required.";
      else if (name.length < 2) errors.name = "Name looks too short.";
      if (!email) errors.email = "Email is required.";
      else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email, e.g. sara@company.com.";
      else {
        const other = db.userByEmail(email);
        if (other && other.id !== editingId) errors.email = "This email is already used by " + other.name + ".";
      }
      if (!(form.department || "").trim()) errors.department = "Department is required.";
      if (!(form.designation || "").trim()) errors.designation = "Job title is required.";
      const salary = Number(form.salary);
      if (form.salary === "" || form.salary == null) errors.salary = "Salary is required.";
      else if (!(salary > 0)) errors.salary = "Salary must be greater than 0.";
      if (!form.joinDate) errors.joinDate = "Joining date is required.";
      if (!editingId) {
        if (!form.password) errors.password = "Set a first password.";
        else if (form.password.length < 6) errors.password = "Use at least 6 characters.";
      }
      return errors;
    },

    add(form) {
      const errors = emp.validate(form);
      if (Object.keys(errors).length) return { errors };
      const user = {
        id: HCM.uid(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: HCM.auth.hash(form.password),
        role: "employee",
        department: form.department.trim(),
        designation: form.designation.trim(),
        phone: (form.phone || "").trim(),
        salary: Number(form.salary),
        joinDate: form.joinDate,
        createdAt: new Date().toISOString(),
      };
      db.saveUsers([...db.users(), user]);
      return { user };
    },

    update(id, form) {
      const errors = emp.validate(form, id);
      if (Object.keys(errors).length) return { errors };
      const patch = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        phone: (form.phone || "").trim(),
        salary: Number(form.salary),
        joinDate: form.joinDate,
      };
      if (form.password) {
        if (form.password.length < 6) return { errors: { password: "Use at least 6 characters." } };
        patch.password = HCM.auth.hash(form.password);
      }
      return { user: db.updateUser(id, patch) };
    },

    remove(id) {
      db.saveUsers(db.users().filter((u) => u.id !== id));
      db.saveAttendance(db.attendance().filter((r) => r.userId !== id));
      db.saveLeaves(db.leaves().filter((l) => l.userId !== id));
    },

    search(q = "", dept = "") {
      const s = q.trim().toLowerCase();
      return db.employees().filter((e) =>
        (!dept || e.department === dept) &&
        (!s || [e.name, e.email, e.department, e.designation, e.phone].some((v) => (v || "").toLowerCase().includes(s)))
      );
    },
  };

  HCM.employees = emp;
})();
