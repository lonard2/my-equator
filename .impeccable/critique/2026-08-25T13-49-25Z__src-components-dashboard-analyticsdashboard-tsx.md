---
target: src/components/dashboard/AnalyticsDashboard.tsx
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-25T13-49-25Z
slug: src-components-dashboard-analyticsdashboard-tsx
---
# Executive Visual Analytics & Factory Dashboard Critique

**Surface:** `src/components/dashboard/AnalyticsDashboard.tsx` & Dashboard Subsystem  
**Method:** dual-agent (A: 70139210-adf6-4736-be88-e999e15bf8d0 · B: 5756a0b3-2c94-445e-bb97-35d8f04bb5d4)  
**Operating Context:** Equator Insole Manufacturing, Bandung, West Java  

---

## 1. Design Health Score

| # | Heuristic | Score | Key Finding |
|---|-----------|:-----:|-------------|
| 1 | Visibility of System Status | 3 / 4 | Clean loading spinner and active metric toggles, but period filter tabs (`30D`, `Q`, `YTD`, `ALL`) do not filter data. |
| 2 | Match System / Real World | 4 / 4 | Benchmark manufacturing terms (*Total Omzet IDR*, *Pasang*, *Surat Jalan*, *Kurva Ukuran*, *DSI*, *Pangsa Pasar Mitra*). |
| 3 | User Control and Freedom | 2 / 4 | Dual Revenue/Volume view and CSV export exist, but charts lack interactive drill-down into filtered order lists. |
| 4 | Consistency and Standards | 3 / 4 | Unified card radiuses and crimson `#8B0000` tokens, but size bell curve stops at EU 46 instead of full EU 48 range. |
| 5 | Error Prevention | 3 / 4 | Safe division denominators prevent NaN crashes, but API fetch failures fail silently without retry UI. |
| 6 | Recognition Rather Than Recall | 3 / 4 | Semantic icons and direct percentage callouts, but material burn rate progress bars lack a labeled benchmark scale. |
| 7 | Flexibility and Efficiency | 3 / 4 | Dual-mode SVG toggles and responsive layout, but SVG interactive markers lack keyboard focus and ARIA attributes. |
| 8 | Aesthetic and Minimalist Design | 3 / 4 | Restrained dark slate and crimson palette, but peak flame badge uses distracting `animate-bounce`. |
| 9 | Error Recovery | 2 / 4 | Zero-data empty states exist, but failed API requests leave undefined KPIs without an in-component retry button. |
| 10 | Help and Documentation | 3 / 4 | Explanatory sub-captions on each chart, but lacks contextual tooltip defining how DSI (Days of Supply) is calculated. |
| **Total** | | **29 / 40** | **Good Industrial Foundation / Polish & Hardening Required (72.5%)** |

---

## 2. Design Specificity Verdict

**LLM Assessment:**  
The visual analytics suite is authored specifically for Equator Insole's factory floor in Bandung, West Java. It features true shoe size Gaussian bell curve distributions (EU 35–46) to identify injection mold and die tooling congestion, raw material Days of Supply (DSI) runway tracking for EVA foam, latex rolls, and TPU shanks, Indonesian Rupiah currency formatting with thousand-separator dots, and custom zero-dependency SVG geometry.

**Deterministic Scan:**  
`detect.mjs` identified 1 true positive issue:
- `bounce-easing` on `SizeBellCurveChart.tsx:69`: `<Flame className="... animate-bounce" />`. The endless vertical bouncing oscillation introduces visual distraction in a serious executive dashboard and violates calm status token guidelines in `DESIGN.md`.

---

## 3. Overall Impression

The Visual Analytics Dashboard has an excellent, authentic manufacturing foundation with zero external charting library bloat. Its custom parametric SVG charts are fast and responsive. However, it currently suffers from a few key gaps: the top period filter tabs are cosmetic only, network fetch failures lack a user-facing retry mechanism, the size curve stops at EU 46, and the peak badge has a distracting bounce animation.

---

## 4. What's Working Well

1. **Zero-Dependency Parametric SVG Charting:** Custom React SVG geometry with coordinate scaling, linear area gradients, and responsive viewports, completely avoiding heavy third-party charting libraries.
2. **Manufacturing-Native Size Bell Curve:** Aggregates multi-size order JSON matrices into a Gaussian bell curve, automatically highlighting peak press tooling allocation.
3. **Material Runaway & DSI Health Heatmap:** Translates raw stock levels into actionable "Days of Supply" with urgent color-coded triage bands.

---

## 5. Priority Issues (P0–P3)

- **[P1] Connect Period Filter Tabs to Live Analytics Query / Filtering:**
  - *Why it matters:* Executive users (Alex) clicking "Kuartal" or "30H" expect time-filtered revenue figures; cosmetic-only filters erode trust.
  - *Fix:* Pass `period` to `/api/analytics` or apply dynamic client-side date range filtering across revenue trends, volume, and customer share.
  - *Suggested Command:* `/impeccable harden`

- **[P1] Network Error Recovery Banner with "Coba Lagi" Button:**
  - *Why it matters:* Silent failures leave blank charts when network interruptions occur.
  - *Fix:* Add dedicated error state with a clear banner and retry CTA.
  - *Suggested Command:* `/impeccable harden`

- **[P2] Expand Sizing Range to EU 48 & Add Keyboard/ARIA Chart Navigation:**
  - *Why it matters:* Oversized footwear sizes (EU 47–48) are omitted, and keyboard/screen-reader users cannot inspect chart data points.
  - *Fix:* Expand sizing aggregation to EU 35–48 and add `tabIndex={0}`, `role="button"`, and descriptive `aria-label` tags to SVG data nodes.
  - *Suggested Command:* `/impeccable adapt`

- **[P2] Remove `animate-bounce` on Peak Flame Badge & Add Heatmap Scale:**
  - *Why it matters:* Bouncing animations distract from executive review; material progress bars lack a reference baseline.
  - *Fix:* Replace `animate-bounce` with a calm static badge and add a "Skala 60 Hari" reference marker.
  - *Suggested Command:* `/impeccable quieter`

- **[P3] Expand 1-Click CSV Export Scope:**
  - *Why it matters:* CSV export currently omits customer market share and material stock runway logs.
  - *Fix:* Include all 4 analytical dimensions in the exported spreadsheet.
  - *Suggested Command:* `/impeccable polish`

---

## 6. Persona Red Flags

- **Alex (Owner / General Manager):** Period filter tabs do not filter quarterly revenue; CSV export lacks customer market share.
- **Pak Hendra (Production Manager):** Size curve cuts off at EU 46, hiding custom work boot orders (EU 47–48).
- **Casey (Warehouse Lead):** Wants to click a "Kritis" material card to trigger a restock purchase order draft.
- **Sam (Accessibility Operator):** Cannot navigate chart nodes via keyboard; SVG tooltips only trigger on mouse hover.

---

## 7. Provocative Design Unlock Questions

1. *What if clicking any segment on the Size Bell Curve (e.g. EU 41) or Customer Donut directly filtered the Delivery Orders list for instant cross-module investigation?*
2. *What if the Material Burn Rate Heatmap had a 1-click "Buat Surat Jalan / PO Masuk" quick action directly on materials flagged as CRITICAL?*
3. *What if the Size Bell Curve overlaid a dual curve showing "Order Demand" vs "Factory Die/Mold Set Availability" to highlight tooling deficits in real time?*
