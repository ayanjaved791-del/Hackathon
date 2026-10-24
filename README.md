# HCM Lite

A small, fast HR web app for **Admins** and **Employees**, built with plain **HTML, CSS and JavaScript**. There is no framework, no backend and no build step. All data lives in the browser's `localStorage`.

> Saylani Hackathon · Beginner Track · 24 October 2026

## Features

| Area | What you get |
|---|---|
| **First-run setup** | A 3-step wizard creates the company, its work rules and the Admin account |
| **Roles** | Admin and Employee. Every page checks the session, and an Employee who opens an Admin page is sent back to their own dashboard |
| **Employees** | Add (this also creates the login), edit, delete, search, department filter chips, grid or table view, inline field errors, a "copy login details" card |
| **Attendance** | One check-in per day and check-out only after check-in. **Late** = after start + grace. **Half day** = fewer than *N* hours. **Absent** = no record on a past working day |
| **Camera check-in** *(bonus)* | `getUserMedia()` + `navigator.geolocation` with an office geofence + face detection (face-api, loaded lazily from a CDN) |
| **Leave** | Apply → approve or reject with a comment. Counts working days only, blocks overlaps, never goes over the yearly quota (pending days are reserved), and the balance updates live |
| **Dashboards** | Admin: KPIs, 14-day trend, today's donut, department bars, live check-in feed, one-tap approvals, announcements. Employee: live work-day clock ring, balance ring, month heatmap, recent history |
| **Payslip** | Per day = salary ÷ working days. Deduction = per day × (absent + 0.5 × half days). Net = salary − deduction. Print or save as PDF |
| **Smart helper** | A chat box on both dashboards. Keyword intents answer from real data. Employees only get **their own** data. *(Bonus)* An optional LLM fallback |
| **Extras** | Dark mode, ⌘K / Ctrl+K command palette, CSV export, printable monthly attendance report, attendance matrix, announcements, change password, backup/restore, live sync across tabs, mobile bottom dock |

## Run it

No install is needed.

```bash
# any static server works, for example:
python3 -m http.server 8080
# then open http://localhost:8080
```

Or open `index.html` directly in a browser. For the camera and location features, browsers require `https://` or `localhost`.

### Deploy (free)

* **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root.
* **Netlify / Vercel**: import the repo. There is no build command, and the publish directory is `/`.

## How to use it (demo script)

1. Open the app. The setup wizard asks for the company name, work rules (start time, grace minutes, leave quota, half-day hours, working days) and your Admin login.
2. **Employees → Add employee.** Fill in the form. A login is created and the credentials are shown so you can share them.
3. Log out and sign in as the employee. On **My day**, press **Check in** (or **Camera check-in**). You'll be marked on time or late using the Admin's rules.
4. **Apply for leave.** The working-day count updates as you pick dates. Errors appear next to the field (end before start, overlap, over quota).
5. Log back in as Admin. **Leave requests → Approve / Reject** with a comment. If both are open in two tabs, the employee's page updates instantly.
6. **Payslips**: pick an employee and month, then **Print / PDF**.
7. Ask the helper: *"Who is on leave today?"*, *"Who was late today?"*, *"How many leaves do I have left?"*, *"How many hours did I work this week?"*

## Optional AI helper (bonus)

Go to **Settings → AI helper** and paste a key for any OpenAI-compatible endpoint (the Groq free tier works out of the box). Questions the keyword engine can't answer are then sent to the LLM along with a short JSON summary. The summary holds only the user's own data for Employees.

The key is saved in **this browser's localStorage only**. It is never written into the code, so it never ends up on GitHub.

## Project structure

```
index.html              Login + first-run setup
pages/
  admin.html            Admin dashboard
  employees.html        Manage employees
  attendance.html       All attendance records, matrix, CSV, print report
  leaves.html           Approve / reject leave
  settings.html         Company rules, geofence, AI key, backup / reset
  employee.html         Employee "My day" dashboard
  payslip.html          Monthly salary slip
css/style.css           Design system ("Ink & Volt"), light + dark, print styles
js/
  storage.js            localStorage read/write helpers (the only file touching storage)
  dates.js              Date keys, working days, formatting
  auth.js               Setup, login/logout, role guard, passwords
  employees.js          Add / edit / delete / validate
  attendance.js         Check in/out, late/half/absent rules, summaries, CSV
  leave.js              Apply, validate, approve/reject, balances
  payroll.js            Payslip maths
  helper.js             Smart helper (keyword intents + optional LLM)
  camera.js             Camera + location + face check-in
  charts.js             Hand-made animated SVG charts (no chart library)
  ui.js                 Shell, icons, toasts, modals, drawers, command palette, theme
  pages/*.js            One small controller per page
```

### localStorage keys

| Key | Stores |
|---|---|
| `hcm_company` | Company name and rules (start time, grace, half-day hours, leave quota, working days, office geofence) |
| `hcm_users` | Admin and employees: id, name, email, hashed password, role, department, designation, salary, join date |
| `hcm_attendance` | One entry per employee per day: date, check-in, check-out, status, method, location |
| `hcm_leaves` | Leave requests: employee id, type, from, to, days, reason, status, comment |
| `hcm_announcements` | Admin announcements |
| `hcm_session` | Who is logged in right now |

## Notes on the rules

* Late / half-day status is always **re-computed from the current settings**. If the Admin changes the start time, history reflects the new rule.
* A past day that was checked in but never checked out counts as a **half day**.
* Days before an employee's joining date and days after today are not counted as absent.
* Check-in is allowed on off days (e.g. weekend work), but it is blocked on a day with approved leave.
* Passwords are hashed with a small non-cryptographic hash, so they aren't stored as plain text. A real app would hash on a server.
