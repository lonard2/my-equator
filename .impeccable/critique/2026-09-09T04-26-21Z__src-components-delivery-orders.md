---
target: the delivery order page
total_score: 35
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-09T04-26-21Z
slug: src-components-delivery-orders
---
# Design Critique (Run 5) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 35/40 — Good (one point from Excellent)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Dispatch guard fire-and-forget: modal closes before server truth |
| 2 | Match System / Real World | 4 | Surat Jalan, armada, 3-ply plies, factory-native copy |
| 3 | User Control and Freedom | 4 | Rollback, discard modal, autosave restore, Esc-clear, Esc-close |
| 4 | Consistency and Standards | 3 | buttonClasses.split(" ")[0] header hack (DispatchConfirmModal:65); hardcoded EN mode labels (OrderDetail:1196) |
| 5 | Error Prevention | 3 | Guards excellent; dispatch confirm resolves instantly, spinner never shows |
| 6 | Recognition Rather Than Recall | 4 | Live-count chips, aria-current stepper, CTA sublabels, "/" hint |
| 7 | Flexibility and Efficiency | 4 | /, Cmd+K, Ctrl+Enter, roving arrows, presets |
| 8 | Aesthetic and Minimalist Design | 3 | Red = brand + selection + data-present + danger + error simultaneously |
| 9 | Error Recovery | 3 | Persistent toasts + rollback-stays-open good; clipboard toasts success on failure (OrderDetail:333) |
| 10 | Help and Documentation | 4 | Inline docs at the decision point: paper-twin, ESC/P badge, rollback semantics |

## Design Specificity Verdict
Unmistakably authored: SJ/EQ, No. SJ/PO/Sopir search, 3-ply legend, tractor perforations, paper-twin doctrine. Residue: KPI strip is category-generic admin chrome (page.tsx:393-441).
Deterministic scan: 0 findings (6th consecutive clean; positive control fired, exit 2; no waivers).

## Priority Issues
1. [P1] Dispatch confirm is not a truth gate (page.tsx:1115-1120, DispatchConfirmModal:42-50, OrderDetail:1807-1811) — onConfirm does not await the boolean; modal closes, rejection arrives as late toast. Fix: await result; on false keep modal open with inline error + retry, like rollback. Command: harden
2. [P2] Red semantic overload — selection (OrderList:389), filled size cells (OrderDetail:1280), +200 preset (TouchSizePad:182), cancel/void, errors share crimson with brand. Fix: red reserved for danger; neutral/amber for data-present. Command: colorize
3. [P2] Rollback modal >4-option decision (OrderDetail:1717) — drop CANCELLED from the grid (own More-menu entry), show only availableRollbacks. Command: distill
4. [P2] Seven status chips per filter row (page.tsx:503, OrderList:275) — collapse DELIVERED+CANCELLED into Selesai/Arsip or overflow. Command: distill
5. [P3] Clipboard false success + save-error banner lacks role=alert (OrderDetail:333, 917). Command: harden

## Persona Red Flags
- Casey: Tiba di Lokasi card button lacks icon (page.tsx:766); dispatch closes unverified; mobile search lacks Esc-clear
- Sam: More-menu no role=menu (OrderDetail:773); save-error banner unannounced (OrderDetail:917)
- Alex: slash/Esc parity missing in mobile feed

## What's Working
1. PRINTED as a verification gate (SlipSpooledCeremonyModal:47,229)
2. Ceremony family texture: perforations + 3-ply legend
3. Casey ergonomics as reflex: 44px, thumb bar, autosave-restore

## Minor Observations
- split(" ")[0] fragility; preset colors import status semantics; duplicate filter/search implementations will drift; 4s ceremony dismiss brisk; 10px labels vs compact density tier

## Emotional Journey / Cognitive Load
- Ceremony family coherent; dispatch confirm is the seam (closes as done, error arrives later)
- Cognitive load: rollback grid 5 options + textarea; 7 filter chips; TouchSizePad 6-control adjust row (saved by cluster label)

## Questions to Consider
- Should every confirm modal adopt the stays-open-on-rejection gate?
- What does crimson still mean if it does five jobs?
- Should PRINTED-verification record which ply was checked?
