---
target: the digitizer page
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx"
target_fingerprint: "sha256:b3ab32a90d7dbb0c5421ef86f409b16a84535a6eb77d3560f42feed5ee3a8d9f"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx
timestamp: 2026-09-09T05-45-57Z
slug: rc-components-delivery-orders-archivedigitizer-tsx
---
# Design Critique (Re-run) — Archive & Paper Quick Digitizer

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 28/40 — Acceptable
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No OCR-pending state; progress banner (1287) not a live region |
| 2 | Match System / Real World | 3 | "Foto Slip" promises digitization, delivers manual typing; paste drops price columns |
| 3 | User Control and Freedom | 3 | Paste-append irreversible; clear-all destructive with no snapshot |
| 4 | Consistency and Standards | 2 | Two commit buttons; duplicate = amber chip on red row; emerald = both saved and staged |
| 5 | Error Prevention | 2 | No Ctrl+S re-entrancy guard; invisible default address on desktop; paste fabricates Rp 18.000 |
| 6 | Recognition Rather Than Recall | 3 | Photo never viewable; slip contents live in the user's head |
| 7 | Flexibility and Efficiency | 3 | Enter dead in non-size fields; ArrowUp/Down hijacked in date inputs (1791) |
| 8 | Aesthetic and Minimalist Design | 3 | 7-control header; GRID CEPAT decoration |
| 9 | Error Recovery | 3 | Failed rows retained with reason + SJ pills — best-in-file; paste notice-only |
| 10 | Help and Documentation | 3 | Shortcuts modal honest; camera affordance unexplained |

## Design Specificity Verdict
Grid half authored: collision-free SJ numbering with live duplicate memo (140-170), real datalists, EU-ordered paste mapper. Camera marquee is a facade: handleCapturePhoto (317-351) stages a defaulted empty row; photoPreviewUrl never rendered as an image (only badges 1373/1688). No OCR exists in this file.
Deterministic scan: 6 findings, all side-tab border-l-4 on the NEW per-row status rows. Verification: 4 colored = semantic state signals on a trust-sensitive path, keep (matches DESIGN.md Inset Indicator Rule; rule text should say "decorative accents" not ban state bars); 2 transparent = width reservations, false positives. No waivers.

## Priority Issues
1. [P0] Camera staging facade — no extraction, photo unviewable, name implies scan-to-digitize. Fix: render photoPreviewUrl in click-to-open panel + "Transkrip Manual" row label, or wire real AI Vision. Command: harden (honest) / delight (real OCR)
2. [P1] Desktop commits invisible default address (176, 334, 592; no column/input in thead 1590-1611). Fix: add column or row-detail popover; never commit what the primary view can't show. Command: harden
3. [P1] No save re-entrancy guard: Ctrl+S mid-commit starts a second loop -> duplicate DB rows. Fix: if (savingProgress) return at handleSaveBatch (621). Command: harden
4. [P1] Paste fabricates economics: unitPrice 18000 + default address on every pasted row (597). Fix: detect trailing numeric column as price, else flag "harga belum diisi" and block commit. Command: harden
5. [P2] Modal focus discipline: shortcuts (1129) and date-confirm (2017) modals lack traps; date modal Escape refocuses detached node (883-886). Command: audit

## Persona Red Flags
- Jordan: Foto Slip implies scan-to-digitize; emerald staged banner reads as success; two commit buttons
- Alex: paste rewrites prices; Ctrl+S double-fires; Enter no-op in customer/price fields
- Sam: no trap in shortcuts/date modals; date-input arrow hijack; progress unannounced
- Casey: capture correct + 44px verified; captured photo unviewable on the transcribing device

## What's Working
1. Date-overwrite truth gate + snapshot undo (254-301, 2016-2085)
2. Partial-failure recovery loop (849-868): retained rows, inline cause, SJ pills
3. Authored duplicate-SJ system (140-170, 685-770)

## Minor Observations
- isDirty dead code; URL.createObjectURL never revoked; stale-closure save loop (830, 839); amber chip + red tint conflict for duplicate state; crimson size-cell fills (1845) violate amber-data doctrine

## Emotional Journey / Cognitive Load
- OCR trust moment never occurs; commit reassurance strong; empty states good
- Cognitive load: 7-control header; 17 columns with sticky rescue; two identical commit buttons

## Questions to Consider
- Is "Foto Slip" honest until AI Vision lands, or should it be "Attach reference photo"?
- Why do saved (emerald row) and staged (emerald banner) wear the same color for opposite truths?
- Should Enter anywhere in a row make it one keystroke river?
