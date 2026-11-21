<<<<<<< Updated upstream
# CivicLens 🏙️🔍
> **AI-Powered Citizen Complaint Triage and Municipal Issue Prioritization**

CivicLens streamlines municipal governance by empowering citizens to report infrastructure and public safety hazards with photo evidence and geolocation, while leveraging automated AI triage to score urgency, detect duplicate reports, and automatically route issues to appropriate city departments.

---

## 👥 Role-Based Authentication & Demo Credentials

CivicLens includes a complete demo role-based authentication system built using vanilla JavaScript and `localStorage`. For hackathon judges and evaluators, **1-Click Quick Demo Login** buttons are directly available on the login page:

| Role | Demo Email | Demo Password | Default Persona / Permissions |
| :--- | :--- | :--- | :--- |
| **👤 Citizen** | `citizen@civiclens.org` | `citizen123` | **Alex Rivera (Ward 4 Resident)**<br/>• Submit issues with photos, descriptions, and GPS.<br/>• Track submitted complaints and statuses.<br/>• View assigned Ticket IDs.<br/>• *Strictly blocked from officer triage/management controls.* |
| **🛡️ Municipal Officer** | `officer@civiclens.gov` | `officer123` | **Officer Sarah Chen (Badge #MUNI-8042)**<br/>• Command Center & Dispatcher Dashboard.<br/>• Dynamic municipal KPIs.<br/>• Priority triage queue (Active vs. Resolved Archive).<br/>• Automated hazard analysis & computer vision dossier.<br/>• Status updating & case reopening. |

---

## 📁 Project File Structure

```text
CivicLens/
├── assets/                  # Project assets and placeholders
├── css/
│   ├── dashboard.css        # KPI stat cards, login UI, queue tabs, card grid & table
│   ├── form.css             # Submission form, photo dropzone, GPS picker, citizen tracker
│   └── styles.css           # Design tokens, color system, severity & status badges, toasts
├── js/
│   ├── api.js               # Service bridge & API contract for Member 2 backend
│   ├── app.js               # Application bootstrap, Auth/session manager, toasts, AI badge
│   ├── dashboard.js         # Officer Dashboard, dynamic KPIs, active/resolved queues, reopening
│   ├── mockData.js          # Realistic seed complaints with SVG visuals & AI triage scores
│   └── submitForm.js        # Form validation, drag-and-drop preview, GPS, citizen ticket tracker
├── index.html               # Landing & Login Page (when logged out) / Officer Dashboard (when logged in)
├── README.md                # Documentation, demo guide, and API integration contract
└── submit.html              # Dedicated Citizen Complaint Portal & Status Tracker
```

---

## 🚀 How to Run and Test

The project uses zero third-party dependencies (**100% native HTML5, CSS3, and modern vanilla JavaScript ES6+**). It works completely offline with realistic seed data.

### Option 1: Using Python (Recommended)
Open a terminal in the `Civicslens` project folder and run:
```bash
python -m http.server 3000
```
Open [`http://localhost:3000`](http://localhost:3000) in your web browser.

### Option 2: Using Node.js
```bash
npx serve .
```

### Option 3: Direct Browser Launch
Open `index.html` directly in Chrome, Edge, Safari, or Firefox:
```powershell
Start-Process "index.html"
```

---

## 🧪 Interactive Testing Checklist for Hackathon Judges

### 1. Login System & Role Separation
1. Open `index.html` in an unauthenticated window.
2. Observe the GovTech Landing Page with **Role Selection Tabs** (`👤 Citizen Portal` vs `🛡️ Municipal Officer`).
3. Click **`⚡ Login as Citizen`** under Demo Credentials:
   - Notice the toast confirmation and automatic redirect to `submit.html` (Citizen Portal).
   - Verify that officer management controls and dispatcher metrics are absent.
4. Click **`Log Out`** in the top navbar:
   - Returns to `index.html`.
5. Click **`⚡ Login as Officer`**:
   - Logs into the **Municipal Triage Command Center** as Officer Sarah Chen (`MUNI-8042`).

### 2. Citizen Portal & Ticket Tracker (`submit.html`)
1. While logged in as Citizen, navigate to `submit.html`.
2. **Submit a Complaint**:
   - Use the **`⚡ Quick Demo Autofill`** buttons (e.g. `🚗 Critical Pothole` or `⚡ Sparking Wire`) or fill out custom details.
   - Click **`Locate Me`** to test the browser Geolocation GPS coordinate capture.
   - Drag and drop or upload an image to see the live photo preview and file size badge.
   - Click **`Triage & Submit Issue`**.
3. **Ticket Confirmation & Tracking**:
   - Notice the green confirmation card with the official **Ticket ID** (e.g. `#CVL-2042`) and assigned municipal department.
   - Scroll down to the **"📋 My Submitted Complaints & Status Tracker"** section to observe your newly submitted issue rendered with its live status badge, severity tag, and AI urgency score!
   - Type a Ticket ID into the tracker search bar to test real-time ticket lookup.

### 3. Officer Dashboard & Dynamic Statistics (`index.html`)
1. Log in as an Officer.
2. Inspect the 4 KPI metric cards:
   - **Total Complaints Submitted**: Dynamically calculated across all complaints (Active + Resolved). *Unnecessary monitor icon removed.*
   - **Critical / High Active**: Dynamically counts active (unresolved) emergencies.
   - **Avg Priority Score**: Dynamic average of AI urgency scores for active cases.
   - **Resolution Rate**: Dynamically calculated percentage of total complaints marked as resolved.
3. Switch between **Cards View** and **Table View** using the view toggle buttons in the toolbar.
4. Test real-time filtering with severity chips (`Critical`, `High`, etc.), category selector, and live keyword search.

### 4. Resolved Complaints Archive & Case Reopening
1. On an active complaint (e.g. in Card or Table view), change its status to **`✓ Mark Resolved`** (or open the **Triage Dossier** and click **`✓ Mark Resolved`**).
2. **Immediate Removal from Active Queue**:
   - The resolved complaint is removed immediately from the Active Complaints queue.
   - The *Critical/High Active* count drops and the *Resolution Rate %* increases dynamically!
3. Click the **`📁 Resolved Cases Archive`** queue tab:
   - Notice the resolved case stored permanently in the archive with its resolution badge.
4. Click **`Reopen Case`**:
   - The case is restored back to the Active Complaints Queue (`In Progress`).
   - The statistics update dynamically in real time.

### 5. Honest AI Status Indicator
- Notice the badge in the top navbar: **`⚡ Demo AI / Fallback Mode`**.
- It honestly indicates that the system is currently using deterministic keyword heuristics and offline computer vision mock scoring, without falsely claiming a real external LLM API is connected.
- If Member 2 configures `API_CONFIG.USE_BACKEND = true` in `js/api.js`, the badge automatically updates to **`🟢 Live Backend AI Active`**.

---

## 🤝 Member 2 Integration Guide (Backend & AI)

Member 2 can attach their live backend endpoints in [js/api.js](file:///c:/Users/tamos/coding/hackathon/civicslens/Civicslens/js/api.js#L11-L16):

```javascript
const API_CONFIG = {
  USE_BACKEND: true,                    // Change to true when backend is running
  BASE_URL: "http://localhost:5000/api" // Point to your backend endpoint
};
```
No HTML or frontend layout code needs to be modified when connecting the backend.
=======
# CivicLens

CivicLens is an AI-assisted citizen complaint triage prototype. This repository
uses Node.js, Express and JSON-file persistence. The existing frontend/Python
scaffold is not redesigned or replaced.

This is a **hackathon prototype**, not production-ready authentication or
security.

## Installation

```powershell
npm install
copy .env.example .env
```

Set a real `JWT_SECRET` in `.env`. Never commit `.env`.

## Start

Start the backend in one PowerShell terminal:

```powershell
npm start
```

The API runs at `http://localhost:3000` by default and also serves the frontend.
To run the static frontend separately, start a second terminal in the project
root and run:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500`. The backend's `FRONTEND_URL` must include that
origin; it accepts a comma-separated list of exact origins.

## Demo credentials

- Citizen: `citizen@civiclens.org` (password configured by
  `DEMO_CITIZEN_PASSWORD`)
- Municipal officer: `officer@civiclens.gov` (password configured by
  `DEMO_OFFICER_PASSWORD`)

Demo values can be changed with `DEMO_OFFICER_USERNAME` and
`DEMO_OFFICER_PASSWORD`.

## Environment variables

- `PORT`: API port
- `FRONTEND_URL`: allowed browser origin
- `JWT_SECRET`: demo token signing secret
- `DEMO_OFFICER_USERNAME`: officer login username
- `DEMO_OFFICER_PASSWORD`: officer login password
- `AI_API_KEY`: OpenAI-compatible API key
- `AI_API_URL`: chat-completions endpoint
- `AI_MODEL`: model name

Leave `AI_API_KEY` empty for the clearly labelled fallback keyword classifier.
If a configured generative API fails or returns an invalid response, the API
uses the fallback and records `analysisMethod: "Fallback keyword classifier"`.
It does not falsely represent this fallback as generative AI.

## Authentication

Send successful login/register tokens as:

```text
Authorization: Bearer <token>
```

Citizens may only submit complaints and view their own records. Municipal
officers may view all complaints, dashboard statistics, update status, assign
departments and delete records. Demo deletion is intentionally limited to
officers.

## API endpoints

### Health

- `GET /api/health`

### Authentication

- `POST /api/auth/register`
  - JSON: `{ "name": "Asha", "username": "asha", "password": "secret123" }`
- `POST /api/auth/login`
  - JSON: `{ "username": "officer", "password": "officer123" }`
  - Citizen JSON uses the citizen's registered credentials.

### Complaints

- `POST /api/complaints`
  - Citizen role required.
  - JSON: `{ "text": "...", "location": "...", "image": "optional URL" }`
  - Or `multipart/form-data` fields `text`, `location` and optional `image`.
- `GET /api/complaints`
  - Citizen: own complaints only.
  - Officer: all complaints.
  - Officer results are sorted Critical to Low, then by priority score.
- `GET /api/complaints/:id`
- `PATCH /api/complaints/:id/status`
  - Officer only.
  - `{ "status": "Pending" | "In Progress" | "Resolved" }`
- `PATCH /api/complaints/:id/reopen`
  - Officer only; resolved complaints reopen as `In Progress`.
- `PATCH /api/complaints/:id/department`
  - Officer only.
  - `{ "department": "Public Works Department" }`
- `DELETE /api/complaints/:id`
  - Officer only; reserved for authorised demo-administrator deletion.

All mutation/list responses use:

```json
{ "success": true, "data": {} }
```

Errors use:

```json
{ "success": false, "error": "Human-readable message" }
```

### Dashboard

- `GET /api/dashboard/stats` (municipal officer only)

The response includes total ingested complaints, active, Critical, High,
Pending, resolved, average AI priority score and resolution rate.

## Image handling

Upload the `image` field with `multipart/form-data`. JPG, PNG and WebP are
accepted; the limit is 5 MB. Files are stored only in `uploads/` and served at
`/uploads/<filename>`. Uploading JSON `image` is also accepted as an explicit
URL but is not treated as a server-hosted upload.

## Duplicate detection

Before saving, complaints are compared with active records in the same location
and category using basic text similarity. A match is linked through
`possibleDuplicateOf` and exposed as `possibleDuplicate: true`; complaints are
not discarded.

## Frontend integration

The frontend uses `http://localhost:3000/api` as its API base in local
development. Register/login, store the returned token, and send it on all
authenticated requests.

Existing frontend localStorage data can remain for UI state, but complaint
creation, reading and status updates should call these REST endpoints rather
than treating localStorage as authoritative. Use the `imageUrl` from submission
responses and resolve it as `http://localhost:3000${imageUrl}`.

Set `FRONTEND_URL` to the frontend origin or a comma-separated list of
development origins, for example `http://localhost:5500,http://localhost:5173`.

## Testing

```powershell
npm test
```
>>>>>>> Stashed changes
