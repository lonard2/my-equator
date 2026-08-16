# MyEquator Engineering & Technical Guides Index

Welcome to the comprehensive technical documentation for **MyEquator** — the internal ERP, CAD vector design studio, and AI operational assistant engineered for **PT Equator Insole Bandung**.

This curriculum is structured into 6 sequential phases, providing complete architectural rationale, mathematical formulas, hardware protocol byte streams, database schemas, code snippets, and reproduction instructions for each module.

---

## 📚 Phase Curriculum & Module Walkthroughs

| Phase | Title | Core Focus & Domain | Link to Detailed Guide |
| :---: | :--- | :--- | :--- |
| **0** | **System Architecture & Standards** | Project topology, industrial context, sizing math, ESC/P hardware codes, domain agent rules (`AGENTS.md`). | [📖 Phase 0 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-0-architecture.md) |
| **1** | **Delivery Orders & ESC/P Print Engine** | Auto-numbering algorithm, size breakdown matrix (EU 36–45), exact 80-column ESC/P print streams, and Keyboard Quick Digitizer. | [📖 Phase 1 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-1-delivery-orders.md) |
| **2** | **Materials Inventory & Khatulistiwa AI** | Raw materials inventory, 3-tier stock health status, atomic stock IN/OUT transactions, OpenRouter tool-calling AI assistant. | [📖 Phase 2 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-2-inventory-and-ai.md) |
| **3** | **Insole CAD Studio & Vector Engine** | Parametric footwear curves, Paris point sizing formulas, orthotic layer geometry (TPU bridge, heel cup), AutoCAD R12 DXF binary writer. | [📖 Phase 3 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-3-insole-cad-studio.md) |
| **4** | **Executive Analytics & UI Engine** | IDR financial revenue trends, footwear size Gaussian bell curve, customer market share donut, DSI burn rate, and Global `⌘K` Palette. | [📖 Phase 4 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-4-analytics-and-ui-engine.md) |
| **5** | **Security (RBAC), Mobile & Resilience** | 4-tier RBAC matrix, PBKDF2 password hashing, dual email/username login, mobile hamburger drawer, crash-proof `@libsql/client`, 1-click JSON backup. | [📖 Phase 5 Guide](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-5-security-and-resilience.md) |

---

## 🏗️ Quick Start & Developer Workflow

### Prerequisites
- Node.js v20+ or latest LTS
- npm or pnpm

### 1. Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/lonard2/my-equator.git
cd my-equator

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### 2. Seed Database with Realistic Factory Data
```bash
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Production Bundle
```bash
npm run build
```

---

## 🔒 Default Test Accounts (RBAC)

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `budi.hartono@equatorinsole.co.id` | `equator2026!` |
| **Factory Manager** | `manager` | `agus.setiawan@equatorinsole.co.id` | `equator2026!` |
| **Warehouse Staff** | `warehouse` | `asep.gudang@equatorinsole.co.id` | `equator2026!` |
| **Sales Operator** | `sales` | `dewi.lestari@equatorinsole.co.id` | `equator2026!` |
