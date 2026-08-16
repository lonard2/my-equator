# Architecture Retrospective & Lessons Learned — MyEquator

## 1. Project Context
**MyEquator** was designed to solve real-world operational challenges in an Indonesian footwear manufacturing factory (Equator Insole, Bandung). This document records architectural decisions, their advantages, limitations, and key insights for future development.

---

## 2. Technical Decisions & Trade-Offs

### 2.1 Database Selection: SQLite + Drizzle ORM vs Centralized Cloud PostgreSQL
- **Decision:** SQLite with Drizzle ORM as the primary local database, coupled with a 1-click JSON snapshot export/restore pipeline.
- **Advantages:**
  - Zero-configuration local setup; no database daemon crashes or connection pool overhead.
  - Complete offline immunity on the factory floor during internet outages.
  - Drizzle ORM provides direct TypeScript type-safety without heavy binary generator steps.
- **Trade-Offs & Limitations:**
  - Multi-workstation concurrency requires local network file sharing or eventual cloud sync if multiple concurrent write terminals are introduced in the future.

### 2.2 Vector CAD Architecture: Native Parametric Math vs Canvas Canvas Framework (Fabric.js)
- **Decision:** Native SVG and Canvas mathematical model with `dxf-writer` for DXF generation.
- **Advantages:**
  - Zero dependency bloat and direct React state integration.
  - Millimeter-accurate Bézier curve generation with deterministic output.
  - Lightweight file export matching AutoCAD R12 specifications for CorelDRAW 2020+.
- **Trade-Offs & Limitations:**
  - Freeform complex polygon boolean operations (e.g. subtracting holes) must be written as custom geometric clipping functions.

### 2.3 Printing Pipeline: Raw ESC/P Binary Streams vs Generic HTML Printing
- **Decision:** Dual-output pipeline supporting both raw ESC/P byte streams (`.prn`) and high-fidelity CSS print sheets.
- **Advantages:**
  - Ultra-fast native dot-matrix printing on continuous tractor paper without browser print dialog lag.
  - Perfect alignment for pre-printed multi-ply carbonized slips.
- **Trade-Offs & Limitations:**
  - Raw `.prn` streaming to local hardware requires either direct download, local CLI spooling (`copy /b` or `lp`), or WebUSB/Serial browser permissions.

---

## 3. Key Strengths of the Architecture
1. **Domain-Driven Boundary Isolation:** Sub-directory `AGENTS.md` files prevent context mixing between CAD math, printer protocols, and ERP business logic.
2. **Adaptive Multi-Device Tiers:** Tailored interfaces for Desktop (master-detail & CAD), Tablet (touch matrix), and Mobile (warehouse & OCR camera) ensure maximum ergonomic fit for every factory role.
3. **Indonesian Manufacturing Localization:** Built-in support for IDR currency, *Terbilang* number-to-words, Indonesian shoe sizing standards, and local factory terminology.
