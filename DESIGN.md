---
name: MyEquator
description: Industrial Footwear Insole Manufacturing & Operations Platform
colors:
  primary: "#8B0000"
  primary-hover: "#A00000"
  accent-red: "#DC2626"
  surface: "#FFFFFF"
  surface-subtle: "#F9FAFB"
  border: "#E5E7EB"
  border-dark: "#374151"
  text-primary: "#111827"
  text-muted: "#6B7280"
  terminal-bg: "#091510"
  terminal-text: "#34d399"
  cad-bg: "#030712"
  cad-outline: "#FFFFFF"
  cad-arch: "#EF4444"
  cad-heel: "#10B981"
  cad-meta: "#06B6D4"
  status-draft: "#6B7280"
  status-confirmed: "#1D4ED8"
  status-printed: "#B45309"
  status-dispatched: "#6D28D9"
  status-delivered: "#047857"
  status-cancelled: "#B91C1C"
typography:
  display:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  terminal:
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  body:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  caption:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
  micro:
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "9px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
---

# Design System: MyEquator

## Overview

**Creative North Star: "The Precision Vulcanizer"**

MyEquator's visual identity reflects the physical, tactile world of footwear insole manufacturing in Bandung, West Java. It blends rugged industrial reliability with modern digital precision: deep vulcanized crimson (`#8B0000`), structured sizing breakdown matrices, high-contrast monospace ESC/P dot-matrix emulators, precision millimeter-scale CAD drafting grids, and crisp mechanical affordances.

The system is designed for high-throughput daily operations under real factory floor conditions: dust, overhead fluorescent lighting, warehouse gloves, digital calipers, and split-second verification needs. Every element earns its place through utility, clarity, and ergonomic safety.

**Key Characteristics:**
- **Crimson Brand Dominance:** Dark Red (`#8B0000`) is the singular primary accent, reserved for high-conviction actions and active indicators.
- **Physical Matrix Ergonomics:** Sizing matrices (EU 36–48) are structured tabular grids with auto-summed row/column footers and tablet touch pads.
- **CAD & CNC Vector Precision:** Parametric insole splines with millimeter digital caliper controls, AutoCAD R12 DXF layer streaming, and pre-flight die verification.
- **Industrial Terminal Evocation:** Continuous form printing features authentic CRT phosphor green (`#34d399` on `#091510`) 80-column monospace previews.
- **High-Assurance State Design:** Non-blocking in-app confirmation dialogs, unsaved changes tracking (`isDirty`), and audited rollback paths.

---

## Colors

The palette is anchored by Equator Insole's signature crimson red, supported by neutral slate surfaces, high-contrast text tokens, AutoCAD ACI layer standards, and semantic lifecycle status colors.

### Primary
- **Equator Crimson** (`#8B0000`): The authoritative brand accent. Used for primary CTAs, active indicator bars, key metrics, and brand emblems.
- **Crimson Hover** (`#A00000`): Active and hover state for primary interactive elements.

### Secondary
- **Equator Bright Accent** (`#DC2626`): Secondary highlight and dark-mode primary accent for heightened legibility against dark slate surfaces.

### Neutral
- **Pure Canvas / Surface** (`#FFFFFF` in light, `#111827` in dark): Background for cards, modals, and content containers.
- **Subtle Floor** (`#F9FAFB` in light, `#1F2937` in dark): Global application background and inactive table stripes.
- **Structural Border** (`#E5E7EB` in light, `#374151` in dark): Crisp 1px perimeter definition for all cards and table cells.
- **Primary Ink** (`#111827` in light, `#F9FAFB` in dark): High-contrast foreground for titles, quantities, and customer names.
- **Muted Steel** (`#6B7280` in light, `#9CA3AF` in dark): Metadata, timestamps, helper captions, and table column headers.

### CAD & Vector Drafting Colors (ACI Standard)
- **CAD Dark Slate Canvas** (`#030712` / `#111827`): Deep neutral drafting bed with subtle 20px grid.
- **Cut Outline (ACI Color 7 White)** (`#FFFFFF`): Perimeter knife / laser cut toolpath.
- **Arch Support Plate (ACI Color 1 Red)** (`#EF4444`): TPU arch bridge shank boundary.
- **Heel Cup (ACI Color 3 Green)** (`#10B981`): Heel cupping stabilization boundary.
- **Metatarsal Pad (ACI Color 4 Cyan)** (`#06B6D4`): Forefoot dome cushion boundary.

### Terminal Phosphor
- **CRT Obsidian** (`#091510`): Authentic deep terminal frame for the ESC/P dot-matrix 80-column monospace printer preview.
- **Phosphor Green** (`#34d399`): High-contrast emerald text simulating LX-310 continuous tractor-feed print output.

### Semantic Status Tokens
- **Draft:** Slate (`text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800`)
- **Confirmed:** Royal Blue (`text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/60`)
- **Printed:** Amber Gold (`text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60`)
- **Dispatched:** Violet Purple (`text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/60`)
- **Delivered:** Forest Emerald (`text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60`)
- **Cancelled:** Crimson Red (`text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/60`)

### Named Rules
**The Singular Accent Rule.** Deep crimson (`#8B0000`) is used on ≤10% of any view. Its rarity guarantees immediate visual hierarchy for primary CTAs and active states.  
**The Matched Hue Rule.** Status badges and alerts always pair text and background from the same color family (e.g., `text-blue-700 on bg-blue-50`), never placing dark gray text on a colored surface.

---

## Typography

**Display & Body Font:** Plus Jakarta Sans (`var(--font-sans)`, fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)  
**Tabular & Terminal Font:** JetBrains Mono (`var(--font-mono)`, fallback `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`)

**Character:** Utilitarian, crisp, and ergonomically dense. High optical legibility across complex footwear sizing grids, digital caliper dimensions, and production orders. Numerical data (order numbers, quantities, prices, dates, mm dimensions) always enables tabular numerals (`tabular-nums`, `font-feature-settings: "tnum" 1, "zero" 1`) to eliminate horizontal layout jitter.

### Hierarchy
- **Display** (Font Weight: 900, Size: 1.75rem / 28px, Line Height: 1.2, Tracking: -0.025em): Module titles, executive IDR revenue figures.
- **Headline** (Font Weight: 800, Size: 1.25rem / 20px, Line Height: 1.3, Tracking: -0.02em): Section headers, modal sheet titles.
- **Title** (Font Weight: 700, Size: 0.875rem / 14px, Line Height: 1.4, Tracking: -0.01em): Card headers, customer names, table column groups.
- **Body** (Font Weight: 500, Size: 0.75rem / 12px, Line Height: 1.5): Form inputs, order addresses, notes, dialog explanations.
- **Label / Data** (Font Weight: 700, Size: 0.6875rem / 11px, Monospace, `tabular-nums`): Footwear sizes, pairs (`psg`), order numbers (`SJ/EQ/...`), dates, millimeter dimensions.

### Named Rules
**The Tabular Numerals Rule.** All dynamic numbers, footwear sizes, currency amounts, and order codes must specify `tabular-nums` or `font-mono` with OpenType `tnum` enabled to prevent horizontal jitter during live calculation updates.  
**The Density Scale Rule.** The UI supports 5 granular font-size scaling tiers (`xs: 12.5px`, `compact: 14px`, `normal: 16px`, `large: 18px`, `xl: 20.5px`) controlled at `:root` for cross-operator visual comfort.

---

## Layout

The spatial framework provides three distinct responsive experience tiers:
1. **Desktop Workstation (≥1024px):** Split-screen Master-Detail layout with persistent collapsible navigation sidebar, list pane, and live 3-pane CAD vector drafting bed.
2. **Tablet Floor View (768px–1023px):** Touch-friendly sizing pads, collapsible sizing drawers, and bottom action bars.
3. **Mobile Warehouse Feed (<768px):** Single-column stacked cards with 44px+ touch targets and 4-tab mobile mode selector.

**Spacing Rhythm:** Base unit of 4px. Component padding scales across `8px` (`p-2`), `12px` (`p-3`), `16px` (`p-4`), and `24px` (`p-6`).

---

## Elevation & Depth

**Philosophy: Tonal Layered with Physical Restraint.**  
The interface is intentionally flat at rest. Depth and hierarchy are established through crisp 1px border stratification and background tone contrast (`bg-white` over `bg-gray-50/80`). Soft shadows are reserved exclusively for active focus states, floating toast notifications, and modal backdrops.

### Shadow Vocabulary
- **Subtle Surface** (`shadow-xs` / `0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Base card perimeters and filter chips.
- **Active Lift** (`shadow-md` / `0 4px 6px -1px rgba(0, 0, 0, 0.1)`): Primary CTA buttons and floating action drawers.
- **Modal Overlay** (`shadow-2xl` / `0 25px 50px -12px rgba(0, 0, 0, 0.25)`): Popover dialogs, print preview sheets, and command palette.

### Named Rules
**The Inset Indicator Rule.** Active list items and selected tabs use an inset indicator bar (`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8B0000]`) rather than a thick left border, completely preventing box-sizing displacement.

---

## Shapes

- **Base Corner Radius:** Moderately rounded corners (`rounded-xl` / 12px) for input fields and action buttons.
- **Card & Modal Radius:** Smooth continuous curves (`rounded-2xl` / 16px to `rounded-3xl` / 24px) for major workspace containers.
- **Pills & Badges:** Fully rounded (`rounded-full` / 9999px) for status badges, size tags, and counter chips.

---

## Components

### Buttons
- **Primary:** `bg-[#8B0000] hover:bg-[#A00000] text-white font-bold rounded-xl px-4 py-2 shadow-xs active:scale-95 transition-all`.
- **Secondary:** `bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl px-3 py-2 hover:bg-gray-50`.
- **Destructive:** `text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl p-2 active:scale-95`.

### Status Badges
- Reusable `StatusBadge` component using matched-hue pill styling, semantic status dot, and bilingual translation.

### Sizing Matrix Cells
- Monospace tabular numeric inputs with `inputmode="numeric"`. Active non-zero cells highlight in soft crimson (`bg-red-50/90 border-[#8B0000] text-[#8B0000] font-bold`).

### Caliper Numeric Inputs
- Compact, high-contrast numeric input boxes (`<input type="number" step="0.1" />`) synchronized with CAD range sliders, displaying explicit millimeter (`mm`) units and color-matched values.

### Touch Size Pad
- 5x2 footwear sizing grid with active ring indicators, ±1/±10 steppers, and color-coded magnitude step presets (+50 blue, +100 amber, +200 red).

---

## Do's and Don'ts

### Do:
- **Do** format all currency in Indonesian Rupiah with thousand-separator dots: `Rp 1.250.000`.
- **Do** include Indonesian *Terbilang* spelled-out text on printable Delivery Orders and Invoices.
- **Do** use `tabular-nums` on all footwear quantities, sizes, prices, dates, and caliper dimensions.
- **Do** ensure all mobile action buttons satisfy minimum 44px touch targets.
- **Do** guard multi-field forms against accidental loss with `isDirty` discard confirmations.
- **Do** provide non-blocking in-app toasts for save and export feedback.

### Don't:
- **Don't** use generic floating decorative gradients or rainbow AI accents.
- **Don't** place dark gray text on saturated background colors (`gray-on-color`).
- **Don't** use native browser `alert()` or `window.confirm()` popups; use accessible in-app modals.
- **Don't** use pulse/ping animations on status badges; keep status indicators calm and static.
- **Don't** apply `border-left-4` on list cards; use inset indicator bars to avoid layout shifts.
