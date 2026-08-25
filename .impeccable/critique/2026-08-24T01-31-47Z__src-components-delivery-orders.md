---
target: the delivery order page
total_score: 33.3
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T01-31-47Z
slug: src-components-delivery-orders
---
# Design Critique: Delivery Orders (`src/components/delivery-orders`)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:---:|-----------|
| 1 | Visibility of System Status | 3.6 | Status pills and live volume stats are clear; missing transient toast on `.PRN` binary download. |
| 2 | Match System / Real World | 3.9 | Authentic Indonesian footwear terms (*Surat Jalan*, *Pasang*, *Sopir*, *Terbilang*, 3-party signatures). |
| 3 | User Control and Freedom | 3.2 | Rollback state machine with audit reason is great; modal backdrop click discards data without warning. |
| 4 | Consistency and Standards | 3.1 | Status badge color mismatch (`CONFIRMED` is blue in list, but red badge in detail pane). |
| 5 | Error Prevention | 3.0 | Numeric keypad inputs and single-item guard; lacks protection against 0-pair submissions. |
| 6 | Recognition Rather Than Recall | 3.7 | Pinned size matrix column headers, reactive pair sums, and real-time Indonesian *Terbilang* spelling. |
| 7 | Flexibility and Efficiency | 3.8 | Desktop keyboard grid, Tablet touch sizing pad (+10, +50, +100 pasang), and Mobile stacked card views. |
| 8 | Aesthetic and Minimalist Design | 3.3 | Deep corporate crimson brand palette; edit mode in detail pane suffers from stacked visual density. |
| 9 | Error Recovery | 2.8 | 1-click reactivation for cancelled orders; relies on blocking native browser `alert()` popups. |
| 10 | Help and Documentation | 2.9 | Helpful dot-matrix paper guidance; lacks keyboard shortcut cheat sheet in digitizer. |
| **Total** | | **33.3/40** | **Good (Production-Grade Factory ERP)** |

#### Design Specificity Verdict

- **LLM Assessment**: High domain specificity tailored specifically for Equator Insole in Bandung, West Java. It reflects genuine manufacturing workflows: shoe size breakdown matrix (EU 36–45), 80-column ESC/P dot-matrix printing for Epson continuous forms, Indonesian *Terbilang* text spelling, and 3-party logistics signatures.
- **Deterministic Scan**: 1 warning found in [`OrderList.tsx:169`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderList.tsx#L169) (`side-tab`: thick `border-l-4 border-[#8B0000]` active card indicator). 5 out of 6 components are 100% clean of design antipatterns.
- **Visual Overlays**: Deterministic static AST pass completed.

#### Overall Impression
A domain-aware factory operations tool built for shoe manufacturing realities. The primary opportunities are streamlining the crowded detail action bar, harmonizing status badge colors, replacing browser `alert()` dialogs with inline states, and refining the active list card indicator.

#### What's Working
1. **Dual-Mode Industrial Print Pipeline**: Monospace ESC/P CRT phosphor preview and binary `.prn` stream generation for continuous-form dot-matrix impact printers.
2. **Multi-Device Ergonomics**: Desktop split-rail master-detail, Tablet touch sizing pad with step steppers, and Mobile numeric keypad triggers.
3. **Audited Reversible Lifecycle**: Status transitions with rollback audit trails and 1-click cancelled draft restoration.

#### Priority Issues
- **[P1] Action Button Overcrowding in OrderDetail Header**: Up to 7 buttons rendered horizontally in [`OrderDetail.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderDetail.tsx#L276-L380), causing clutter. *Fix:* Keep primary workflow button elevated, collapse secondary utilities into a `Tindakan Lainnya (•••)` dropdown menu. *Suggested:* `/impeccable distill` or `/impeccable layout`.
- **[P1] Status Badge Color Discrepancy**: [`OrderList.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderList.tsx#L60-L77) uses distinct colors for statuses, while [`OrderDetail.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderDetail.tsx#L255-L263) renders a red badge for all non-delivered states. *Fix:* Unify into a shared `StatusBadge` component. *Suggested:* `/impeccable colorize` or `/impeccable polish`.
- **[P2] Blocking Browser `alert()` and `confirm()` Dialogs**: Validation errors and deletions trigger disruptive native browser dialogs. *Fix:* Replace with inline feedback and smooth toasts. *Suggested:* `/impeccable harden`.
- **[P2] Missing Unsaved Changes Guard in Modal**: Closing [`OrderFormModal.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderFormModal.tsx) via backdrop click or `Esc` discards entered data without confirmation. *Fix:* Add dirty-state dismissal confirmation. *Suggested:* `/impeccable harden`.
- **[P3] `side-tab` Accent Border Antipattern**: [`OrderList.tsx:169`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderList.tsx#L169) uses `border-l-4` which creates box-sizing jitter and an AI-template look. *Fix:* Use an inset accent indicator bar or refined subtle background. *Suggested:* `/impeccable polish`.

#### Persona Red Flags
- **Alex (Power User / Sales Operator)**: Lack of keyboard arrow navigation ($\uparrow/\downarrow$) in OrderList to cycle between orders.
- **Jordan (First-Timer / Front Desk)**: Unclear side effects on clicking *"Kirimkan ke Armada"* without explanatory tooltips.
- **Casey (Mobile Warehouse Staff)**: Action buttons nested tightly inside mobile cards cause mis-taps when wearing factory gloves.
- **Pak Hendra (Factory Floor Foreman)**: Needs an aggregate size matrix sum across all pending orders today rather than opening each order individually.

#### Minor Observations
- Support for EU 46–48 oversized shoe sizes in TouchSizePad.
- Subtle helper tag explaining print bar overrides do not modify the database.
- Quick date shortcut chips (*Kemarin*, *Minggu Lalu*) in ArchiveDigitizer.

#### Questions to Consider
- What if Order Detail included an interactive "Carton Packing & Staging Checklist" for warehouse crew?
- Can we bridge direct WebUSB / WebSerial spooling to connected Epson LX-310 dot-matrix printers?
- Could Khatulistiwa AI extract photo snapshots of physical delivery notes directly into the digitizer?
