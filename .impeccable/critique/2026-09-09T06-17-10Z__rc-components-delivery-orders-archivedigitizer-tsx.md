---
target: the digitizer page
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx"
target_fingerprint: "sha256:0792971d0699979dbb605b11160b64600f4fa5b56f22e3f0d9646943685e2b1b"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx
timestamp: 2026-09-09T06-17-10Z
slug: rc-components-delivery-orders-archivedigitizer-tsx
---
# Design Critique (Run 4) — Archive & Paper Quick Digitizer

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 31/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No pre-commit per-row completeness signal; 50 rows identical until Ctrl+S fails |
| 2 | Match System / Real World | 4 | SJ numbering, pasang, EU grid, IDR, Transkrip Manual |
| 3 | User Control and Freedom | 3 | Paste ingest only undoable row-by-row |
| 4 | Consistency and Standards | 2 | Duplicate red border vs amber pill; 18000-vs-0 doctrine split; dual toast anchors |
| 5 | Error Prevention | 3 | Three-level duplicate guard undermined by fabricated Add-Row price |
| 6 | Recognition Rather Than Recall | 3 | Katalog Standar mapping invisible; grid shows only the code |
| 7 | Flexibility and Efficiency | 4 | Alt+N, Ctrl+S, Enter-commit, paste, date presets |
| 8 | Aesthetic and Minimalist Design | 3 | Amber carries three meanings; 5 header CTAs |
| 9 | Error Recovery | 3 | Offending cell not lit on invalid rows |
| 10 | Help and Documentation | 3 | Good modal + banner; touch-invisible title tooltips |

## Design Specificity Verdict
Strongly authored: collision-free SJ generation, vertical Enter-stepping, date presets, TSV paste with off-catalog mapping, manual-transcript photo contract. One generic tell: handleAddRow fabricates unitPrice 18000 (L184).
Deterministic scan: 6 findings, all sanctioned per-row status bars (3 mobile + 3 desktop), count stable, no new rules, no waivers.

## Priority Issues
1. [P1] Add-Row default unitPrice 18000 (L184) — stage at 0 like photo/paste; commit validation already blocks. Command: harden
2. [P1] modalOpen guard omits photoPreviewRowId (L965) — Ctrl+S/Alt+N fire behind the photo overlay. Command: harden
3. [P2] Field-level silence on invalid rows — price input (L1985-1996) and size cells lack the isInvalid treatment customer name got (L1921-1924). Command: audit
4. [P2] URL.revokeObjectURL on delete (L541) + undo restore = dead photo preview. Fix: defer revoke to buffer expiry/unmount. Command: harden
5. [P2] Desktop duplicate tint still red (L1796-1797 firstCellBorderClass co-lumps isInvalid || isBatchDuplicate); mobile and row-tint went amber in b3501e1. Command: colorize

## Persona Red Flags
- Jordan: L184 fabricated price inside her footer IDR total; Bandung default regardless of paper
- Alex: Ctrl+S commits behind the photo overlay; tab-containing cell paste hijacks; shortcuts modal overclaims Enter-commit
- Sam: no aria-invalid anywhere; failure reason only via title (L1895); ~50 live-region updates on commit
- Casey: Manual cue gone below lg (L1838); delete-undo kills photo preview (L541); batch total hidden below sm (L2083)

## What's Working
1. Empty states teach the three intake paths with exact shortcuts (L1757-1779)
2. Paste stages honestly: price 0 + commit-blocking notice (L636-642, 670-688)
3. Duplicate SJ at three layers (live memo, commit guard, DB pre-check)

## Minor Observations
- Two undo toasts two anchors; no commit-confirmation summary; handleClearAllRows stale-closure add-row; max-h-[650px] arbitrary; aria-invalid missing; Katalog Standar label invisible

## Emotional Journey / Cognitive Load
- Commit beat best (IDR footer L2052-2072, per-SJ progress, staged-vs-committed banner split); photo moment let down twice (revoked URL, 12px badge); Jordan trust broken by 18000 in her IDR total
- Cognitive load: 7-state row model on 4 channels; duplicate+invalid co-render ambiguity; 3 defect classes in one row-number list

## Questions to Consider
- Why trust a pasted price at 0 but a hand-typed price at 18000 — what did the clerk verify?
- If clearing earns a confirm modal, why does committing IDR X million get none?
- When duplicate and invalid both paint red, what is amber allowed to own?
