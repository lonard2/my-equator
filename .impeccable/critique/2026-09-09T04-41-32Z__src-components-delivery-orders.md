---
target: the delivery order page
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-09T04-41-32Z
slug: src-components-delivery-orders
---
# Design Critique (Run 6) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 35/40 — Good (top edge)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Sticky badge, amber edit pill, countdown bars, spool verification gate |
| 2 | Match System / Real World | 4 | Terbilang, pasang, 3-ply plies, LX-310, SJ numbering |
| 3 | User Control and Freedom | 4 | Rollback <=3 genuine targets, DRAFT-only delete, autosave restore, Esc-clear |
| 4 | Consistency and Standards | 3 | Confirm-modal chrome diverges: crimson vs status vs plain headers |
| 5 | Error Prevention | 4 | PRINTED only via verified spool; beforeunload; reason-required rollback |
| 6 | Recognition Rather Than Recall | 3 | Raw enums leak: rollback grid, amber status line, success toasts |
| 7 | Flexibility and Efficiency | 4 | Roving listbox, /, Ctrl+Enter, Cmd+K, touch pad |
| 8 | Aesthetic and Minimalist Design | 2 | Mobile pre-content stack: KPI strip + brand card + Rekap toggle + 6 chips before first card |
| 9 | Error Recovery | 4 | Inline truth-gate errors, data-reassurance copy, verified-copy fallback |
| 10 | Help and Documentation | 3 | Kbd hints + CTA sublabels; no matrix-convention help |

## Design Specificity Verdict
Authored via domain artifacts (3-ply legend + perforations, Terbilang, print gate, paper-twin doctrine). Connective tissue default Tailwind admin: uniform rounded-xl tiles, crimson as accents not environment.
Deterministic scan: 0 findings (8th consecutive clean; positive control fired; no waivers).

## Priority Issues
1. [P1] Mobile detail header overflows (OrderDetail:709) — CTA+Edit+Print+More no-wrap pushes the only rollback/void route offscreen at 375px; also creates double-CTA with the sticky bottom bar. Fix: wrap or collapse Edit/Print into More below sm. Command: adapt
2. [P1] Stepper color-only state (OrderDetail:1016-1046) — aria-current present but passed/idle hue-only. Fix: sr-only state labels per node. Command: audit
3. [P2] Delivered "Triad Tanda Tangan Lengkap" claim unearned (DeliveredCeremonyModal:178) — reword to expected-on-physical-slip or capture proof. Command: harden/delight
4. [P2] TouchSizePad 6-control adjust row (TouchSizePad:103-157) — long-press +/- for x10, Reset into input clear. Command: distill
5. [P2] Enum leakage — labelId/labelEn tokens exist; rollback grid, amber line, toasts show raw enums. Command: clarify
6. [P3] Chip counts ignore active search (OrderList:169, page.tsx:351). Command: polish

## Persona Red Flags
- Casey: header overflow buries More; pre-content stack ~1/3 of first viewport; double CTA in sheet
- Alex: no list-to-action path (Enter opens detail only); / hint only in placeholder
- Sam: color-only stepper; desktop-only sublabels; More-menu focus not returned to trigger

## What's Working
1. Spool verification truth gate (SlipSpooledCeremonyModal:229-278)
2. Paper-twin doctrine in factory language (OrderDetail:1591,1717)
3. Keyboard craft (OrderList:92-166)

## Minor Observations
- STANDARD_SIZES redeclared in 4 files; toast close label ID-only in EN; py-0.2 not a real step; dispatch modal no driver/vehicle line when absent; rollback preset targets first silently

## Emotional Journey / Cognitive Load
- Delivered ceremony real peak but overclaims signature verification; ceremony family coherent, honesty asymmetric vs print gate
- Cognitive load: pad 6-control row; 6 chips; edit mode 3 concurrent decisions; KPI card 3 packs 3 counters; redundant Detail tap target

## Questions to Consider
- Should the KPI strip be a lifecycle pipeline instead of three totals?
- Always-visible card actions vs swipe-revealed row: accidental print risk?
- Does the DELIVERED ceremony deserve a proof step as rigorous as the print gate?
