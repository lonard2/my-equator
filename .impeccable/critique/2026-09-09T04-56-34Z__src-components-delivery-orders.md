---
target: the delivery order page
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-09T04-56-34Z
slug: src-components-delivery-orders
---
# Design Critique (Run 7) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)
Run disclosure: Assessment A flagged two regressions from recent fix passes, verified real and hotfixed during this run as 018379c before synthesis: (1) f452521 left a duplicate plain + button beside the hold-to-x10 one; (2) c2c6cec missed view-mode matrix cells (still crimson).

## Design Health Score: 34/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Every mutation calls fetchOrders: full list flashes skeleton mid-ceremony (page.tsx:163-186) |
| 2 | Match System / Real World | 4 | Kirimkan ke Armada, 3-ply ply names, paper-twin explanation |
| 3 | User Control and Freedom | 3 | Rollback only in More menu; no undo affordance on status toast |
| 4 | Consistency and Standards | 3 | View-mode crimson (hotfixed); animate-status-pulse vs calm-status rule |
| 5 | Error Prevention | 4 | isDirty+autosave+beforeunload, DRAFT-only delete, spool-gated PRINTED |
| 6 | Recognition Rather Than Recall | 4 | Search-aware chip counts, kbd hint, / placeholder, subLabels |
| 7 | Flexibility and Efficiency | 3 | Touch Pad two clicks deep; no bulk dispatch |
| 8 | Aesthetic and Minimalist Design | 3 | Mobile pre-content stack; crimson-sea table (hotfixed) |
| 9 | Error Recovery | 4 | Stay-open truth gates, retry banner, autosave-restore toast |
| 10 | Help and Documentation | 3 | Good microcopy; no help entry point; title tooltips invisible to touch |

## Design Specificity Verdict
Authored via ceremony artifacts (perforations, 3-ply legend, paper-twin semantics, honest triad copy). Weakest point: color discipline — status-rainbow chips on generic shell.
Deterministic scan: 0 findings (9th consecutive clean; positive control fired; no waivers).

## Priority Issues
1. [P1] Dishonest spool headline on the download path (OrderDetail:376-387): ceremony claims "terkirim ke antrean printer" for a browser download; PRINTED can be marked without printing. Fix: ceremony copy/variant keyed to download vs spool. Command: harden
2. [P2] TouchSizePad hold gives zero visual feedback during the 450ms wait. Fix: visible hold cue. Command: animate
3. [P2] Filter chip selected state visual-only (page.tsx:539, OrderList:283). Fix: aria-pressed. Command: audit
4. [P2] Toast ergonomics: ~20px dismiss at top-right. Fix: 44px dismiss, bottom placement on mobile. Command: adapt
5. [P3] List flash on every mutation (fetchOrders refetch). Command: optimize

## Persona Red Flags
- Casey: no hold feedback; Rekap toggle + jumbo toggle sub-44px; toast close unreachable mid-sheet; KPI line glove-scroll
- Alex: no CTA accelerator; chips click-only; More menu Tab-only despite role=menu
- Sam: chip selected state unannounced; ceremony countdown visual-only

## What's Working
1. Ceremony authenticity (perforations + ply legend)
2. Single token source (STATUS_COLOR_MAP everywhere)
3. Interruption-safe editing stack

## Minor Observations
- DispatchConfirmModal mounted twice (drift risk); max-md:opacity-100 dead code (container hidden md:flex); pl-8.5 off-rhythm; red-tinted Terbilang panel; oversized toggle 11px text; .impeccable/design.json sidecar stale (document would refresh)

## Emotional Journey / Cognitive Load
- Ceremony family coherent; spool celebrates before asking (whiplash on Belum); persistent error toasts top-right thumb-hostile
- Cognitive load: 6 chips; 5-stat KPI line; pad row 5 controls at review time (4 after hotfix)

## Questions to Consider
- What would a two-tap stepper directly on the card look like for Casey?
- Which single moment has earned crimson?
- Would a two-tier filter (lifecycle stage + archived) beat six chips?
