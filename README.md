🛡️ ForgeSOC — Advanced SOC Platform
A Security Operations Center dashboard: synthetic security events flow through a rule-based detection engine, correlate into incidents, trigger real-time IP blocking, and push live updates to every connected analyst — end to end, running locally.

LOGS → INGESTION → NORMALIZATION → DETECTION ENGINE → CORRELATION → ALERTS/INCIDENTS
                                           │
                                    AUTO-BLOCK (real-time)
                                           │
                                  DASHBOARD (live via WebSocket) → INVESTIGATION
What's included
Core (Phase 1)

Authentication — JWT + bcrypt, roles: ADMIN, SOC_ANALYST, VIEWER
Dashboard — event/alert KPIs, severity + event-type charts, recent alerts
Synthetic events — a seed script that generates realistic benign traffic plus a full multi-stage attack chain (see below)
Alerts — list, filter, search, and a full investigation view (timeline, assignment, analyst verdict, investigation notes, MITRE ATT&CK context)
Detection Rules — 6 starter rules, enable/disable toggle
Assets — inventory with status, risk level, and related alerts
Advanced additions

Event ID capturing — events carry a windowsEventId (4624, 4625, 4672, 4688, etc.), and detection rules can match on it directly, the way real Sigma/SIEM rules key off Windows Security Event IDs rather than free-text descriptions
SIEM-style correlation engine (services/correlationEngine.js) — when 2+ distinct detection rules fire for the same source IP or host within a 15-minute window, ForgeSOC automatically opens an Incident linking the alerts together, with MITRE ATT&CK tags per rule (Credential Access → T1110 Brute Force, Impact → T1486 Data Encrypted for Impact, etc.) — the same idea Wazuh/Sentinel correlation rules use, deliberately simplified to be readable and easy to extend
Real-time IP blocking (services/blockService.js, /blocklist page) — rules flagged autoBlock: true (brute force, ransomware-behavior) push the offending IP onto a live blocklist the instant they fire; analysts can also block/unblock manually. Any further event from a blocked IP is tagged blockedSourceTraffic in real time, simulating firewall enforcement
Live updates via Socket.IO — new alerts, new events, IP blocks, and new incidents are pushed to every connected browser instantly (see the toast in the bottom-right corner and the Threat Map's live arcs)
3D Threat Map (/threat-map) — a rotating wireframe globe (three.js) plotting recent alert sources as animated arcs converging on HQ, colored by severity, with pulses traveling the great-circle path in real time. Positions are a deterministic hash of each source IP (not real GeoIP — swap in MaxMind/IPinfo for production)
Incidents page (/incidents) — view auto-correlated attack chains and walk them through the lifecycle (NEW → TRIAGED → INVESTIGATING → CONTAINED → RESOLVED → CLOSED)
Threat Intelligence (IOC) and Reports still have groundwork only (see "What's next" below).

Advanced round 2 — real integrations, not just simulations
This round replaces several "simulated" pieces with genuinely real ones:

Capability	File(s)	Status
Real GeoIP	services/geoService.js	✅ Fully real, offline DB (geoip-lite), no API key. Powers the Threat Map.
Real firewall blocking	services/firewallService.js	✅ Real code (iptables on Linux, netsh on Windows). Off by default (ENABLE_REAL_FIREWALL=false) — flip it once you've reviewed the commands and are running with root/admin.
Real syslog ingestion	services/ingestion/syslogListener.js	✅ Real UDP listener on port 1514. Point an actual device/rsyslog at it and its logs become real Event records.
SOAR playbooks	models/Playbook.js, services/playbookService.js, /playbooks page	✅ Fully real and local — no external dependency. Auto-block, auto-notify, auto-assign, triggered by alert severity/category.
Sigma rule import	services/sigmaImportService.js, POST /api/sigma/import	✅ Real parser for actual Sigma YAML (the open detection-rule standard) — extracts Event IDs, thresholds, MITRE tags.
CSV reports	controllers/reportController.js, /reports page	✅ Fully working exports.
Threat intel (AbuseIPDB)	services/threatIntelService.js	🔌 Real code, needs your free API key (ABUSEIPDB_API_KEY) — see .env.example
Slack / Email notifications	services/notificationService.js	🔌 Real code, needs your Slack webhook URL / SMTP credentials
The 🔌 items make real HTTPS calls to Slack/AbuseIPDB/your mail server — they just can't be exercised inside the sandbox this project was built in (no outbound network there). They'll work the moment you add credentials and run the server with normal internet access.

Try it end to end
npm run seed (as before) — this also seeds 3 default playbooks
Watch the seeded attack chain: brute force fires the "Auto-block critical..." playbook → attacker IP hits the blocklist → firewallService logs the would-be iptables command (dry-run) → correlation engine opens an Incident
Visit /playbooks to see execution counts, /blocklist to see the block + enforcement mode, /threat-map for real-GeoIP-plotted arcs, /reports to export CSVs
To go further: add ABUSEIPDB_API_KEY for reputation scoring, a SLACK_WEBHOOK_URL for live notifications, or flip ENABLE_REAL_FIREWALL=true on a Linux box you control to have it actually run iptables
Still on the roadmap (not built yet)
ML/statistical anomaly detection (beyond threshold rules)
Full Sigma correlation-rule syntax (only the common selection + flat count() > N subset is parsed today)
Case management / evidence attachment
Alert-fatigue suppression beyond the existing per-rule dedup
Tech stack
Frontend: React 18 + Vite, Tailwind CSS, Recharts, React Router, three.js (3D threat map), socket.io-client (real-time)
Backend: Node.js + Express, JWT + bcrypt, Socket.IO (real-time push)
Database: MongoDB (Mongoose)
Project structure
forgesoc/
├── server/            Express API
│   ├── config/        DB connection
│   ├── controllers/   Route handlers
│   ├── middleware/     Auth (JWT) + role guards
│   ├── models/        Mongoose schemas
│   ├── routes/        Express routers
│   ├── services/
│   │   ├── detectionEngine.js     the rule evaluation "brain"
│   │   ├── eventProcessor.js      orchestrates ingest → detect
│   │   └── synthDataGenerator.js  seed script
│   └── server.js
└── client/            React app
    └── src/
        ├── components/  Sidebar, Topbar, tables, badges, charts
        ├── pages/       Dashboard, Alerts, AlertDetails, Events, Assets, Rules
        ├── context/     AuthContext
        └── services/    api.js (axios + JWT interceptor)
Getting started
1. Prerequisites
Node.js 18+
A running MongoDB instance (local mongod, Docker, or MongoDB Atlas)
2. Backend
cd server
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # populates users, assets, rules, and a synthetic
                            # event stream (this also generates real alerts)
npm run dev                # starts the API on http://localhost:5000
Seeded login: admin@forgesoc.local / Password123! (also seeds sami@, ali@, ahmed@, viewer@ — same password)

3. Frontend
cd client
cp .env.example .env       # VITE_API_URL, defaults to http://localhost:5000/api
npm install
npm run dev                 # starts the app on http://localhost:5173
Vite is already configured to proxy /api to localhost:5000 in dev, so the .env step is optional unless you're pointing at a different backend.

4. Re-seed anytime
npm run seed is idempotent for users/assets/rules (it won't duplicate them) but always appends a fresh batch of synthetic events and alerts, so you can re-run it to keep the dashboard lively during a demo.

How detection works (MVP)
Rules live in MongoDB (DetectionRule) as simple declarative conditions:

{
  "ruleCode": "BRUTE_FORCE_001",
  "condition": {
    "eventType": "AUTH",
    "action": "login_failed",
    "thresholdCount": 5,
    "windowMinutes": 5,
    "groupBy": "sourceIp"
  },
  "severity": "HIGH"
}
Every time an event is ingested (POST /api/events), eventProcessor.js hands it to detectionEngine.js, which re-counts matching events within the rule's time window, grouped by the configured field (usually sourceIp or hostname). If the threshold is met, an Alert is created (deduplicated against existing open alerts for the same rule + source). This is intentionally simple, readable rule logic — the plan is to layer ML/anomaly detection on top in a later phase, not replace it.

What's next (per the original roadmap)
Phase 2: Incidents UI, Threat Intelligence (IOC) UI, Reports/export, analyst workload views
Phase 3: Real log ingestion (Wazuh, syslog, Windows Event Forwarding), WebSocket live event streaming, more advanced correlation
Phase 4: AI-assisted alert summarization, anomaly detection, automated incident correlation
Notes on this scaffold
This is a working MVP, not a hardened production build: the /register endpoint is open (no auth) to make bootstrapping easy — lock it down (admin-only) before deploying anywhere real.
JWT_SECRET in .env.example is a placeholder — generate a real random secret before running anywhere other than your own machine.
No automated tests yet; routes were manually verified against the seeded dataset.
