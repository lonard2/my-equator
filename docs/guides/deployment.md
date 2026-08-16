# Deployment & Operations Guide — MyEquator

## 1. Overview
`MyEquator` is designed to operate seamlessly in two target deployment environments:
1. **Local Factory Server / Shop Floor Terminal:** On-premise mini PC / workstation with direct SQLite storage and USB/Serial connected dot-matrix printers.
2. **Cloud Hybrid Deployment:** Cloud VPS / containerized deployment with automated offline backup syncing.

---

## 2. Local Factory Floor Deployment (On-Premise)

### Prerequisites
- Node.js v20.x or higher
- Git
- Modern web browser (Chrome / Edge / Firefox)

### Steps
1. **Clone repository:**
   ```bash
   git clone <repository_url> MyEquator
   cd MyEquator
   ```
2. **Environment Configuration:**
   Create `.env.local` containing your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   PORT=3000
   ```
3. **Install Dependencies & Build:**
   ```bash
   npm install
   npm run build
   ```
4. **Start Production Service:**
   ```bash
   npm run start
   ```
5. **Autostart on Boot (Factory Terminals):**
   Use `pm2` to ensure continuous operation across factory restarts:
   ```bash
   npm install -g pm2
   pm2 start npm --name "myequator" -- run start
   pm2 save
   pm2 startup
   ```

---

## 3. Database Backup & Disaster Recovery
- SQLite database is located at `data/myequator.db`.
- Daily automatic JSON snapshots can be triggered via the UI or scripted via Node.js backup helper:
  ```bash
  npm run db:snapshot
  ```
- To restore in an emergency, use the UI Snapshot Import or run `npm run db:restore -- snapshot-YYYY-MM-DD.json`.
