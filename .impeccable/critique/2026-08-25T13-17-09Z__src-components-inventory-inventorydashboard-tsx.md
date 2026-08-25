---
target: the material stock page
total_score: 37.5
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-25T13-17-09Z
slug: src-components-inventory-inventorydashboard-tsx
---
Method: dual-agent (A: b2b8f3fc-8fae-4064-a658-ef2b518004b6 · B: 47daa910-a7b2-49f3-a61c-42b717d551f6)

# Design Critique: Materials & Stock Inventory Module

**Target Component:** `src/components/inventory/InventoryDashboard.tsx` (and related `MaterialFormModal.tsx`, `StockMovementModal.tsx`, `src/lib/inventory/bom.ts`)  
**System Context:** Equator Insole Manufacturing Operations Platform (Phase 2)  
**Location / Domain:** Footwear Insole Raw Materials (Bandung, West Java, Indonesia)

---

## Design Health Score

| # | Heuristic | Score (0–4) | Key Finding & Evidence |
| :--- | :--- | :---: | :--- |
| **1** | **Visibility of System Status** | **3.8** | Real-time 3-state stock health badges (`CRITICAL`, `WARNING`, `HEALTHY`). In `StockMovementModal.tsx`, live stock delta indicator dynamically projects `Current Stock ➔ Projected Stock` in real-time. Critical stock banner alerts warehouse staff when items fall below 50% safety stock. |
| **2** | **Match System / Real World** | **3.9** | Accurate factory floor vernacular (*Pisau Pond*, *Lembar*, *Retur Sisa Produksi*, *Stock Opname*). Standard IDR currency formatted with thousand-separator dots (`Rp 1.250.000`) and physical measurement units (*Lembar*, *Roll*, *Drum*, *Pcs*, *Meter*, *Set*). |
| **3** | **User Control and Freedom** | **3.7** | Proactive `isDirty` unsaved changes tracking in `MaterialFormModal.tsx` with custom in-app discard confirmation modal. In-app deletion modal prevents accidental loss. *(Minor: Lacks 1-click reversal on movement audit logs).* |
| **4** | **Consistency and Standards** | **3.8** | Strict adherence to `DESIGN.md`: `#8B0000` Equator Crimson primary actions, matched-hue status pills, JetBrains Mono tabular numerals (`tabular-nums`), and dual responsive layout tiers (mobile cards vs desktop table). |
| **5** | **Error Prevention** | **3.8** | Form validation disables submit when `OUT_PRODUCTION` exceeds available inventory (`isOutOfStockWarning`). Uppercase SKU code auto-formatting (`sku.toUpperCase()`). Immutable SKU codes in edit mode preserve relational integrity. |
| **6** | **Recognition Rather Than Recall** | **3.9** | 1-click Quick Material Presets (*EVA 4mm 40°*, *Latex 3mm*, *BK Mesh*, *TPU Shank 75mm*). Quick stepper buttons (`+5`, `+10`, `+50`, `+100`) in movement modals and `[500, 1000, 2500]` pairs in the BOM Calculator. |
| **7** | **Flexibility and Efficiency** | **3.5** | Multi-field search (SKU, Name, Location), category pill filters with live counters, and low-stock filter toggle. *(Room for improvement: Global keyboard shortcuts `Alt+N` and `Alt+M` not yet wired into the main dashboard view).* |
| **8** | **Aesthetic and Minimalist Design** | **3.9** | Clean industrial manufacturing aesthetic: crisp 1px borders, calm neutral slate surfaces, selective crimson accents (≤10%), no gratuitous AI gradients or distracting animations. |
| **9** | **Error Recovery** | **3.7** | High-contrast error banners with explicit deficit quantities in Indonesian (*"Stok tidak mencukupi. Stok saat ini 15 Lembar, jumlah keluar 25 Lembar"*) and highlighted shortage callouts in the BOM table. |
| **10** | **Help and Documentation** | **3.5** | Clear microcopy captions under modal headers, realistic placeholder examples (`RAW-EVA-4MM-BLK`, `PO/EQ/2026/08/042`). |
| **Total** | | **37.5 / 40** | **Level 5: Exceptional (Production-Grade Industrial Standard)** |

---

## Design Specificity Verdict

**Verdict:** **High Footwear Manufacturing Specificity (Level 4.8 / 5.0)**

- **LLM Assessment:** The inventory module is deeply authored for footwear insole manufacturing in West Java, completely avoiding generic SaaS inventory tropes. It maps directly to physical factory operations: EVA foam sheet dimensions ($1.2\text{m} \times 2.4\text{m}$) and Shore C hardness (e.g. $40^\circ$), latex rolls in 50m coils, PU chemical drums, TPU torsional arch shanks, fabric laminates (BK mesh & Cambrelle), and *Pisau Pond* cutting dies. The interactive Insole BOM engine calculates exact nesting yield per sheet and verifies raw material sufficiency against active factory stock.
- **Deterministic Scan:** `0` anti-patterns detected across all 3 inventory components (`detect.mjs` returned `[]`).
- **Visual Overlays:** Clean component structure with full dark mode parity, zero AI slop tells (no gradient text, no side tabs, no purple glows, no bounce easings).

---

## Overall Impression
An exceptionally solid, domain-anchored inventory management tool that seamlessly bridges insole CAD production demand (BOM yield calculations) with physical warehouse operations.

---

## What's Working
1. **Interactive Insole Bill of Materials (BOM) Production Engine:**
   Bridges insole CAD models (`EQ-SPORT-01`, `EQ-ARCH-01`, `EQ-CASUAL-02`), batch pair volumes, and live raw material stock sufficiency with 1-click `PO IN` restock shortcuts for deficit items.
2. **Real-Time Bidirectional Stock Projection & Guardrails:**
   `StockMovementModal.tsx` computes projected end stock dynamically and blocks form submission with high-visibility warnings if an operator attempts to overdraw materials.
3. **Dual-Tier Adaptive Floor Ergonomics:**
   Dedicated mobile warehouse card feed with $\ge 44\text{px}$ touch targets and numerical steppers for gloved staff (Casey) paired with high-density tabular view and `tabular-nums` for desktop clerks.

---

## Priority Issues

### [P1] Missing Global Keyboard Shortcuts for High-Speed Stock Clerk Intake
- **Why it matters:** Power users (Alex) processing daily delivery trucks must switch from keyboard to mouse repeatedly to add items or log stock movements.
- **Fix:** Add global `keydown` event listeners (`Alt+N` for Add Material, `Alt+M` for Record Movement, `/` to focus search).
- **Suggested command:** `/impeccable overdrive`

### [P2] Category Filter Pill Scroll Spill on Small Mobile Screens
- **Why it matters:** The 8 category and low-stock filter buttons overflow horizontally without gradient scroll fade indicators on $<380\text{px}$ viewports.
- **Fix:** Apply a smooth CSS edge-fade mask or responsive selector on compact mobile viewports.
- **Suggested command:** `/impeccable layout`

### [P3] Undersized 9px Micro-Text in Movement Type Options
- **Why it matters:** `text-[9px]` in `StockMovementModal.tsx` is below the 11px functional legibility floor, causing eyestrain on warehouse mobile devices under fluorescent lighting.
- **Fix:** Bump microcopy to `text-[10px]` or `text-[11px]` with high contrast.
- **Suggested command:** `/impeccable typeset`

### [P3] Inability to 1-Click Reverse / Void Erroneous Movement Logs
- **Why it matters:** If an operator mistakenly logs an incorrect quantity, they must manually calculate and enter an opposing transaction.
- **Fix:** Add a "Koreksi / Offset" action button in movement history that pre-fills an offsetting transaction referencing the original ID.
- **Suggested command:** `/impeccable harden`

---

## Persona Red Flags

- **Alex (Power User / High-Speed Clerk):** Forced mouse reliance for primary CTAs (`Tambah SKU`, `Catat Mutasi`); lacks keyboard shortcut accelerators.
- **Jordan (First-Timer Operator):** Might hesitate between `OUT_PRODUCTION` and `OUT_WASTAGE` without reading small description captions.
- **Sam (Accessibility / Screen Reader):** Category filter pill buttons lack explicit `aria-pressed` states; search bar lacks dedicated `aria-label`.
- **Casey (Mobile Warehouse Floor Staff):** Movement log reference codes and operator names in mobile view render at `10px` (`text-[10px]`), which is difficult to read under dim warehouse fluorescent lighting.
- **Pak Hendra (Production Manager):** Cannot define and persist new custom insole model BOM recipes directly from the UI without modifying `INSOLE_BOM_PRESETS` in code.

---

## Minor Observations
- Desktop table column headers could benefit from sort toggles (`Current Stock` $\uparrow\downarrow$, `Valuation` $\uparrow\downarrow$).
- Numeric inputs in `StockMovementModal.tsx` should include `inputMode="numeric"` for mobile keypad triggering.
- Total valuation KPI card uses `truncate`, which could clip 9-digit IDR numbers on very compact displays.
- Toast notifications are hardcoded to 3 seconds; a manual dismiss button would improve accessibility.

---

## Questions to Consider
1. **Active Order BOM Synchronization:**  
   *Can the BOM Calculator automatically aggregate material demand from all active Delivery Orders in "CONFIRMED" status to show the factory's net material surplus/deficit for the entire upcoming production week?*
2. **Warehouse Opname Rapid Scan Mode:**  
   *Could Casey toggle a full-screen "Stock Opname Mode" on mobile that displays large $\ge 64\text{px}$ numerical keypad buttons and camera barcode scanning for rapid bin-by-bin verification?*
3. **Physical Pallet & Bin QR Label Printing:**  
   *Can we add a 1-click thermal barcode/QR label generator to each material SKU card for printing and sticking directly onto raw EVA sheet racks and latex roll storage bays?*
