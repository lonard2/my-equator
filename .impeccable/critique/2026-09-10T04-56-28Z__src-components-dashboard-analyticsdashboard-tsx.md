---
target: statistic dashboard
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/AnalyticsDashboard.tsx"
target_fingerprint: "sha256:b7addf30fd47d599beba4558d63f07b44b260847cf1524a7063691f3584c2726"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/AnalyticsDashboard.tsx
timestamp: 2026-09-10T04-56-28Z
slug: src-components-dashboard-analyticsdashboard-tsx
---
Method: dual-agent (A: 56074af3-db29-43d8-b951-b54bab58b490 · B: 31d9604c-2393-41a8-afd1-f32d5fbbfa87)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2/4 | No loading skeleton or dimmed overlay during period filter fetch; hardcoded `+` and upward arrow misrepresents negative MoM growth as positive green |
| 2 | Match Between System and Real World | 3/4 | Sizing bell curve and stock DSI match footwear factory domain well; but linear progress bar is mislabeled "Heatmap", and English SaaS acronyms (AOV, MoM) leak into Indonesian UI |
| 3 | User Control and Freedom | 2/4 | Rigid period chips (30D, Q, YTD, ALL) offer no custom date picker or month selection; charts are non-interactive dead ends with no cross-filtering |
| 4 | Consistency and Standards | 2/4 | Donut chart slices #1 and #2 use adjacent dark red (`#8B0000`) and bright red (`#DC2626`), breaching the DESIGN.md Crimson Scarcity Rule; chart tooltips sit in inconsistent fixed screen corners |
| 5 | Error Prevention | 3/4 | Robust guards against zero division and empty data; but rapid period switching lacks `AbortController` cancellation, risking out-of-order race condition overwrites |
| 6 | Recognition Rather Than Recall | 2/4 | Hovering donut slices displays percentage in the center without the customer name, forcing mental color mapping against the legend; sizing bell curve details are docked far away from the active bar |
| 7 | Flexibility and Efficiency | 2/4 | No keyboard shortcuts (e.g. `Alt+P` for period, `Alt+E` for export) despite factory keyboard-first conventions; no dense ledger table view toggle for accounting reconciliation |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean card borders (1px) and 12px radii (`rounded-xl`); but all 4 KPI cards reuse identical crimson icon badges (`bg-red-50 text-brand`), creating monotonous red visual noise |
| 9 | Help Users Recognize, Diagnose, Recover from Errors | 3/4 | Full-screen retry button and inline error banners present; errors relay raw server exceptions rather than operational guidance (checking local SQLite / factory LAN) |
| 10 | Help and Documentation | 2/4 | Technical factory metrics (DSI, Puncak Tooling, MoM) lack contextual tooltips; `SizeBellCurveChart` imports `<Info />` from lucide-react but never renders it |
| **Total** | | **24/40** | **Acceptable (60%)** |

---

## Design Specificity Verdict

**LLM Assessment:**  
The dashboard displays outstanding domain-specific craftsmanship in its bespoke footwear visualizers—most notably the **Footwear Insole Size Bell Curve** (modeling physical mold wear and "Puncak Tooling" at EU 41–42) and the **Material Days of Supply (DSI) Runway** (projecting physical EVA sheet exhaustion rather than abstract financial inventory). However, the executive summary layer falls back on generic B2B SaaS conventions: standard revenue/volume/AOV/fulfillment cards that ignore factory floor realities (mold utilization, cutting scrap waste ratios, EVA sheet nesting yields, and lead times). Furthermore, the customer share donut arbitrarily truncates at 5 buyers without an "Others" slice, leaving an incomplete arc that misrepresents West Java's artisanal footwear buyer ecosystem.

**Deterministic Scan (`impeccable detect`):**  
Ran deterministic scan across `src/components/dashboard` (5 files). Result: **0 errors, 1 advisory finding** (`design-system-font-size` on `SizeBellCurveChart.tsx:165` for `text-[9px]`). The detector correctly flagged that `9px` is outside the official `DESIGN.md` type ramp (floor is 10px `micro`). The finding is an advisory SVG coordinate nuance: the author attempted to visually emphasize peak tooling sizes on a fixed SVG axis without colliding into neighboring ticks, which can be cleanly solved using SVG presentation attribute `fontSize="9"` or standardizing to `text-[10px]`.

**Visual Overlays:**  
Automated CLI detector completed cleanly with 1 advisory finding. No browser overlay injection was required.

---

## Overall Impression

A visually polished industrial operations dashboard with exceptional footwear-specific concepts (the insole sizing bell curve and material burn rate runway are stellar), held back by high-stakes data visualization flaws: a dangerous green indicator on negative revenue growth, brand crimson misused across data slices, rigid period controls with no custom date selection, and un-interactive charts that isolate critical insights into dead ends.

---

## What's Working

1. **Footwear Insole Sizing Bell Curve (`SizeBellCurveChart.tsx`):**  
   A rare, authentic manufacturing visualizer. Footwear sizing naturally forms a Gaussian distribution; highlighting "Puncak Tooling" (EU 41–42) directly empowers the factory manager to anticipate mold degradation and schedule tooling changeovers.
2. **Days of Supply (DSI) Runway vs. Static Counts:**  
   Tracking material burn rate as *days of remaining supply* (e.g., "EVA-50: 14 hari tersisa") is immediately actionable for production scheduling, vastly outperforming generic raw quantity counts.
3. **Industrial Design Alignment (`DESIGN.md`):**  
   Strict conformance to 12px container radii (`rounded-xl`), neutral slate card floors, crisp 1px borders (`border-gray-200 dark:border-gray-800`), and tabular monospace typography (`font-mono`) on currency and dimensions creates an authentic, serious factory software aesthetic.

---

## Priority Issues (P0–P3)

### [P0] Misleading Green Growth Indicator on Negative Revenue Growth
- **What:** In `AnalyticsDashboard.tsx:229-232` and `lines 251-254`, the MoM comparison hardcodes a `+` prefix, green color (`text-emerald-600`), and `ArrowUpRight` icon. If monthly revenue declines by -14%, it displays as `+-14% MoM` in bright green with an upward arrow.
- **Why it matters:** Displaying positive green visual cues for contracting factory revenue destroys executive trust and invites severe misinterpretation during executive reviews.
- **Fix:** Build a dynamic `MetricDelta` component that evaluates `isPositive = delta >= 0`, switching between green `ArrowUpRight` (`+X%`) and red `ArrowDownRight` (`-X%`).
- **Suggested command:** `/impeccable harden`

### [P1] Violation of Crimson Scarcity in Donut Chart Palette
- **What:** `CustomerShareDonut.tsx:20-22` uses `#8B0000` (Equator Crimson) for Buyer #1 and `#DC2626` (Red 600) for Buyer #2.
- **Why it matters:** Directly violates `DESIGN.md` core doctrine: *"Crimson appears as brand chrome or danger — selection, data presence, and success may never wear it."* Placing two similar reds side-by-side also makes Buyer #1 and Buyer #2 indistinguishable under warehouse lighting or low-contrast monitors.
- **Fix:** Shift data segments to a multi-hue categorical palette (Royal Blue `#1D4ED8`, Teal `#0D9488`, Amber `#D97706`, Violet `#7C3AED`, Emerald `#059669`).
- **Suggested command:** `/impeccable colorize`

### [P1] Truncated Donut Arc & Missing "Others" Segment
- **What:** `CustomerShareDonut.tsx:48` slices `data.slice(0, 5)`. When the top 5 buyers represent 72% of turnover, the SVG donut draws only a 260° partial arc, leaving an unexplained 100° empty gap.
- **Why it matters:** Looks like a broken rendering bug and misrepresents factory buyer concentration by erasing the long tail of smaller footwear brands.
- **Fix:** Sum the top 5 percentages; if `< 100%`, append an automated 6th slice labeled `"Lainnya / Others"` in neutral slate (`#94A3B8`) to complete the 360° circle.
- **Suggested command:** `/impeccable clarify`

### [P2] Fixed-Position Obscuring Tooltips
- **What:** Tooltips in `RevenueVolumeChart.tsx:184-186` and `SizeBellCurveChart.tsx:178` are hardcoded to `absolute top-2 left-1/2` and `absolute top-2 right-4`.
- **Why it matters:** Pinned corner tooltips force high visual saccades across the screen and directly occlude data points when inspecting points in the top-center or top-right.
- **Fix:** Dynamically position tooltips above the hovered SVG coordinate, or dock them cleanly into the card header as a persistent active-inspection metric badge.
- **Suggested command:** `/impeccable polish`

### [P2] Bilingual Parity Breakdown in Tooltips and CSV Export
- **What:** In English mode (`language === "en"`), the exported CSV headers (`AnalyticsDashboard.tsx:62-92`), size bell curve tooltips, and chart axis units ("jt") remain 100% in Indonesian. In Indonesian mode, English terms ("MoM", "AOV", "Share", "Export CSV") remain untranslated.
- **Why it matters:** Violates the project's strict bilingual requirement and creates unprofessional friction when exporting reports for English-speaking overseas partners or local factory auditors.
- **Fix:** Centralize chart localization strings into a dictionary with complete ID/EN translations for export headers, axis units ("jt" vs. "M"), and tooltip descriptions.
- **Suggested command:** `/impeccable adapt`

---

## Persona Red Flags

- **Alex (Impatient Factory Owner):**  
  *Workflow:* Spots a critical red alert for "EVA-75 Kritis — 12 hari tersisa" in `MaterialBurnRateHeatmap.tsx:77` and clicks it to reorder.  
  *Red Flag:* Nothing happens. The list is completely static. Alex cannot view pending consumption, supplier contact info, or trigger an inventory intake draft. High operational abandonment.
- **Sam (Accessibility-Dependent Operator):**  
  *Workflow:* Uses keyboard `Tab` to navigate through monthly revenue points and sizing curves.  
  *Red Flag:* In `RevenueVolumeChart.tsx:156` and `SizeBellCurveChart.tsx:123`, data nodes have `tabIndex={0}` but use `focus:outline-none` with **no visible focus indicator**. Sighted keyboard users lose track of where focus is on the chart.
- **Riley (Deliberate Edge-Case Tester):**  
  *Workflow:* Rapidly clicks between "30H", "Kuartal", and "YTD" period filters.  
  *Red Flag:* Rapid clicking fires concurrent `fetchAnalytics` calls without `AbortController` cancellation, causing slower out-of-order network responses to overwrite newer selections.

---

## Minor Observations

1. **Dead Import:** `SizeBellCurveChart.tsx:4` imports `<Info />` from `lucide-react`, but the icon is never rendered.
2. **Redundant Ternary:** `AnalyticsDashboard.tsx:186` evaluates `{isId ? "Export CSV" : "Export CSV"}`—identical strings in both branches.
3. **Y-Axis Abbreviation Inconsistency:** `RevenueVolumeChart.tsx:129` formats currency as `Rp 12jt`. Standard Indonesian formal formatting is `Rp 12 Jt`, while English mode should render `Rp 12M`.
4. **Card Height Imbalance:** `CustomerShareDonut` uses `h-full` with vertical flex stretching, whereas `MaterialBurnRateHeatmap` has a hardcoded `max-h-64` inner scroll container (`line 73`), creating uneven bottom alignment across the 2-column grid on desktop screens.
5. **Detector Advisory:** `SizeBellCurveChart.tsx:165` uses `text-[9px]`, which is outside the `DESIGN.md` 10px type ramp floor.

---

## Questions to Consider

1. *What if critical material shortages weren't dead-end alerts, but 1-click action triggers to stage an inventory reorder?*
2. *What if clicking a customer in the Donut chart dynamically filtered the Sizing Bell Curve to display that specific buyer's mold distribution?*
3. *What if the dashboard provided a 1-page printable weekly executive briefing sheet (matching the delivery order print standards) instead of just raw unformatted CSV?*
