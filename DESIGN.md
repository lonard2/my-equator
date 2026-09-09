---
name: MyEquator
description: Industrial Footwear Insole Manufacturing & Operations Platform
colors:
  primary: "#8B0000"
  primary-hover: "#A00000"
  primary-deep: "#4A0000"
  accent-red: "#DC2626"
  data-present: "#B45309"
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
    fontWeight: 800
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
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  caption:
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.3
  micro:
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
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
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
---

# Design System: MyEquator

## Overview

**Creative North Star: "The Precision Vulcanizer"**

MyEquator's visual identity reflects the physical, tactile world of footwear insole manufacturing in Bandung, West Java. It blends rugged industrial reliability with modern digital precision: deep vulcanized crimson (`#8B0000`), structured sizing breakdown matrices, high-contrast monospace ESC/P dot-matrix emulators, precision millimeter-scale CAD drafting grids, and crisp mechanical affordances.

The system is designed for high-throughput daily operations under real factory floor conditions: dust, overhead fluorescent lighting, warehouse gloves, digital calipers, and split-second verification needs. Every element earns its place through utility, clarity, and ergonomic safety. Color is doctrine, not decoration: crimson is scarce and means danger or brand chrome; amber means "data present"; the six status hues speak only about lifecycle state.

**Key Characteristics:**
- **Crimson Scarcity:** Dark Red (`#8B0000`) is reserved for brand chrome (active nav, primary CTAs, inset selection bars) and danger. Its rarity is the point.
- **Amber Means Data:** Any surface encoding "this cell/quantity has a value" wears the amber data-present token — never crimson.
- **Physical Matrix Ergonomics:** Sizing matrices (EU 36–48) are structured tabular grids with auto-summed footers, amber data cells, and a hold-to-×10 touch pad.
- **Truth-Gated Confirmations:** Every destructive or status-advancing action runs through a modal that stays open on server rejection and names the failure inline. PRINTED advances only after a human answers "printed correctly?".
- **Ceremony Family:** Delivered (emerald) and Slip-Spooled (amber) share one dark full-screen anatomy — seal, glow, mono recap, countdown — as the system's emotional peaks.
- **Industrial Terminal Evocation:** Continuous form printing features authentic CRT phosphor green (`#34d399` on `#091510`) 80-column monospace previews with tractor perforations and the 3-ply carbonless legend.

## Colors

The palette is anchored by Equator Insole's signature crimson, supported by neutral slate surfaces, semantic status hues, and an amber data-encoding layer.

### Primary
- **Equator Crimson** (`#8B0000`): Brand chrome and danger only — primary CTAs, active nav indicator bars, the physical danger red of void/cancel/error. Never used to encode data presence.
- **Crimson Hover** (`#A00000`): Hover/active state for primary interactive elements.
- **Crimson Deep** (`#4A0000`): Monogram avatar tone and deep brand accents.

### Secondary
- **Data Amber** (`#B45309`): "Data present" encoding in sizing matrices and touch-pad tiles. Distinct from the PRINTED status hue by context (cells/tiles vs badges).

### Tertiary (Status Spectrum — via `STATUS_COLOR_MAP`)
- **Draft Slate** (`#6B7280`), **Confirmed Royal** (`#1D4ED8`), **Printed Gold** (`#B45309`), **Dispatched Violet** (`#6D28D9`), **Delivered Forest** (`#047857`), **Cancelled Danger Red** (`#B91C1C`). One source of truth in `src/lib/utils/statusColors.ts` feeding badges, stepper, CTAs, confirm-modal headers, and the shared filter config.

### Neutral
- **Pure Canvas** (`#FFFFFF` light / `#111827` dark): Cards, modals, content containers.
- **Subtle Floor** (`#F9FAFB` light / `#1F2937` dark): App background and inactive table stripes.
- **Structural Border** (`#E5E7EB` light / `#374151` dark): 1px perimeters.
- **Primary Ink** (`#111827` light / `#F9FAFB` dark): Titles, quantities, customer names.
- **Muted Steel** (`#6B7280` light / `#9CA3AF` dark): Metadata, helper captions, table headers.

### Terminal & CAD (Domain Surfaces)
- **CRT Obsidian** (`#091510`) + **Phosphor Green** (`#34d399`): ESC/P dot-matrix preview only — the sole sanctioned dark-emerald surface.
- **CAD Canvas** (`#030712`) with ACI layer colors (White cut `#FFFFFF`, Red arch `#EF4444`, Green heel `#10B981`, Cyan metatarsal `#06B6D4`): CAD studio only.

### Named Rules
**The Crimson-Is-Danger Rule.** Crimson (`#8B0000` family) appears as brand chrome or danger — selection, data presence, and success may never wear it. If a color could mean two things at the loading dock, it means nothing.
**The Amber-Is-Data Rule.** Non-zero sizing cells, data chips, and touch-pad quantity tiles wear amber (`bg-amber-50/80` family). Amber encodes value presence; it never signals error.
**The Matched Hue Rule.** Status badges and alerts always pair text and background from the same color family; never gray text on a colored surface.
**The Calm Status Rule.** Status indicators are static. Motion is reserved for state transitions and the current-step pulse — never on badges.

## Typography

**Display & Body Font:** Plus Jakarta Sans (`var(--font-sans)`, fallback system stack)
**Tabular & Terminal Font:** JetBrains Mono (`var(--font-mono)`, fallback `ui-monospace`)

**Character:** Utilitarian, crisp, ergonomically dense. Numerical data — order numbers, quantities, prices, mm dimensions — always renders with tabular numerals (`tabular-nums`, `tnum` 1) to eliminate horizontal jitter.

### Hierarchy
- **Display** (800, 1.75rem, 1.2): Module titles, executive IDR figures.
- **Headline** (800, 1.25rem, 1.3): Section headers, modal titles.
- **Title** (700, 0.875rem, 1.4): Card headers, customer names.
- **Body** (500, 0.75rem, 1.5): Inputs, addresses, dialog copy.
- **Label** (700, 0.6875rem, mono): Sizes, pairs, order codes, mm dimensions.
- **Caption** (600, 0.625rem): The type floor — nothing renders below 10px.

### Named Rules
**The Tabular Numerals Rule.** All dynamic numbers, sizes, currency, and dates specify `tabular-nums` or `font-mono`.
**The 10px Floor Rule.** The smallest rendered text is 10px (`text-[10px]`); metadata below that is deleted, not shrunk.
**The Density Scale Rule.** Five root font-size tiers (`xs 12.5px` → `xl 20.5px`) scale the whole UI for operator comfort; hard-coded sizes never remap, so nothing renders below the caption floor.

## Layout

Three responsive tiers. **Desktop (≥1024px):** persistent sidebar + master-detail split (collapsible list rail) + full detail workspace. **Tablet (768–1023px):** first-class — Rekap aggregate visible, touch pad parity, wrapping detail header. **Mobile (<768px):** single-column card feed, one-line compact KPI strip, sticky thumb-zone action bar in the 90vh detail sheet, bottom tab bar (5 tabs, deliberate ceiling — Digitizer/Tax via ⌘K).

**Spacing Rhythm:** 4px base; component padding at 8/12/16/24px. Pre-content stack on mobile is rationed: one KPI line + one brand row + search + chips before the first card.

## Elevation & Depth

**Philosophy: Tonal Layering with Physical Restraint.** The interface is flat at rest; hierarchy comes from 1px borders and background tone contrast (`bg-white` over `bg-gray-50/80`). Depth appears only as a response to state or for floating chrome.

### Shadow Vocabulary
- **Subtle Surface** (`shadow-xs`): Cards, chips, resting controls.
- **Active Lift** (`shadow-md`): Primary CTAs, floating action launcher.
- **Modal Overlay** (`shadow-2xl`): Dialogs, ceremony stages, command palette.
- **Ceremony Glow** (tinted `shadow-[0_0_50px_rgba(...)]`): Ceremony stages only — the one place a colored halo is earned.

### Named Rules
**The Inset Indicator Rule.** Active list items and selected tabs use an inset indicator bar (`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand`), never a thick border — no box-sizing displacement.
**The Flat-By-Default Rule.** Shadows appear only as a response to state (hover, focus, elevation), or on floating chrome.

## Shapes

One radius law across the system. **Controls and small elements: `rounded-lg` (8px).** **Surfaces — inputs, cards, buttons, modals: `rounded-xl` (12px).** **Hero surfaces — login card, assistant window, mobile bottom sheet: `rounded-2xl` (16px).** **Pills, badges, avatars, dots: `rounded-full`.** `rounded-3xl` is banned. The entrance-motion family (fade/zoom-95/slide-from-bottom, 180ms, `cubic-bezier(0.16,1,0.3,1)`) applies to modals, banners, and sheets; feedback motion (bump, paper-feed, ledger-flash, status-pulse on the current step) answers user actions only.

## Components

### Buttons
- **Shape:** Moderately rounded (12px, `rounded-xl`).
- **Primary:** Crimson brand fill (`bg-brand hover:bg-brand-strong`), white bold text, `px-3.5 py-2`, `shadow-xs`, `active:scale-95`. Loading states show a spinner and disable.
- **Secondary:** Surface fill with 1px border (`border-gray-300 dark:border-gray-700`), themed text, hover tint.
- **Ghost:** Text-only with hover tint; used inside menus (`role="menu"` / `role="menuitem"`).
- **Truth Gate:** Any button advancing status or destroying data opens a confirm modal whose `onConfirm` returns a result; rejection keeps the modal open with an inline `role="alert"` error and retry.

### Chips (Status Filters)
- **Style:** Unselected — muted fill, bold 11px label, mono count badge. Selected — solid fill (`bg-brand text-white` desktop, inverted `bg-white text-brand` on the crimson mobile header).
- **State:** `aria-pressed={isSelected}` on every chip; live counts computed over the search-matching set (shared `matchesOrderSearch`), so chips never contradict the visible list.
- **Canonical Set:** All / Draft / Confirmed / Printed / Dispatched / Selesai-Arsip (terminal group).

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px); hero surfaces 16px.
- **Background:** White over gray-50 floor (dark: gray-900 over gray-950).
- **Border:** 1px `border-gray-200 dark:border-gray-800`; `shadow-xs`.
- **Internal Padding:** 16px standard, 12px dense lists.

### Inputs / Fields
- **Style:** 1px border, surface fill, `rounded-xl`, mono/bold for numeric matrix cells.
- **Focus:** Brand border + 1px brand ring; `focus:outline-none` always paired with a visible ring.
- **Error / Disabled:** Inline banner with `role="alert"` + retry; disabled states carry `aria-label` reasons and visible micro-copy, never `title`-only.

### Status Badge
- Matched-hue pill from `STATUS_COLOR_MAP` with a semantic dot and bilingual label; static (no pulse).

### Size Matrix Cells (Signature)
- Monospace tabular inputs, `inputmode="numeric"`, 44px min-height. Non-zero cells wear amber (data-present) in both view and edit modes; empty cells render a muted dash. Oversize EU 46–48 columns sit behind a toggle and use the same amber encoding.

### Touch Size Pad (Signature)
- Horizontal size tiles + two labeled control clusters: "Ubah Jumlah" (−1 / value / +1 with press-and-hold ×10 at 450ms, and Kosongkan/Clear) and "Preset Cepat" (+50/+100/+200 in neutral mono). 44px minimums throughout; hold gives visual cue feedback.

### Confirm Modals (Signature)
- Cancel-first initial focus, 44px targets, `useModalSafety` (trap, Escape, focus return). Header keyed by target status via `headerBg` token. Stay open on rejection with inline error — the rollback, dispatch/delivered, and discard patterns are one family.

### Ceremony Family (Signature)
- Delivered (emerald seal) and Slip-Spooled (amber seal with tractor perforations + 3-ply Putih/Merah/Kuning legend): identical dark full-screen anatomy — glow, seal, mono order-number recap, 44px CTAs, countdown bar with `aria-live` semantics. The spool variant carries the physical verification question before PRINTED may advance.

## Do's and Don'ts

### Do:
- **Do** format all currency in Indonesian Rupiah with dot separators (`Rp 1.250.000`) and include *Terbilang* on printable orders.
- **Do** use `tabular-nums` on every dynamic number, and keep all text ≥10px.
- **Do** ensure ≥44px touch targets on every mobile/tablet control; announce state changes via `aria-live`/`aria-pressed`/sr-only text.
- **Do** guard multi-field forms with `isDirty`, autosave (800ms debounce), and a discard modal with Keep-Editing focused.
- **Do** route every status mutation through the truth gate: confirm modal returns a result, stays open on rejection, and toasts success only on verified outcomes.

### Don't:
- **Don't** use crimson for selection, data presence, or success — crimson is brand chrome and danger only.
- **Don't** render raw English status enums (`DRAFT`, `DISPATCHED`) in Indonesian UI — speak `labelId`/`labelEn` tokens.
- **Don't** use native `alert()`/`window.confirm()`; use the in-app modal and toast patterns.
- **Don't** use pulse/ping animations on status badges; keep status indicators calm.
- **Don't** use `rounded-3xl` or *decorative* `border-left-4` accents on cards; status indicator bars and the inset indicator rule are the sanctioned pattern.
- **Don't** claim states the system hasn't verified (signatures "verified", spool "sent to queue" for a download) — copy states expectations, gates state truth.
