# Phase 4 Walkthrough — Visual Analytics Suite & Global Command Palette

## 1. Module Overview

Phase 4 introduces executive business intelligence and rapid keyboard accessibility to the `MyEquator` ERP platform. The factory management team can now track real-time revenue velocity, visualize footwear mold tooling demand curves, monitor client brand concentration, and forecast raw material stock depletion rates.

```
+-----------------------------------------------------------------------------------+
|                           Phase 4: Analytics & Command Palette                    |
+-----------------------------------------------------------------------------------+
|  1. Executive Financial KPIs      |  2. Size Breakdown Bell Curve Visualizer      |
|     - Total Revenue (IDR) & MoM%  |     - EU 35–46 continuous normal curve        |
|     - Shipped vs Scheduled Pairs  |     - Automated mold peak volume identification|
|     - Average Order Value (AOV)   |     - Cumulative percentage shares            |
+-----------------------------------+-----------------------------------------------+
|  3. Buyer Concentration Donut     |  4. Material Burn Rate & DSI Forecast         |
|     - Client share segment breakdown|    - Projected Days of Inventory Remaining   |
|     - Revenue concentration       |     - Reorder risk threshold indicators       |
+-----------------------------------+-----------------------------------------------+
|                      5. Global Command Palette (`⌘K` / `Ctrl+K`)                   |
|       Instant fuzzy search, cross-tab navigation & 1-click factory actions        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Mathematical Modeling & Algorithms

### 2.1 Footwear Sizing Bell Curve Formulation
In industrial shoe last (*acuan sepatu*) production, demand typically follows a Gaussian-like bell distribution centered around regional median sizes (e.g., EU 40–42 in Southeast Asian adult footwear).

For any size matrix $S \in \{35, 36, \dots, 46\}$:
$$\text{Percentage}(S) = \frac{\text{Volume}(S)}{\sum_{i=35}^{46} \text{Volume}(i)} \times 100\%$$

The **Peak Mold Tooling Index** is calculated dynamically:
$$\text{Peak} = \arg\max_{S} \left( \text{Volume}(S) \right)$$

### 2.2 Days Sales of Inventory (DSI) & Stock Runaway
To prevent factory work stoppages caused by EVA sheet or latex shortage:
$$\text{Burn Rate}_{\text{daily}} = \frac{\text{Estimated Monthly Burn}}{30}$$
$$\text{Days Remaining} = \frac{\text{Current Stock (Units)}}{\text{Burn Rate}_{\text{daily}}}$$

Health states are classified:
- **Healthy:** $\text{Days Remaining} \ge 30\text{ days}$
- **Warning / Reorder:** $15 \le \text{Days Remaining} < 30\text{ days}$
- **Critical:** $\text{Days Remaining} < 15\text{ days}$

---

## 3. Directory & File Manifest

| File Path | Description |
| :--- | :--- |
| [`src/services/analyticsService.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/services/analyticsService.ts) | Aggregates database metrics into financial KPIs, monthly trends, size distributions, customer shares, and stock burn rates. |
| [`src/app/api/analytics/route.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/app/api/analytics/route.ts) | REST API endpoint returning real-time aggregated analytics JSON. |
| [`src/components/dashboard/AnalyticsDashboard.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/AnalyticsDashboard.tsx) | Executive analytics dashboard container with period filter and CSV export. |
| [`src/components/dashboard/RevenueVolumeChart.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/RevenueVolumeChart.tsx) | Interactive SVG Area & Line chart with IDR currency scaling and hover tooltips. |
| [`src/components/dashboard/SizeBellCurveChart.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/SizeBellCurveChart.tsx) | Footwear sizing bell curve with peak mold highlights and bar overlays. |
| [`src/components/dashboard/CustomerShareDonut.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/CustomerShareDonut.tsx) | Segmented SVG Donut chart with animated arcs and buyer share breakdown. |
| [`src/components/dashboard/MaterialBurnRateHeatmap.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/dashboard/MaterialBurnRateHeatmap.tsx) | Material depletion forecast cards with progress gauges and risk badges. |
| [`src/components/common/CommandPalette.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/common/CommandPalette.tsx) | Global keyboard-driven (`⌘K` / `Ctrl+K`) modal for rapid cross-module navigation. |

---

## 4. Key Learnings & Architectural Notes
1. **Lightweight SVG vs Bloated Charting Libraries:** Writing clean, native SVG visualizers avoids large external chart bundle overhead, guaranteeing sub-second load times on low-power warehouse computers.
2. **Keyboard Ergonomics (`⌘K`):** Factory operators managing hundreds of delivery slips benefit immensely from keyboard shortcuts that allow instant jumping between orders, stock checks, and CAD tooling without touching the mouse.
