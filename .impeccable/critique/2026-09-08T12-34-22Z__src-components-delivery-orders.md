---
target: the delivery order page
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-08T12-34-22Z
slug: src-components-delivery-orders
---
# Design Critique (Re-run) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 31/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No pending state on confirm buttons; failures surface as native alert() (page.tsx:216, 235) |
| 2 | Match System / Real World | 4 | Tiba di Lokasi, Terbilang, triad signatures, continuous-form copy — superb |
| 3 | User Control and Freedom | 3 | Edit-mode Cancel silently discards (OrderDetail.tsx:593); delete permanent, no void/archive |
| 4 | Consistency and Standards | 3 | statusColors.ts real token map, but mobile CTAs hardcode purple/emerald; DispatchConfirmModal:88 hardcodes amber |
| 5 | Error Prevention | 3 | Dispatch guard excellent; Cetak Slip offered for DRAFT/CANCELLED (page.tsx:587) |
| 6 | Recognition Rather Than Recall | 3 | .PRN spool buried in More menu; TouchSizePad two-step |
| 7 | Flexibility and Efficiency | 3 | Cmd+K, arrows, Grid/TouchPad; no Ctrl+Enter save in edit |
| 8 | Aesthetic and Minimalist Design | 3 | KPI card accents (blue/amber/purple) steal status-color meanings |
| 9 | Error Recovery | 3 | Banner with Retry/Dismiss good — undermined by alert() dual language |
| 10 | Help and Documentation | 3 | Shortcut footer + sublabels; no prose help on stepper rollback semantics |

## Design Specificity Verdict
Still authored, not generated: SJ/EQ mono numbering, psg, Terbilang, EU 46-48 jumbo reveal, .PRN ESC/P spool (OrderDetail.tsx:517). Guard + ceremony modals deepen the voice ("cartons loaded, handed to driver"). Chassis still stock admin; crimson lives mostly in one token.
Deterministic scan: 0 findings (9 files, exit 0). Positive control fired (4 findings, exit 2, cleaned up); no impeccable-disable waivers. Caveat: detector TSX mode is regex-narrower than HTML mode, so clean TSX carries slightly less confidence. Findings below are interaction-class, outside detector scope.

## Priority Issues
1. [P1] Two error languages: native alert() for status/delete failures (page.tsx:216, 235-239) — route all failures through the existing toast/banner pattern. Command: harden
2. [P1] Print quick-actions unconditioned by status (page.tsx:587 mobile; OrderList.tsx:395 list) — status-gate with disabled + reason ("Konfirm dulu untuk cetak resmi"). Command: harden
3. [P2] KPI accent colors collide with status semantics — neutral cards or map to true status tokens. Command: colorize
4. [P2] Filter vocabulary drift: mobile 7 chips vs desktop 6 (no CANCELLED), different order; Konfirm vs Terkonfirmasi. Command: distill
5. [P2] Stepper lacks aria-current="step" (OrderDetail.tsx:692-739). Command: audit

## Persona Red Flags
- Casey (warehouse mobile, gloves): filter chips min-h-[34px] (page.tsx:451), search-clear ~26px (page.tsx:429-437), TouchSizePad steppers ~30px (TouchSizePad.tsx:98-139) — all below 44px; ceremony 4s auto-dismiss closes mid-glance; mid-edit tab switch discards edit state
- Alex (keyboard): nested focusable print button inside listbox options (OrderList.tsx:395) breaks roving tabindex; no Ctrl+Enter save; alert() steals focus
- Sam (screen reader): search inputs placeholder-only named (page.tsx:421, OrderList.tsx:246); stepper lacks aria-current; DispatchConfirmModal autofocuses confirm button (should land on Cancel)

## What's Working
1. statusColors.ts single source of truth — badge, stepper, CTA derive from one token map
2. DispatchConfirmModal — current-to-target strip, driver + plate recap, consequence copy
3. DeliveredCeremonyModal — emerald ceremony, triad-verified pill, countdown, correct focus trap + restore

## Minor Observations
- Copy-order-number micro-interaction (OrderDetail.tsx:427-439) quietly excellent
- Type floor 9-10px hard-coded sizes not remapped by density modes
- Mobile search covers driverName, desktop search does not
- window.open .prn gives no download feedback beyond toast

## Emotional Journey / Cognitive Load
- Peak-end engineered: DeliveredCeremonyModal is the best moment; print ritual still has none; delete blind to orphaned paper twin of PRINTED orders; Edit-Cancel silently discards
- Cognitive load: 7 mobile filter chips (desktop 6, divergent vocab); mobile card is 3-clickable-zone sandwich; TouchSizePad ~10 grouped controls (heavy but grouped)

## Questions to Consider
- What does a "slip spooled" moment look like for the LX-310 paper-load ritual?
- Should a PRINTED surat jalan be deletable when a signed paper counterpart exists, or "Void & archive"?
- Does any surface answer the warehouse's 7am question: "what's ready to load today?"
