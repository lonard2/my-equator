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

### 2.2 Vector CAD Architecture: Native Parametric Math vs Canvas Framework (Fabric.js)
- **Decision:** Native SVG and Canvas mathematical model with Catmull-Rom spline interpolation through 14 anatomical landmark points and AutoCAD R12 DXF output.
- **Advantages:**
  - Zero dependency bloat and direct React state integration.
  - Millimeter-accurate anatomical curve generation matching true footwear lasts with authentic medial instep indentation, 1st MPJ flare, and great toe apex.
  - CorelDRAW 2020+ and CNC laser cutting compatibility.
- **Trade-Offs & Limitations:**
  - Custom geometric clipping needed when complex boolean union operations between overlapping orthotic components are required.

### 2.3 Printing Pipeline: Raw ESC/P Binary Streams vs Generic HTML Printing
- **Decision:** Dual-output pipeline supporting both raw ESC/P byte streams (`.prn`) and high-fidelity CSS print sheets.
- **Advantages:**
  - Ultra-fast native dot-matrix printing on continuous tractor paper without browser print dialog lag.
  - Perfect alignment for pre-printed multi-ply carbonized delivery slips.
- **Trade-Offs & Limitations:**
  - Raw `.prn` streaming to local hardware requires either direct download, local CLI spooling (`copy /b` or `lp`), or WebUSB/Serial browser permissions.

### 2.4 Authentication & Security: 4-Tier Factory RBAC & Encapsulated JSON Snapshots
- **Decision:** Salted PBKDF2 password hashing (10,000 iterations SHA-512) with 4 factory role definitions (`SUPER_ADMIN`, `FACTORY_MANAGER`, `WAREHOUSE_STAFF`, `SALES_OPERATOR`) and 1-click offline database snapshot backup/restore.
- **Advantages:**
  - Strict authorization guarantees that warehouse staff cannot alter financial pricing, and front-desk operators cannot modify master CAD geometries.
  - Full relational offline database backup in human-readable, schema-versioned JSON format allows disaster recovery in under 5 seconds.
  - Immutable audit logs capture every critical operational mutation.
- **Trade-Offs & Limitations:**
  - Single-machine deployment uses local sessions; enterprise multi-branch expansion can layer OAuth2 / SAML SSO seamlessly on top of the established `UserRole` interface.

---

## 3. Key Strengths of the Architecture
1. **Domain-Driven Boundary Isolation:** Sub-directory `AGENTS.md` files prevent context mixing between CAD math, printer protocols, and ERP business logic.
2. **Adaptive Multi-Device Tiers:** Tailored interfaces for Desktop (master-detail & CAD), Tablet (touch matrix & full-width toggle), and Mobile (warehouse inspection & OCR camera) ensure maximum ergonomic fit for every factory role.
3. **Indonesian Manufacturing Localization:** Built-in support for IDR currency, *Terbilang* number-to-words, Indonesian shoe sizing standards, and local factory terminology.
