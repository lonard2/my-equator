# AGENTS.md — MyEquator Engineering & Agent Guidelines

## 1. Project Overview & Operational Context

**Project Name:** `MyEquator`  
**Company:** Equator Insole  
**Location:** Bandung, West Java, Indonesia  
**Industry:** Footwear Insole Manufacturing (EVA foam, Latex, PU, Orthotics, Fabric Laminates, TPU Components)  
**Primary Purpose:** Internal factory and business operations platform combining ERP features (Delivery Orders / Surat Jalan, Materials Inventory, Reporting, Dot-Matrix Print Automation), AI-assisted digitization, Insole CAD and Vector Design Generation, and an AI conversational business assistant.  
**Current Working Point:** Phase 0 (Planning, Architecture, and Design Standards completed; transitioning to Phase 1).

---

## 2. Core Functional Modules

```
+-----------------------------------------------------------------------------------+
|                                    MyEquator                                      |
+-----------------------------------------------------------------------------------+
|  1. Delivery Orders (Surat Jalan)  |  2. Archive & Paper Quick Digitizer           |
|     - Size breakdown matrix (36-45)|     - Keyboard-first batch entry grid        |
|     - Live editable print preview  |     - AI Vision / OCR form staging           |
|     - Monthly reporting & export   |     - Mobile camera direct photo capture     |
+------------------------------------+----------------------------------------------+
|  3. Materials & Stock Inventory    |  4. Insole CAD & Generative Design Studio    |
|     - EVA sheets, latex, TPU shanks|     - Parametric shoe insole curve generator |
|     - BOM (Bill of Materials)      |     - Interactive SVG/Canvas vector editor   |
|     - Low-stock & movement logs    |     - CorelDRAW compatible (SVG / DXF / PDF) |
+------------------------------------+----------------------------------------------+
|  5. Khatulistiwa AI Assistant      |  6. Executive Business Dashboard             |
|     - Natural language form builder|     - Revenue (IDR) & order analytics        |
|     - OpenRouter multi-model router|     - Material burn rate & capacity forecast |
|     - Context-aware factory query  |     - Mobile & desktop responsive view       |
|                                    |     - Dynamic chart visualizer               |
+------------------------------------+----------------------------------------------+
|                    7. Security & Role-Based Access Control (RBAC)                 |
|       Super Admin | Factory Manager | Warehouse/Inventory | Sales Operator        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Architecture & Directory Layout

### 3.1 Tech Stack Standard
- **Runtime & Language:** Node.js (v20+ or latest) / TypeScript (Strict mode enabled).
- **Frontend / Fullstack Framework:** Next.js (App Router) / React / Modern Responsive CSS Architecture & TailwindCSS (Latest version).
- **Mobile & Device Optimization:** Adaptive responsive architecture supporting three distinct device experience tiers:
  1. *Desktop View:* Multi-pane Master-Detail navigation with live split-screen print previews and advanced vector toolbars.
  2. *Tablet View:* Touch-optimized sizing pads, collapsible side drawers, and responsive CAD canvas manipulation.
  3. *Mobile View:* Streamlined warehouse inspection mode, quick status toggling, and camera OCR intake.
- **Database & ORM:** SQLite with Drizzle ORM for local factory zero-configuration resilience, strong TypeScript typing, and 1-click JSON snapshot backup/restore.
- **Vector & CAD Processing:** Native Parametric SVG and Canvas vector engine + `dxf-writer` for exact millimeter precision and AutoCAD / CorelDRAW R12 DXF compatibility.
- **Print Engine:** Dual-mode printer pipeline:
  1. Live Monospace 80-Column ESC/P text preview with direct binary `.prn` stream generator for Epson LX-300 / LX-310 / LQ-310 continuous form dot-matrix printers.
  2. High-fidelity HTML/CSS Printable Sheet with interactive in-place editing for standard laser/inkjet printing.
- **AI Gateway:** OpenRouter API Client with multi-model fallback, JSON schema structured tool calling, and prompt caching.

### 3.2 Directory Structure
```
MyEquator/
├── .agents/                          # Global agent configuration & skills
├── docs/                             # System documentation & specifications
│   ├── architecture/                 # System topology, CAD math & printer specs
│   │   ├── system-overview.md
│   │   ├── cad-engine-spec.md
│   │   └── escp-printer-spec.md
│   ├── guides/                       # Operational guides
│   │   ├── deployment.md
│   │   └── printer-setup.md
│   ├── walkthroughs/                 # Step-by-step developer tutorials per phase
│   │   ├── phase-0-architecture.md
│   │   └── phase-1-delivery-orders.md (upcoming)
│   └── lesson_learned.md             # Architectural trade-offs & design reviews
├── public/                           # Static assets, factory presets, insole profiles
│   └── presets/                      # Standard insole sizing curves (EU 35-46)
├── scripts/                          # Database migrations, seed scripts, print testing
├── src/
│   ├── components/                   # Reusable UI components (Adaptive responsive)
│   │   ├── assistant/                # Khatulistiwa AI chat & floating action drawer
│   │   ├── common/                   # Navigation shell, device preview toggle, theme picker
│   │   ├── dashboard/                # IDR revenue charts, bell curves, donuts, heatmaps
│   │   ├── delivery-orders/          # DO forms, size matrix, print triggers, digitizer
│   │   │   └── AGENTS.md             # Delivery order module rules & constraints
│   │   ├── design-studio/            # Vector canvas, layer stack, curve controls
│   │   ├── inventory/                # Stock tables, movement modal, alert badges
│   │   │   └── AGENTS.md             # Inventory module rules & constraints
│   │   └── print/                    # Dot-matrix raw preview & HTML print sheets
│   ├── lib/
│   │   ├── ai/                       # OpenRouter client, model registry, tool calls
│   │   │   └── AGENTS.md             # AI gateway rules & fallback hierarchy
│   │   ├── auth/                     # RBAC rules, session management, password hashing
│   │   ├── cad/                      # Insole parametric math, SVG/DXF generator
│   │   │   └── AGENTS.md             # CAD domain rules & curve formulas
│   │   ├── db/                       # Drizzle schema definitions, migrations, queries
│   │   │   └── AGENTS.md             # Database schema rules & snapshot protocols
│   │   ├── printer/                  # ESC/P dot-matrix formatter, 80-col PRN generator
│   │   │   └── AGENTS.md             # ESC/P control code specifications
│   │   └── utils/                    # IDR currency, Terbilang, date formatting
│   ├── services/                     # Business logic (orders, inventory, reports)
│   ├── styles/                       # Global styles, typography tokens, print stylesheets
│   └── types/                        # Shared TypeScript interfaces & types
├── templates/                        # ESC/P print templates & printable HTML templates
├── AGENTS.md                         # System guidelines & agent rules (this document)
├── CHECKLIST.md                      # Master task roadmap & milestone tracker
└── package.json                      # Project dependencies and run scripts
```

---

## 4. OpenRouter AI Configuration & Model Roster

All AI features connect through OpenRouter using the API key defined in `.env` (`OPENROUTER_API_KEY`).

### 4.1 Supported Model Registry

| Model Identifier | Primary Role / Capability | Priority / Use Case |
| :--- | :--- | :--- |
| `google/gemini-3.5-flash-lite` | **Default Agent Engine** — Fast, low-latency, economical | Daily chat, quick form extraction, short summaries |
| `google/gemini-3.7-flash` | **Multimodal & Heavy Extraction** | Paper form OCR parsing from mobile camera, complex logic |
| `deepseek/deepseek-v4-pro-0813` | **Deep Analytics & Logic** | SQL query generation, inventory reconciliation logic |
| `qwen/qwen3.7-plus` | **Bilingual Indonesian/Sundanese/English** | Indonesian factory slang, local terminology, customer notes |
| `openai/gpt-5.6-luna` | **Generative Design & Creative CAD** | Insole tread patterns, ergonomic contour suggestions |
| `google/gemma-4-26b-a4b-it` | **Open-Weights Fallback** | General NLP processing, offline-ready tasks |

### 4.2 Assistant Name: **Khatulistiwa AI** (in Indonesian) or **Equator AI** (in English)
- **Role:** Factory intelligence assistant.
- **Capabilities:**
  1. *Form Generation via Chat:* Parse natural language statements into validated draft delivery orders.
  2. *Inventory Lookups:* Real-time checks on raw material stocks.
  3. *Business Insights:* Instant calculations of monthly revenue and top buyers.

---

## 5. Indonesian Manufacturing & Localization Standards

1. **Currency & Numbers:**
   - Always format currency in Indonesian Rupiah: `Rp 1.250.000` (dots as thousand separators, comma for decimals).
   - Use Indonesian *Terbilang* helper for formal invoices and receipts (e.g., `Satu Juta Dua Ratus Lima Puluh Ribu Rupiah`).

2. **Surat Jalan / Delivery Order Standards:**
   - Standard Numbering Scheme: `SJ/EQ/YYYY/MM/XXXX`.
   - Standard Size Grid: Footwear size range (EU 36–45 selectable up to EU 48) with auto-sum total pairs (*pasang / psg*).
   - Standard Signature Triad: **Penerima**, **Pengirim / Sopir**, **Hormat Kami / Bagian Gudang**.

3. **Dot-Matrix Printing (ESC/P 80-Column Standard):**
   - Standard continuous form paper: 9.5" x 11" (full page) or 9.5" x 5.5" (half page / slip).
   - Direct ASCII/ESC-P control codes:
     - Initialize Printer: `\x1B\x40`
     - Condensed Font (137 columns): `\x0F`
     - Cancel Condensed (80 columns): `\x12`
     - Page Length Selection: `\x1B\x43\x21` (33 lines for half page)
     - Form Feed / Eject: `\x0C`

4. **Insole CAD Specifications:**
   - Coordinate Unit: Millimeters (mm).
   - Standard Length Formula: $L = \text{Size} \times 6.67 - 6.7\text{ mm}$ (e.g., EU 40 = 260.1 mm).
   - Export Formats: Scalable Vector Graphics (SVG) and AutoCAD R12 DXF (compatible with CorelDRAW 2020+, AutoCAD, and CNC cutting tables).

---

## 6. Mobile & Cross-Device Factory Floor Capabilities

1. **Mobile Warehouse Operations:**
   - Stock opname and rapid inventory lookup directly in warehouse aisles via mobile phones.
   - Delivery status dispatch toggle (*Dispatched*, *Delivered*) by drivers or warehouse crew.
2. **Mobile Camera OCR Digitizer:**
   - Warehouse and front-office staff can capture photos of physical paper delivery slips directly via smartphone camera to feed the AI OCR parser.
3. **Adaptive UI Layouts:**
   - Responsive layout tiers for Desktop, Tablet, and Mobile with dedicated device simulation preview toggle in the navigation shell.
   - Touch-friendly size breakdown matrix inputs with numerical keypad trigger (`inputmode="numeric"`).
   - Responsive charts and KPI summaries for executive oversight.

---

## 7. Security & Role-Based Access Control (RBAC)

| Role | Access Permissions |
| :--- | :--- |
| **Super Admin / Owner** | Full system access, user management, audit logs, financial revenue dashboards, AI configuration. |
| **Factory / Production Manager** | Delivery order CRUD, Monthly reports, CAD Insole Studio, Material BOM calculations, Inventory management. |
| **Warehouse / Inventory Staff** | Delivery order status dispatch, Inventory stock IN/OUT, Material intake records, Dot-matrix print execution. |
| **Sales / Front Operator** | Delivery order draft creation, Quick paper form digitizer, Customer directory access, Print preview. |

---

## 8. Educational Walkthroughs & Coding Standards for User Learning

To ensure complete understanding and learning throughout the development journey:
1. **Module Walkthrough Documents:** Create step-by-step educational documentation in `docs/walkthroughs/` to teach users how to build the same or similar application. Maintained per phase from the beginning.
2. **Architecture & Design Documents:** Provide architecture diagrams, CAD math specifications, and printer protocols in `docs/architecture/`.
3. **In-Code Documentation:** Include detailed technical comments on complex business logic (e.g., size matrix summation, currency parsing, ESC/P stream construction, SVG-to-DXF matrix math).
4. **Code Modularity:** Keep components focused and under 300 lines where practical. Maintain strict TypeScript definitions in `src/types/`.
5. **Lesson Learned Document:** Provide [`docs/lesson_learned.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/lesson_learned.md) capturing architectural trade-offs, advantages, and limitations.

---

## 9. Visual Designs & Theme Engine

1. **Desktop-First & Adaptive Tiers:** Primary workflow optimized for computer workstations, with tailored tablet touch views and mobile warehouse interfaces.
2. **Professional Manufacturing Aesthetic:** Deep corporate palette avoiding generic AI tropes. Brand theme built around `darkred` / `red` based on the Equator Insole logo.
3. **Theme Customization & Dark/Light Mode:** Seamless toggle between Light and Dark mode with customizable UI density (`Compact`, `Normal`, `Large`) and layout width (`Fluid`, `Boxed`).
4. **Bilingual Localization:** Instant real-time language switcher between Bahasa Indonesia (`ID`) and English (`EN`).

---

## 10. Coding Notes & Standards

1. Maintain active codebase hygiene without placeholder stubs.
2. Avoid using emoji in production code or artificial AI quirks.
3. Provide comprehensive testing across unit, UI, and integration layers.
4. Always diagnose issues with concrete evidence before applying fixes.
5. Use the latest stable versions of libraries and frameworks.
6. Avoid overengineering; prioritize simple, robust implementations.
7. Maintain a concise and informative `README.md`.