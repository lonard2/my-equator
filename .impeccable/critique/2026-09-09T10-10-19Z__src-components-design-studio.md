---
target: the insole CAD studio
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/design-studio"
timestamp: 2026-09-09T10-10-19Z
slug: src-components-design-studio
---
# Design Critique (Run 5) — Insole CAD Studio

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 31/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Dirty pulse dot, per-button spinners, live zoom %, cursor mm readout |
| 2 | Match System / Real World | 4 | ACI layer audit with Color 1/3/4/7, calcaneal fat-pad tooltips |
| 3 | User Control and Freedom | 3 | Esc cascade + AI cancel good; zero undo/redo anywhere |
| 4 | Consistency and Standards | 3 | AI modal breaks the dialog system: own trap, crimson header, light body in a hard-locked dark studio |
| 5 | Error Prevention | 3 | Truth gate, beforeunload, export lock on open loop — undermined by silent input clamping |
| 6 | Recognition Rather Than Recall | 3 | Shortcuts dialog exists but omits Shift-fine-pan (275-290) |
| 7 | Flexibility and Efficiency | 3 | Ctrl+S, quick prompts, presets; no recents, no undo |
| 8 | Aesthetic and Minimalist Design | 3 | Organized density; number+slider duplication doubles the control count per parameter |
| 9 | Error Recognition and Recovery | 3 | Retry cards in Library and AI, honest offline template; save/export failures are toast-only |
| 10 | Help and Documentation | 3 | Anatomical + caliper explainers; no layer-semantics help beyond the audit legend |

## Design Specificity Verdict
Authored: true-mm grid, caliper channels color-locked to DXF ACI layers, sizing-system migration, real perimeter math, manifold-check CNC pre-flight. A tool built by someone who has watched a cutting table.
Deterministic scan: 0 findings (3rd consecutive clean); positive control PASS; no waivers.

## Priority Issues
1. [P1] Silent manualWidths latch — operator detaches widths from size with zero indication. Fix: inline "Manual — auto-recompute off" chip next to the Caliper header, clickable to re-enable. Command: harden
2. [P1] Overwrite + Shortcuts dialogs lack focus traps (2117-2160, 2163-2249) while Library/CNC/AI have them. Fix: reuse trapModalTab with cancelOverwriteRef. Command: audit
3. [P2] No wheel/pinch zoom — buttons-only zoom + touchAction:none denies reflexive gestures. Fix: onWheel zoom toward cursor. Command: adapt
4. [P2] Transient toast sole save/export failure channel — evaporates in 3.5s, work still dirty, no retry surface. Fix: persistent inline error card. Command: harden
5. [P2] Silent number clamping on keystroke (953, 1044, 1108, 1586). Fix: accept typed value, validate + clamp on blur. Command: clarify

## Persona Red Flags
- Pak Hendra: yield estimate buried two tabs deep in SPECS; AI quick prompts EN-labeled but permanently Indonesian-bodied
- Alex: arrow-key pan silently dies whenever focus is in any input (most of the time); Shift-fine-pan undocumented; no undo; no shortcuts for Library/tabs
- Sam: untrapped overwrite dialog (most dangerous); bottom dimension strip aria-live=polite re-announces entire strip on every slider tick — screen-reader flood; canvas single role=img, no keyboard interrogation

## What's Working
1. ACI color system spans three surfaces — canvas SVG, component cards, CNC audit legend
2. Dirty-state trio (pulse dot, truth gate, session draft) treats unsaved work as first-class
3. CNC pre-flight converts invisible failure into a visible, blocking gate

## Minor Observations
- 10px labels with no headroom; pre-flight export buttons lack 44px; toast z-60 overlays z-50 modals; pairGap 25mm never surfaced; mobile tab labels identical ID/EN

## Emotional Journey / Cognitive Load
- AI wait honest but spinner-only (staged feedback would soften 25s dead air); unsaved-work anxiety best-managed arc; export payoff peaks at emerald manifold banner but ends flat with a substance-free toast
- Cognitive load: manualWidths one-way latch silent; silent clamping (20 into Custom Length does nothing); no undo; 3.5s toast sole failure channel; 6-option sizing grid mitigated by auto-migration; ~14 live parameters just barely holds

## Questions to Consider
- If the canvas is the product, why is it the least keyboard-accessible surface in the tool?
- The manualWidths comment shows the system understands the trap — why doesn't the operator get to?
- Is a confidently over-stated emerald yield number better than a range that admits nesting loss?
