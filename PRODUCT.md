# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Super Admin / Factory Owner:** Strategic oversight, revenue analytics in IDR, user management, audit logs, AI configuration.
- **Factory / Production Manager (Pak Hendra):** Delivery order management, CAD Insole Studio, Material BOM calculations, aggregate daily sizing matrix staging.
- **Warehouse / Inventory Staff (Casey):** Stock IN/OUT tracking, rapid material lookups, delivery dispatch status toggling (`Kirimkan`, `Tiba di Lokasi`), ESC/P continuous form dot-matrix printing.
- **Sales / Front Office Clerk (Jordan / Alex):** Delivery order draft creation, batch physical slip archive digitization, customer directory lookups, print previews.

## Product Purpose
An internal manufacturing and business operations platform combining ERP workflows (Delivery Orders / *Surat Jalan*, Materials Inventory & BOM, Reporting, Dot-Matrix Print Automation), AI-assisted batch paper slip digitization, Insole CAD & Vector Generative Design, and an AI conversational business assistant (*Khatulistiwa AI*).

## Positioning
Tailored directly to the operational, linguistic, and regulatory realities of footwear insole manufacturing in West Java, Indonesia. Features native ESC/P 80-column dot-matrix tractor-feed printing (Epson LX-300 / LX-310), multi-size vector breakdown grids (EU 36–48), formal Indonesian *Terbilang* currency generators, and direct AutoCAD R12 DXF / SVG parametric CAD generation.

## Operating Context
- **Factory Floor & Warehouse Aisles:** Dusty, high-movement industrial environments; mobile-first and tablet interfaces operated with warehouse gloves or quick taps.
- **Front Office & Administration:** Multi-monitor desktop workstations with high-speed keyboard batch entry (`Alt+N`, `Ctrl+S`, `Tab`, `↑/↓`).
- **Printing Stations:** Dedicated legacy continuous tractor-feed dot-matrix printers (Epson LX-310) using 3-ply carbonless paper slips.

## Capabilities and Constraints
- **Footwear Sizing Matrix:** Multi-size breakdown (EU 36–45 standard, EU 46–48 oversized) as the primary data model with automated sum of pairs (`psg`) and IDR calculations.
- **Dual-Mode Printing:** Authentic CRT green monospace ESC/P 80-column binary `.prn` stream generator + high-fidelity HTML printable sheet with 3-party Indonesian signature triad (*Penerima*, *Pengirim / Sopir*, *Hormat Kami / Bagian Gudang*).
- **Parametric CAD Studio:** Mathematical shoe insole curve generation ($L = \text{Size} \times 6.67 - 6.7\text{ mm}$), SVG canvas editing, and CorelDRAW / AutoCAD R12 DXF export.
- **Khatulistiwa AI Assistant:** Multi-model OpenRouter client with fallback hierarchy for natural language form creation and factory queries.
- **Local Resilience:** Zero-configuration SQLite database with Drizzle ORM and 1-click JSON snapshot backup and restore.

## Brand Commitments
- **Name:** `MyEquator` (Company: Equator Insole, Bandung, West Java, Indonesia).
- **Assistant:** *Khatulistiwa AI* (in Indonesian) / *Equator AI* (in English).
- **Brand Palette:** Deep industrial manufacturing crimson `#8B0000` (Dark Red / Red-900) inspired by the Equator Insole brand identity.
- **Voice:** Professional, crisp manufacturing terminology in Indonesian (Bilingual Indonesian/English toggle available).

## Evidence on Hand
- Complete working Next.js App Router codebase (`src/`).
- Verified Delivery Orders module (`src/components/delivery-orders/`) with 39.8/40 usability score and zero detector anti-patterns.
- Full CAD parametric math specifications in `docs/architecture/cad-engine-spec.md`.
- ESC/P dot-matrix printing specifications in `docs/architecture/escp-printer-spec.md`.
- 31 passing unit tests in `tests/`.

## Product Principles
1. **Matrix-First Footwear Ergonomics:** Footwear orders and materials are multi-dimensional size matrices, never isolated numbers.
2. **Factory Hardware Realism:** Respect physical factory infrastructure—dot-matrix continuous forms, thermal barcode scanners, and warehouse tablet touch areas.
3. **High-Assurance Safety:** Prevent errors through proactive constraints, unsaved changes guards (`isDirty`), and non-destructive audited state rollbacks.
4. **Speed & Ergonomic Dual-Paths:** Fast keyboard navigation for desktop power users; large 44px+ hit targets for mobile warehouse crew.

## Accessibility & Inclusion
- WCAG AA compliant contrast ratios across light and dark themes.
- Touch targets $\ge 44\text{px}$ for mobile warehouse operations.
- Full keyboard navigation and ARIA landmarks across all tabular grids and modal workflows.
