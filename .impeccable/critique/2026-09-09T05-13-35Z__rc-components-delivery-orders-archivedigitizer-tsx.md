---
target: the digitizer page
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx"
target_fingerprint: "sha256:f4d6082635d8d2e71aea023e60885871ec686f71f8376d38cef171390115a4fd"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx
timestamp: 2026-09-09T05-13-35Z
slug: rc-components-delivery-orders-archivedigitizer-tsx
---
# Design Critique — Archive & Paper Quick Digitizer (ArchiveDigitizer.tsx)

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 29/40 — Acceptable
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Per-row status/errorMessage assigned (393-451) but never rendered in any row |
| 2 | Match System / Real World | 3 | SJ/EQ scheme, psg, customer datalist — genuine factory vocabulary |
| 3 | User Control and Freedom | 3 | Offset chips rewrite ALL row dates silently, no undo (136-142) |
| 4 | Consistency and Standards | 2 | Chips apply instantly vs picker needing separate Apply All — two models, one job |
| 5 | Error Prevention | 2 | No duplicate order-number detection; paste invents off-catalog articles silently |
| 6 | Recognition Rather Than Recall | 3 | Editable orderNumber styled like a read-only crimson label (945-950) |
| 7 | Flexibility and Efficiency | 4 | Alt+N, Ctrl+S, Enter/Down spawn, Ctrl+V paste |
| 8 | Aesthetic and Minimalist Design | 3 | Header ~8 controls; destructive Mulai Bersih beside Help |
| 9 | Error Recovery | 3 | Dismissed banner orphans failed rows (status:"error" never rendered) |
| 10 | Help and Documentation | 3 | Cheat sheet modal with Escape + focus return — model craft |

## Design Specificity Verdict
More authored than generic: vertical column-stepping with auto row-spawn (185-209), sticky per-size tfoot totals (1038-1058), TSV paste (272-315). But "Quick Digitizer" promises OCR/camera staging and contains none — a batch grid wearing the digitizer's title. Every committed DO carries unitPrice 18000 no human ever saw or set.
Deterministic scan: 0 findings (1140 lines, exit 0; positive control fired; no waivers).

## Priority Issues
1. [P0] Per-row save status never rendered — status/errorMessage written (393-451), never read in JSX; partial failures strand users between duplicate-creation and abandonment. Fix: per-row state chip/left border; failed SJ numbers in retained banner. Command: harden
2. [P0] Mobile feed commits silent defaults — cards lack article/date/price/address inputs (841-896); Casey ships DOs with defaults she never saw. Fix: surface inherited defaults explicitly on mobile cards. Command: harden
3. [P1] Duplicate order numbers unchecked — free-text SJ + post-partial-save renumbering (rows.length+10, 297) collide with just-saved rows. Fix: warn on in-batch or DB SJ collision before commit. Command: harden
4. [P1] Offset chips overwrite 50 rows' dates without confirmation or undo (136-142). Fix: confirm when any row date differs, or touch only rows equal to the previous global date. Command: harden
5. [P2] Enter never commits a row — module AGENTS.md specifies Enter commits; Enter only steps columns (185-209). Fix: Enter in last size cell = commit-and-next-row. Command: distill

## Persona Red Flags
- Jordan: no price column (revenue-bearing slips digitized blind); Mulai Bersih vs "Clear entire worksheet" naming mismatch; SJ field reads as label
- Alex: Enter doesn't commit per spec; ArrowUp/Down dead outside size cells; querySelector + 60ms setTimeout race (200-208)
- Sam: clear-confirm lacks role=dialog/aria-modal/focus trap; error banner not aria-live; hardcoded Indonesian aria-labels in EN mode (1000, 886); delete buttons ~28px
- Casey: zero camera/OCR affordance on mobile; missing fields in card feed; commit buried below table

## What's Working
1. Vertical stepping that spawns rows (185-209) — the rhythm of transcribing a slip stack
2. Sticky tfoot per-size column sums (1038-1058) — manifest cross-check without leaving the sheet
3. Excel paste as first-class citizen (272-315) with priming tip banner

## Minor Observations
- Paste copy "Berhasil mengimpor" overclaims (rows are staged); double scrolling (page + max-h-650 table); BATCH pill restates title; handleRowChange typed any; undo toast bottom-20 may collide with sticky bar; generated sequences restart after failure

## Emotional Journey / Cognitive Load
- OCR/AI waiting states absent by omission; batch commit banner with live counter + receipt readback (457-461) genuinely reassuring; failure recovery leaves failed rows invisible
- Cognitive load: date cluster = 5 controls for one question (chips have no active state, 582 permanently styled on); Mulai Bersih is a destructive neighbor dressed as utility; missing empty state; mobile feed omits fields

## Questions to Consider
- If camera-OCR staging is the product's soul, why does its named surface contain none of it?
- Who owns the unit price — every DO carries an amount no human saw or chose?
- When 48 of 50 save and 2 fail, what does the screen say about which two — and should Ctrl+S work without that answer?
