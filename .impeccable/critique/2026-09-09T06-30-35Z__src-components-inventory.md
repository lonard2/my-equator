---
target: the material stock page
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/inventory"
timestamp: 2026-09-09T06-30-35Z
slug: src-components-inventory
---
# Design Critique — Material Stock (Inventory) Surface

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 31/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | loading (InventoryDashboard.tsx:56) set but never rendered; failed fetch shows fake "no matches" |
| 2 | Match System / Real World | 4 | EVA/Latex/TPU taxonomy, pisau pond, Stock Opname, KOR refs — flawless factory vocabulary |
| 3 | User Control and Freedom | 3 | Discard guards + 1-click offset excellent; no undo for plain delete |
| 4 | Consistency and Standards | 3 | Raw enum IN_PURCHASE leaks into log badges (:1115, :1190); filter pills rounded-xl vs pills-full |
| 5 | Error Prevention | 3 | Live projection + disabled submit great — but ADJUSTMENT clamps qty >=1 (:364): SET=0 impossible |
| 6 | Recognition Rather Than Recall | 4 | / hint, Alt+K chips, safety threshold under badge |
| 7 | Flexibility and Efficiency | 3 | Accelerators real; movement SKU picker unsearchable native select (:295-307); log unbounded |
| 8 | Aesthetic and Minimalist Design | 3 | Sparkles on non-AI feature; arrow glyph; Total Movements KPI in unlicensed 4th hue |
| 9 | Error Recognition and Recovery | 2 | Delete failure swallowed silently (:183-188); fetch failure masquerades as empty filters |
| 10 | Help and Documentation | 3 | Shortcuts modal + tooltips |

## Design Specificity Verdict
Strongly authored: EVA/Latex/PU/TPU/Fabric/Cutting-Die taxonomy, KOR/ bookkeeping, Gudang A - Rak 01 defaults, BOM drawer in Pak Hendra's language (sheets per 1000 pairs + per-pair cost). Top-decile domain fidelity; gaps are state handling, not voice — this surface predates the hardening patterns DO and Digitizer already shipped.
Deterministic scan: exit 0, 4 advisories (9px kbd chips :389/:400/:414/:719 — mechanically true vs the 10px floor, low impact; archive previously sanctioned 9px for 8px — unrecorded convention). Positive control PASS; no waivers.

## Priority Issues
1. [P0] No loading/error states on the main table — loading never rendered; failed fetch shows "No materials match filters" (a lie on slow warehouse Wi-Fi, announced as truth by SRs). Fix: skeleton rows on first load + distinct error card with retry (DO surface pattern). Command: harden
2. [P0] Zero-count stock opname impossible — Math.max(1, ...) (:364) blocks SET=0, the exact scenario an adjustment records. Fix: floor of 0 when direction === "SET". Command: harden
3. [P1] Dueling primaries — Stock IN/OUT and Add SKU both solid crimson (:392-415); Casey's all-day verb deserves the only filled button, Add SKU is rare admin -> outline. Command: colorize
4. [P1] Movement log does not scale + enum leak — raw IN_PURCHASE badges (:1115, :1190), no date filter, unbounded map at 200+ SKUs. Fix: MOVEMENT_TYPES labels + period filter. Command: harden
5. [P2] Tablet hits the icon-only table — cards vanish at md; ~28px icon targets mid-breakpoint. Fix: extend card feed to lg or fatten hit areas. Command: adapt

## Persona Red Flags
- Casey: 200-row native select SKU picker when opening from header/BOM restock; Staff Gudang operator default not persisted per-user; 3s toast short for gloved reading; delete failure = silence
- Pak Hendra: BOM article locked to presets; no export/print of BOM results; critical banner restock button only targets criticalItems[0] (N items, one action)
- Sam: sortable th are click-divs (no aria-sort, no keyboard activation); movement-type group plain buttons (no arrows/aria-pressed); MaterialFormModal + delete/discard modals lack role=dialog/aria-modal/focus trap

## What's Working
1. Live projection panel (StockMovementModal:384-424) — before/after + transaction value: guardrail-not-scold done right
2. 1-click offset correction (InventoryDashboard:198-214) — pre-filled inverse type/qty/KOR: real double-entry thinking
3. Full bilingual parity with domain nouns (psg, lembar, opname)

## Minor Observations
- THICKNESS_PRESETS/HARDNESS_PRESETS declared never rendered (dead spec UI); isDirty ignores SKU/category/unit-only edits; KOR/ + Stok: hardcoded Indonesian; critical banner restocks only criticalItems[0]; arrow glyph; Sparkles on non-AI feature

## Emotional Journey / Cognitive Load
- Mutation moment best-in-app (projection + ledger flash + toast); low-stock anxiety converts to action (red banner -> restock CTA, amber filter pill) but banner has no acknowledge/mute — red wallpaper with chronically low SKUs; BOM payoff ends at the screen (no print/export)
- Cognitive load: movement-type grid 5 uniform cards differentiated only by color; 3 header actions where 2 share identical styling; 9-col table x 3 icon actions per row

## Questions to Consider
- Would a 1-second "990 -> 1.040 lembar checked" beat the toast as the memorable confirmation?
- Who decides anything from "Total Movements" they could not decide from the log tab — why is it on the KPI row in blue?
- At 200+ SKUs, is the native select the defining bottleneck — is a command-palette SKU finder the honest fix?
