---
target: the insole CAD studio
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/design-studio"
timestamp: 2026-09-09T06-49-50Z
slug: src-components-design-studio
---
# Design Critique — Insole CAD Studio

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 23/40 — Acceptable (weakest surface; highest stakes)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No dirty/unsaved state; Ctrl+S no in-flight feedback; CNC verified is unconditional green (1574-1577) |
| 2 | Match System / Real World | 3 | Hardcoded Indonesian breaks EN: footer HUD (1093-1107), AI labels (CadAiModal 310-329) |
| 3 | User Control and Freedom | 2 | Preset/load/AI overwrite 15+ params silently; no undo, no confirm (205-276) |
| 4 | Consistency and Standards | 3 | Radius + 10px floor held; toast always emerald CheckCircle2 even on failures (470) |
| 5 | Error Prevention | 2 | Blueprint load destroys work with zero guard (224-248); inputs silently clamp (736) |
| 6 | Recognition Rather Than Recall | 3 | Layer triplet strong; zoom keys title-only |
| 7 | Flexibility and Efficiency | 3 | Ctrl+S, zoom keys, quick prompts; Keyboard icon imported but no shortcut sheet |
| 8 | Aesthetic and Minimalist Design | 2 | Sidebar + HUD + SPECS repeat identical numbers; ~100 duplicated SVG lines |
| 9 | Error Recovery | 1 | Blueprint fetch failure silent = fake empty; AI catch fabricates a design as success (CadAiModal 162-184) |
| 10 | Help and Documentation | 2 | One anatomy tooltip; no grid legend, DXF primer, shortcut help |

## Design Specificity Verdict
Authored where it counts: mm tabular inputs, live HUD, five sizing systems with real conversion, EVA yield math (1454), layer-color coherence canvas-to-DXF (ACI 7/1/3/4). Authority partly staged: Pre-Flight verification is hardcoded theater (1574-1577), mm grid decoupled from zoom (857-868), AI fallback fabricates.
Deterministic scan: 0 findings; positive control PASS; no waivers. Problems are semantic lies — invisible to static analysis.

## Priority Issues
1. [P0] Silent data destruction — load/preset/AI overwrite unsaved work; no dirty flag, no confirm, no unsaved dot. Fix: dirty flag + truth-gate confirm + unsaved dot. Command: harden
2. [P0] Fake verification + fabricated AI — unconditional manifold green; AI catch invents EU 42 High Arch as success. Fix: compute real closed-loop check from outlinePoints; fallback labeled Offline template with apply/discard choice. Command: harden
3. [P1] Broken error semantics — failure toasts show success icon (470); library load failure invisible (140). Fix: severity-variant toast; library error state. Command: harden
4. [P1] Mobile Export tab lands wrong panel — EXPORT view reveals sidebar at last-active inspectorTab. Fix: sync inspectorTab SPECS on Export. Command: adapt
5. [P2] EN mode leaks Indonesian — footer HUD + AI labels hardcoded. Command: clarify

## Persona Red Flags
- Pak Hendra: fake manifold check trusted before cutting steel; yield formula assumes zero nesting waste; unitless 1.0x factors; silent preset overwrites
- Alex: no shortcut sheet; no Ctrl+wheel zoom/arrow pan/pinch; ESC closes nothing; unquantized zoom steps
- Sam: pointer-only canvas pan; SVG lacks role/aria; modals lack role=dialog/trap/Escape; zoom buttons title-only

## What's Working
1. Layer-color coherence: canvas -> chips -> DXF audit, one language screen-to-machine
2. Numerals as interface: mono tabular mm, live HUD, yield estimate
3. Mobile 4-step workflow (547-584)

## Minor Observations
- ~13 unused icon imports; red Library badge (crimson = danger doctrine); SVG text fontSize 7 illegible; z-60/z-50 drift; savedBlueprints any[]; articleCode from Date.now() collision-prone

## Emotional Journey / Cognitive Load
- AI waiting: text swap only; CNC payoff counterfeit; unsaved anxiety unmitigated
- Cognitive load: 6-option sizing selector equal weight; three identical overwrite actions; mobile EXPORT lands wrong panel; no dirty indicator

## Questions to Consider
- If the manifold check can never fail, what is Pak Hendra verifying — geometry or UI self-confidence?
- Whose foot absorbs the AI-fallback error?
- Would a machinist trust a caliper that rewrites values outside 70-130mm?
