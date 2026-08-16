# Technical & Engineering Guide: Phase 0 — Architecture, Planning & Standards

## 1. Executive Summary & Factory Context

**Project:** `MyEquator` (Internal Factory Operations & Footwear CAD Platform)  
**Company:** PT Equator Insole Bandung  
**Location:** Bandung, West Java, Indonesia  
**Domain:** Footwear Insole Manufacturing (EVA Foam, Latex Sheets, PU Systems, Orthotic TPU Shanks, Fabric Laminates, Cutting Dies)  
**Primary Utility:** High-speed delivery order generation with size matrix breakdown (EU 36–45), continuous dot-matrix printer integration (ESC/P 80-column), raw materials inventory & BOM tracking, interactive insole vector CAD generation (SVG & DXF), and bilingual conversational intelligence (Khatulistiwa AI).

---

## 2. System Architecture & Topology

```
+-----------------------------------------------------------------------------------+
|                           Client Layer (Next.js 15 App Router)                    |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | Desktop Master-Detail|  | Tablet Sizing Pad   |  | Mobile Warehouse Mode    |  |
|  | Multi-Pane & DXF Bar |  | Collapsible Drawers |  | Touch Keypad & Quick DO  |  |
|  +----------------------+  +---------------------+  +--------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Server Layer (API Routes & Node.js Runtime)                |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | /api/orders & items  |  | /api/inventory     |  | /api/cad (SVG/DXF Engine)|  |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | /api/analytics Suite |  | /api/security (RBAC)|  | /api/ai/chat (OpenRouter)|  |
|  +----------------------+  +---------------------+  +--------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
+------------------------------------+          +-----------------------------------+
|        Database & Storage          |          |          Hardware & AI            |
|  - SQLite (data/myequator.db)      |          |  - Epson LX-300/310 Dot-Matrix    |
|  - @libsql/client (Crash-Proof)    |          |    (Binary ESC/P 80-col .prn)     |
|  - Drizzle ORM Type-Safe Schema    |          |  - OpenRouter Multi-Model Router  |
|  - 1-Click JSON Snapshot Bundle    |          |  - CorelDRAW & CNC Vector Output  |
+------------------------------------+          +-----------------------------------+
```

---

## 3. Technology Stack & Driver Selection Rationale

| Layer | Selected Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) + React 19 | Server-side rendering, API route colocation, zero external web server setup. |
| **Database** | SQLite via `@libsql/client` & Drizzle ORM | Zero-configuration local file storage (`file:./data/myequator.db`). Pure JS/WASM engine eliminates native Node.js C++ V8 `RemoveEnvironmentCleanupHook` crashes during dynamic development reloads. |
| **Styling** | Modern Vanilla CSS & TailwindCSS v4 | Strict corporate darkred palette (`#8B0000`), zero purple/violet cliché tropes, fluid 3-tier device breakpoints. |
| **Print Engine** | Direct ESC/P Monospace Formatter | Bypasses slow graphical print spooling, driving 9-pin dot-matrix print heads character-by-character on continuous 9.5" x 5.5" carbon paper. |
| **Vector Engine**| Parametric Bézier Engine + `dxf-writer` | Exports AutoCAD R12 DXF files with millimeter precision, directly importable into CorelDRAW 2020+ and CNC laser cutting machines. |
| **AI Gateway** | OpenRouter Client with JSON Tool Schemas | Multi-model fallback hierarchy (Gemini 3.5 Flash Lite default, Gemini 3.7 Flash vision OCR, Qwen 3.7 Plus for Indonesian factory vernacular). |

---

## 4. Indonesian Manufacturing Standards & Localization

### 4.1 Indonesian Currency Formatting (Rupiah)
All monetary values in the database are stored as **integers** (representing the exact Rupiah amount without floating-point errors).
- **Display Format:** `Rp 1.250.000` (period as thousand separator, comma for decimals).
- **Terbilang Helper:** Automatically converts numeric IDR amounts into formal Indonesian words for print receipts (e.g., `Satu Juta Dua Ratus Lima Puluh Ribu Rupiah`).

### 4.2 Surat Jalan Numbering Algorithm
Format: `SJ/EQ/YYYY/MM/XXXX`
```
SJ / EQ / 2026 / 08 / 0042
│    │     │      │     └── 4-digit sequential zero-padded counter
│    │     │      └──────── 2-digit month (01-12)
│    │     └─────────────── 4-digit year
│    └───────────────────── Company code (Equator Insole)
└────────────────────────── Document identifier (Surat Jalan)
```

### 4.3 Standard Size Grid (EU 36–45)
Indonesian footwear manufacturing primarily operates on the European sizing standard (Paris Points):
$$\text{Standard Sizes} = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45]$$
The size breakdown matrix auto-calculates total pairs reactively:
$$\text{Total Pairs} = \sum_{s=36}^{45} \text{Quantity}_s$$

---

## 5. Domain Boundary Rules (`AGENTS.md`)

Each core module contains a dedicated `AGENTS.md` specifying domain rules and constraints:
1. [`src/lib/cad/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/cad/AGENTS.md): Strict millimeter units, parametric Bézier curve math, and AutoCAD R12 layer conventions (`OUTLINE`, `ARCH_SUPPORT`, `HEEL_CUP`, `DIMENSIONS`).
2. [`src/lib/printer/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/printer/AGENTS.md): Strict 80-column monospace boundary, hardware initialization codes (`\x1B\x40`), page length selection (`\x1B\x43\x21`), and Form Feed eject (`\x0C`).
3. [`src/lib/db/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/db/AGENTS.md): Relational foreign keys (`ON DELETE CASCADE` for order items, `ON DELETE RESTRICT` for inventory movements), atomic transactions, and snapshot protocols.
4. [`src/components/delivery-orders/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/AGENTS.md): 5-state lifecycle state machine (`DRAFT` ➔ `CONFIRMED` ➔ `PRINTED` ➔ `DISPATCHED` ➔ `DELIVERED`).
5. [`src/components/inventory/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/inventory/AGENTS.md): 3-tier stock health thresholds (`CRITICAL`, `WARNING`, `HEALTHY`) and movement tracking.

---

## 6. How to Reproduce Phase 0 from Scratch

1. **Initialize Project Directory:**
   ```bash
   mkdir MyEquator && cd MyEquator
   npm init -y
   ```
2. **Install Core Dependencies:**
   ```bash
   npm install next react react-dom drizzle-orm @libsql/client clsx tailwind-merge lucide-react dxf-writer
   npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss postcss drizzle-kit tsx
   ```
3. **Establish Engineering Guidelines:**
   Create [`AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/AGENTS.md) at root and module-specific `AGENTS.md` files in `src/lib/cad/`, `src/lib/printer/`, `src/lib/db/`, `src/lib/ai/`, `src/components/delivery-orders/`, and `src/components/inventory/`.
4. **Define Roadmap in `CHECKLIST.md`:**
   Structure milestones across all 6 phases to ensure transparent, test-driven progression.
