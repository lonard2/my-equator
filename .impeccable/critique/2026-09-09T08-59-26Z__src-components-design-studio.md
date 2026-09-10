---
target: the insole CAD studio
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/design-studio"
timestamp: 2026-09-09T08-59-26Z
slug: src-components-design-studio
---
# Design Critique (Re-run) — Insole CAD Studio

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 26/40 — Acceptable
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | AI generate no cancel/timeout; json.success===false yields zero feedback (CadAiModal:100) |
| 2 | Match System / Real World | 3 | Grid lies about mm; "Cancel, Save First" doesn't save (1788) |
| 3 | User Control and Freedom | 2 | No undo; Escape only when focus inside overlay (219-221) |
| 4 | Consistency and Standards | 2 | Laterality reuses red/emerald/blue owned by layers (757-789); dark mode hard-coded (521) |
| 5 | Error Prevention | 3 | Manifold gate + clamps good; garbage silently resets to defaults (726) |
| 6 | Recognition Rather Than Recall | 3 | Shortcuts title-only; no legend |
| 7 | Flexibility and Efficiency | 3 | Ctrl+S, +/-, 0; no Ctrl+Z, fit-view, keyboard pan |
| 8 | Aesthetic and Minimalist Design | 3 | Dense but disciplined; 13 params x duplicated input+slider |
| 9 | Error Recognition and Recovery | 2 | Save-failure toasts render with success tone (476, 480) |
| 10 | Help and Documentation | 2 | One anatomy tooltip in the whole studio |

## Design Specificity Verdict
Authored: sizing conversion, caliper mm, ACI layer audit, manifold gate, yield math. CAD substance wobbles: grid is fixed 20px CSS (neither pans nor zooms), no cursor mm readout, bg-gray-950 hard-coded outside the theme toggle.
Deterministic scan: 0 findings; positive control PASS; no waivers. Defects are semantic (wrong toast tone, silent else branch).

## Priority Issues
1. [P0] Save-failure toasts render with success tone (476, 480) — add "error" tone arg. Command: harden
2. [P0] AI modal silent failure — json.success===false re-enables the button with nothing said (CadAiModal:100). Fix: red error card with Retry. Command: harden
3. [P1] Dialog contracts decorative — overlay onKeyDown Escape only works with focus inside (219-221, 1551, 1649); no trap, no initial focus, no return. Fix: one dialog primitive with all four behaviors. Command: audit
4. [P1] Sizing-system switch does not migrate rawSizeValue (702) — EU 41 -> UK reads 41, nonsense length. Fix: convert-and-clamp on switch. Command: harden
5. [P2] "Cancel, Save First" doesn't save (1788) — rename "Keep editing" or make it save. Command: clarify

## Persona Red Flags
- Pak Hendra: AI silent-failure dead end; caliper widths wiped by size nudge (142-149); no undo after Yes-Overwrite
- Alex: Escape unreliable; no Ctrl+Z/fit-view/keyboard pan
- Sam: ten identical Load Model buttons, no blueprint name in accessible name (1630-1635); SVG no role/aria; HUD unannounced

## What's Working
1. CNC pre-flight: real geometry check gating real exports (1646-1758)
2. Layer color coherence canvas-chips-legend
3. mm numerics: tabular mono inputs, per-layer accents, unit suffixes

## Minor Observations
- Toast setTimeout never cleared; yield divisor magic (*2, +10); metatarsal Y no mm referent; z-60 vs z-50 drift

## Emotional Journey / Cognitive Load
- AI waiting dead air; worst beat: success:false -> nothing; CNC pre-flight genuine earned verification; overwrite gate correct doctrine
- Cognitive load: 6-option sizing grid raw enums; ~20 numeric controls duplicated input+slider; size change silently wipes caliper widths

## Questions to Consider
- Grid not mm-true, no cursor readout: CAD tool or parametric previewer wearing CAD chrome?
- Should a steel-cutting export tool have no undo?
- Distrust stops at the network error — why is stagedCad trusted blind?
