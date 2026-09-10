---
target: the insole CAD studio
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/design-studio"
timestamp: 2026-09-09T09-44-44Z
slug: src-components-design-studio
---
# Design Critique (Re-run) — Insole CAD Studio

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 30/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Library fetch no loading state -> false empty (1780); Save never in-flight (491) |
| 2 | Match System / Real World | 4 | pisau pond, kaliper, MONDOPOINT, pasang/lembar — native throughout |
| 3 | User Control and Freedom | 2 | No undo; leaving tab with unsaved work has no guard — truth gate covers in-app overwrites only |
| 4 | Consistency and Standards | 3 | dark: prefixes inside hard-coded dark shell (657, 1130); AI error card dark-only (CadAiModal 401) |
| 5 | Error Prevention | 3 | Export disabled on open loop excellent — but sizing change silently wipes caliper widths (159-166) |
| 6 | Recognition Rather Than Recall | 3 | Layer badges + legend strong; preset apply ~12 params zero preview |
| 7 | Flexibility and Efficiency | 3 | Shortcuts, dual entry, quick prompts; fixed 25px pan (232), no undo |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined; 7-hue bottom strip strains crimson doctrine |
| 9 | Error Recognition and Recovery | 3 | Retry cards, honest offline template, error toasts — failed save vanishes in 3.5s |
| 10 | Help and Documentation | 3 | Shortcuts dialog + tooltips; no first-run guidance |

## Design Specificity Verdict
Genuinely authored: six sizing systems with value migration (migrateSizingValue, L756 — prior finding truly fixed), caliper mm, ACI audit, manifold gate. One dishonesty: it is a parametric generator, not CAD in the editing sense — no point/spline manipulation.
Deterministic scan: 0 findings (2nd consecutive clean); positive control PASS; no waivers.

## Priority Issues
1. [P1] Sizing change resets caliper widths silently (L159-166) — manualWidths flag: once operator types a caliper value, stop auto-recompute; show auto/manual state. Command: harden
2. [P1] No unsaved-work guard on exit — isDirty exists, nothing listens for tab switch/unload. Fix: beforeunload + module-switch gate matching in-app truth gate. Command: harden
3. [P2] Dialog focus contract incomplete — AI/Library/CNC no trap/initial-focus/restore; onKeyDown on non-focusable wrappers dead code (296, 1727, 1826). Command: audit
4. [P2] Library false-empty during fetch (1780) — isLibraryLoading state. Command: harden
5. [P2] AI preview under-represents overwrite — 3 of ~17 params shown vs "overwrite all" warning. Command: clarify

## Persona Red Flags
- Pak Hendra: caliper reset on size change; preset cards show only archProfile (applies blind); yield ignores foot mode
- Alex: Ctrl+S no in-flight disable -> mash-saving duplicates (491-534); quick prompts not visually disabled while loading; no Shift-fine-pan
- Sam: modals do not capture focus — Tab escapes despite aria-modal; cursor-mm readout + zoom % visual-only, no live region

## What's Working
1. CNC pre-flight (1822-1935): verification-as-gate, disabled exports make safety real
2. Layer color encoding across four surfaces
3. Honest AI failure path: timeout, visible cancel, loud offline template with Discard

## Minor Observations
- AI error card bg-red-950/30 text-red-300 fails light-mode contrast (CadAiModal 401); customLengthMm empty snaps to 260 (787); toast region model pattern keep; save json.success correctly error-toned

## Emotional Journey / Cognitive Load
- AI waiting honest and recoverable (25s timeout, cancel, Escape); unsaved anxiety resolved inside studio but gone on tab exit; export payoff best beat in product
- Cognitive load: false empty state; silent caliper reset; AI preview 3-of-17; MONDOPOINT/CUSTOM cells cramp

## Questions to Consider
- If the canvas never allows point editing, is CAD the honest name — or Parametric Studio as a feature?
- Is the 6-option sizing grid worth a density exception, or EU + recently-used?
- Why not stream AI parameters as they resolve and let Pak Hendra watch the insole reshape?
