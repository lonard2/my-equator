---
target: the delivery order page
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-08T11-51-47Z
slug: src-components-delivery-orders
---
# Design Critique — Delivery Orders Page (src/components/delivery-orders + DO workspace in page.tsx)

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading skeletons; failed delete/save is console.error only (page.tsx:208) |
| 2 | Match System / Real World | 4 | Surat Jalan, psg, SPK, Terbilang, LX-310 .prn — superb domain fluency |
| 3 | User Control and Freedom | 2 | Dispatch is one unguarded tap; no Escape close or focus return on modals |
| 4 | Consistency and Standards | 2 | Amber Kirimkan button vs violet DISPATCHED badge; red = brand + current-step + danger |
| 5 | Error Prevention | 3 | Delete modal + mandatory rollback reason excellent; forward transitions unguarded |
| 6 | Recognition Rather Than Recall | 3 | Chip counts, stepper, aggregate drawer; print button is hover-only (OrderList.tsx:346) |
| 7 | Flexibility and Efficiency | 3 | Arrow-key nav + hint footer; focus does not follow selection |
| 8 | Aesthetic and Minimalist Design | 3 | Dense but chunked; KPI strip 3 cards in sm:grid-cols-4 grid = permanent hole |
| 9 | Error Recovery | 2 | Banners not field-anchored; no retry path on failed save/delete |
| 10 | Help and Documentation | 2 | title-only tooltips (invisible on touch); no rollback-semantics help |
Total: 27/40 — Acceptable (top edge)

## Design Specificity Verdict
Authored for this factory, not category-interchangeable: SJ/EQ numbering, psg, Terbilang, .prn spool (OrderDetail.tsx:461), Pak Hendra aggregate drawer. Chassis still stock Tailwind admin; crimson lives as text accents not structure; status colors/stepper/CTAs speak in different dialects.
Deterministic scan: 0 findings (9 files, exit 0; validity verified via positive control, --no-config re-run, no impeccable-disable comments). Real issues are interaction-level, outside detector scope.

## Priority Issues
1. [P0] One-tap DISPATCH without confirmation (page.tsx:406, OrderDetail.tsx:407) — consumes BOM, undo requires reason-logged rollback; asymmetric with delete. Fix: lightweight confirm sheet reusing rollback modal pattern. Command: harden
2. [P0] Mobile feed lacks search/filter/empty/loading states (page.tsx:349-441) — Casey gets an unqueryable card wall; empty DB renders nothing on mobile. Fix: search + status chips in mobile header card; reuse OrderList empty/loading states. Command: harden
3. [P1] Invisible-on-focus print button + listbox a11y (OrderList.tsx:346, :295; OrderDetail.tsx:361) — opacity-0 group-hover without focus-visible; no roving tabindex; toasts not aria-live. Command: audit
4. [P1] Modals lack role=dialog/focus trap/Escape; global arrow handler fires beneath modals (OrderDetail.tsx:1131-1294, OrderList.tsx:87-120) — selection changes behind the delete dialog. Command: harden
5. [P2] Status color drift (StatusBadge.tsx:62 vs page.tsx:408; OrderDetail.tsx:644) — amber button vs violet badge; current step painted brand-red collides with red=danger. Fix: one status-to-color token map consumed everywhere. Command: colorize

## Persona Red Flags
- Casey (warehouse mobile, gloves): no mobile search/filter; sheet close ~34px below 44px floor (page.tsx:533); glove-brushable one-tap Kirimkan; Touch Size Pad buried behind Edit
- Alex (keyboard): arrow selection does not move focus; no Enter-to-advance; arrows fire while modals open
- Sam (screen reader): hover-only invisible button; listbox without roving tabindex; missing aria-live toasts; title-only tooltips

## What's Working
1. Rollback/cancel modal (OrderDetail.tsx:1174-1294) — model safety-valve pattern: status shown, audit promise, required reason
2. Domain texture: Terbilang, .prn spool with printer subtitle, EU 46-48 amber oversize columns
3. Filter chips with live counts + contextual empty state with Reset Filters (OrderList.tsx:262-285)

## Minor Observations
- EN/ID "Edit":"Edit" duplicate (OrderDetail.tsx:426); KPI card 3 conflates in-transit with completed count; delete lacks reason input unlike rollback; no swipe-dismiss on bottom sheet; toast and sheet share z-50; 6 filter chips (mitigated by counts)

## Questions to Consider
- If CANCELLED earns a banner and DISPATCHED consumes BOM, why does deletion get more ceremony than dispatch?
- Should the stepper current step ever wear the same red as danger?
- Does the size-aggregate drawer belong in the list rail or in Analytics?

## Emotional Journey / Cognitive Load
- Delete reassurance right (names document, honest); rollback modal is the emotional high point; Delivered earns only a 3-second toast — peak-end violation
- Cognitive load: 1 failure (one-thing-at-a-time: global arrows mutate selection under modal); 6 filter chips slightly over 4-option guideline (mitigated)
