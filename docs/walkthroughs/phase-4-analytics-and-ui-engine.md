# Technical & Engineering Guide: Phase 4 — Executive Analytics, Sizing Distribution & UI Engine

## 1. Module Overview & Industrial Role

Phase 4 equips factory leadership and production managers with **Executive Business Analytics**, interactive data visualizations, and the **Global Command Palette (`⌘K`)**. It bridges raw transactional ERP data with actionable factory capacity planning, mold utilization, and material burn rate forecasts.

---

## 2. Analytics Math & Calculations (`src/services/analyticsService.ts`)

```
+-----------------------------------------------------------------------------------+
|                            Executive Analytics Suite                              |
+-----------------------------------------------------------------------------------+
|  1. IDR Financial Revenue Trend    |  2. Sizing Bell Curve (Gaussian Normal)       |
|     - Monthly IDR revenue & MoM %  |     - Peak mold highlighting (EU 40-41)      |
|     - Total volume pairs scheduled |     - Tooling utilization distribution       |
+------------------------------------+----------------------------------------------+
|  3. Customer Share Donut           |  4. Material Burn Rate & Days of Supply      |
|     - Revenue share percentage     |     - Current stock vs monthly consumption   |
|     - Top contributor insight strip|     - Days of Supply (DSI) projection        |
+------------------------------------+----------------------------------------------+
```

### 2.1 Month-over-Month (MoM) Revenue Growth
$$\text{MoM Growth \%} = \frac{\text{Revenue}_{\text{Current Month}} - \text{Revenue}_{\text{Previous Month}}}{\text{Revenue}_{\text{Previous Month}}} \times 100$$

### 2.2 Sizing Bell Curve Distribution (Footwear Gaussian Distribution)
In footwear manufacturing, sizes follow a normal Gaussian bell curve with peak demand concentrated at EU 40–41:

$$\text{Gaussian Probability Density: } f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{(x - \mu)^2}{2\sigma^2}}$$
- Mean $\mu = 40.5$, Standard Deviation $\sigma \approx 1.8$
- The Analytics visualizer identifies peak tooling sizes (e.g. `Mould Utama: EU 40 - 41`), allowing production managers to allocate high-speed injection press stations accordingly.

### 2.3 Material Burn Rate & Days of Supply (DSI)
$$\text{Estimated Monthly Burn} = \frac{\text{Historical Usage}}{\text{Months Elapsed}}$$
$$\text{Projected Days of Supply (DSI)} = \frac{\text{Current Stock}}{\text{Daily Consumption Rate}} = \frac{\text{Current Stock}}{\text{Estimated Monthly Burn} / 30}$$

If $\text{DSI} \le 15\text{ days}$, the system automatically flags the SKU as `CRITICAL / RESTOCK`.

---

## 3. Data Visualizations & SVG Geometry

### 3.1 Zero-Leeway Customer Share Donut (`CustomerShareDonut.tsx`)
Calculates parametric circular SVG slice arcs $(x, y)$ from percentage angles with a centered KPI donut readout:

```typescript
export function getCoordinatesForPercent(percent: number, radius: number, cx: number, cy: number) {
  const x = cx + radius * Math.cos(2 * Math.PI * percent);
  const y = cy + radius * Math.sin(2 * Math.PI * percent);
  return { x, y };
}
```

### 3.2 Dynamic Interactive Revenue Chart (`RevenueTrendChart.tsx`)
- Displays monthly bar columns with animated IDR currency popups.
- Formats monetary values with proper Indonesian separators (`Rp 185.000.000`).

---

## 4. Global Command Palette (`src/components/common/CommandPalette.tsx`)

A keyboard-first launcher accessible anywhere via `⌘K` (Mac) or `Ctrl+K` (Windows/Linux):
- Quick search across all Delivery Orders, Customer Names, and Material SKUs.
- Direct navigation across all 6 factory modules (`Surat Jalan`, `Digitizer`, `Inventori`, `CAD Studio`, `Analitik`, `Keamanan`).
- 1-Click modal triggers (`+ Buat DO Baru`, `Buka Khatulistiwa AI Assistant`, `Pengaturan Tampilan`).

---

## 5. UI Customization Engine (`src/components/common/SettingsModal.tsx`)

The UI engine supports 4 global appearance dimensions saved to HTML dataset attributes:
1. **UI Density Mode (`data-density`):**
   - `compact`: 0.85x scale for dense high-volume data entry workstations.
   - `normal`: 1.0x standard factory floor desktop default.
   - `large`: 1.15x scaled touch mode for tablet devices and inspection stations.
2. **Layout Width (`data-width`):**
   - `fluid`: 100% full-width expansive widescreen dashboard.
   - `boxed`: 1280px centered container for executive laptops.
3. **Theme Mode (`data-theme`):**
   - `light`: Crisp high-contrast daylight mode for factory offices.
   - `dark`: Low-strain dark theme with darkred `#8B0000` accents.
4. **Bilingual Switcher (`data-lang`):**
   - Instant real-time language switcher between Bahasa Indonesia (`ID`) and English (`EN`).

---

## 6. How to Build & Test Phase 4

1. **Verify Analytics Endpoint:**
   Navigate to `/api/analytics` to verify revenue trends, size distributions, and material burn rates.
2. **Test Command Palette Shortcut:**
   Press `⌘K` or `Ctrl+K` to open the launcher and search for an order or material SKU.
3. **Run Production Build:**
   ```bash
   npm run build
   ```
