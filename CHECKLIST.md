# Master Task Roadmap & Milestone Tracker — MyEquator

**Project Name:** `MyEquator` (Internal Factory & Insole Manufacturing ERP)  
**Company:** Equator Insole, Bandung, Indonesia  
**Last Updated:** August 16, 2026

---

## Milestone Summary

- [x] **Phase 0: Project Planning, Architecture & Design Standards** (Completed)
- [ ] **Phase 1: Core Foundation, Layout Shell & Delivery Orders MVP** (Pending)
- [ ] **Phase 2: Materials Inventory & Khatulistiwa AI Assistant** (Pending)
- [ ] **Phase 3: Insole CAD Studio & Generative Vector Design** (Pending)
- [ ] **Phase 4: Visual Analytics Suite & Instant UI Preference Engine** (Pending)
- [ ] **Phase 5: Factory Security, RBAC Lockdown, Audit Trails & Offline Resiliency** (Pending)

---

## Detailed Milestone Checklist

### Phase 0: Project Planning, Architecture & Design Standards
- [x] Comprehensive requirements analysis and technical stack confirmation.
- [x] Root guidelines ([`AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/AGENTS.md)) and master roadmap ([`CHECKLIST.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/CHECKLIST.md)) update.
- [x] Sub-directory domain agent rules creation:
  - [`src/lib/cad/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/cad/AGENTS.md) (Parametric curve math & DXF export constraints)
  - [`src/lib/printer/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/printer/AGENTS.md) (ESC/P 80-column binary generator specifications)
  - [`src/lib/ai/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/ai/AGENTS.md) (OpenRouter multi-model router & JSON schema tool calling)
  - [`src/lib/db/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/db/AGENTS.md) (Drizzle ORM + SQLite schema rules & offline snapshot protocols)
  - [`src/components/delivery-orders/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/AGENTS.md) (Surat Jalan lifecycle & size matrix auto-sum)
  - [`src/components/inventory/AGENTS.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/inventory/AGENTS.md) (Material SKU tracking & stock safety threshold triggers)
- [x] Architectural specifications in `docs/architecture/`:
  - [`docs/architecture/system-overview.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/architecture/system-overview.md)
  - [`docs/architecture/cad-engine-spec.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/architecture/cad-engine-spec.md)
  - [`docs/architecture/escp-printer-spec.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/architecture/escp-printer-spec.md)
- [x] Operational guides in `docs/guides/`:
  - [`docs/guides/deployment.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/guides/deployment.md)
  - [`docs/guides/printer-setup.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/guides/printer-setup.md)
- [x] Phase 0 Educational Walkthrough ([`docs/walkthroughs/phase-0-architecture.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-0-architecture.md)).
- [x] Project architectural reflection and trade-off review ([`docs/lesson_learned.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/lesson_learned.md)).

---

### Phase 1: Core Foundation, Layout Shell & Delivery Orders MVP
- [ ] Initialize Next.js 15+ App Router project with TypeScript, TailwindCSS v4, and Lucide icons.
- [ ] Setup Drizzle ORM with SQLite database and migration pipeline.
- [ ] Build adaptive navigation shell with Desktop multi-pane layout, Tablet drawer, and Mobile warehouse bar + Device simulation mode toggle.
- [ ] Implement Delivery Order database schema with standard numbering `SJ/EQ/YYYY/MM/XXXX`.
- [ ] Size breakdown matrix component (EU 36–45) with reactive pair auto-summation.
- [ ] Delivery Order lifecycle state machine: `DRAFT` -> `CONFIRMED` -> `PRINTED` -> `DISPATCHED` -> `DELIVERED`.
- [ ] Dual print pipeline:
  - Live 80-column ESC/P monospace preview and binary `.prn` export for Epson LX-300 / LX-310.
  - CSS `@media print` formatted printable delivery slip.
- [ ] Archive Quick Digitizer keyboard-first batch entry grid with Tab/Enter rapid navigation.
- [ ] Monthly aggregation reporting table with CSV export.
- [ ] Phase 1 test suite and educational walkthrough ([`docs/walkthroughs/phase-1-delivery-orders.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-1-delivery-orders.md)).

---

### Phase 2: Materials Inventory & Khatulistiwa AI Assistant
- [ ] Materials database schema and full CRUD interface (EVA sheets, Latex rolls, PU chemical drums, TPU shanks, fabrics).
- [ ] Dynamic stock safety threshold editing per SKU with status indicators (`OK`, `Low Stock`, `Critical`).
- [ ] Stock movement recording modal (IN / OUT / Adjustment / Wastage) with transaction audit trail.
- [ ] Category allocation breakdown chart and warehouse stock health visualizer.
- [ ] OpenRouter AI client setup supporting multi-model roster (`google/gemini-3.5-flash-lite`, `google/gemini-3.7-flash`, `deepseek/deepseek-v4-pro-0813`, `qwen/qwen3.7-plus`).
- [ ] Khatulistiwa AI conversational workspace drawer with natural language Delivery Order drafting and live staging action.
- [ ] AI real-time inventory query tools and factory calculation aids.
- [ ] Phase 2 test suite and educational walkthrough ([`docs/walkthroughs/phase-2-inventory-and-ai.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-2-inventory-and-ai.md)).

---

### Phase 3: Insole CAD Studio & Generative Vector Design
- [ ] Parametric shoe insole curve generation mathematical model:
  - Base length: $L = \text{Size} \times 6.67 - 6.7\text{ mm}$
  - Ball width, heel width, and medial/lateral arch contour Bézier equations.
- [ ] Interactive SVG and Canvas vector editor with real-time millimeter dimension readout.
- [ ] Custom insole profile creation from blank canvas with add/edit control points.
- [ ] OpenRouter Prompt-to-CAD generator converting natural language descriptions into parametric CAD contours.
- [ ] Persistent blueprint preset library to save, load, and duplicate insole models.
- [ ] Vector export engine generating standard SVG and AutoCAD R12 / CorelDRAW compatible DXF files.
- [ ] Phase 3 test suite and educational walkthrough ([`docs/walkthroughs/phase-3-insole-cad-studio.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-3-insole-cad-studio.md)).

---

### Phase 4: Visual Analytics Suite & Instant UI Preference Engine
- [ ] Monthly Revenue & Volume Line/Area trend charts with IDR formatting.
- [ ] Footwear Size Breakdown Bell Curve chart (EU 36–45 distribution).
- [ ] Customer Market Share Donut chart.
- [ ] Raw material burn-rate forecast and stock health heatmaps.
- [ ] Instant UI Settings Engine:
  - Font size scaling (`Compact`, `Normal`, `Large`).
  - Layout width toggling (`Fluid`, `Boxed`).
  - Dark / Light mode theme toggling with `darkred` / `red` brand palette.
- [ ] Instant Bilingual Language Switcher (`ID` / `EN`).
- [ ] Global Command Palette (`⌘K` / `Ctrl+K`) for rapid navigation and actions.
- [ ] Phase 4 test suite and educational walkthrough ([`docs/walkthroughs/phase-4-analytics-and-ui-engine.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/walkthroughs/phase-4-analytics-and-ui-engine.md)).

---

### Phase 5: Factory Security, RBAC Lockdown, Audit Trails & Offline Resiliency
- [ ] Factory user authentication with 4 roles (Super Admin, Production Manager, Warehouse Staff, Sales Operator).
- [ ] Strict RBAC permission verification helpers (`hasPermission`).
- [ ] Persistent factory audit trail logger with filterable activity timeline.
- [ ] 1-Click offline database snapshot export and restore utility (`.json`).
- [ ] End-to-end integration test validation across all modules.
- [ ] Complete project documentation audit, Phase 5 walkthrough, and finalized [`docs/lesson_learned.md`](file:///Users/lonard/Desktop/MyEquator-seconditer/docs/lesson_learned.md).
