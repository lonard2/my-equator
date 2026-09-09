---
target: the delivery order page
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-09T04-13-27Z
slug: src-components-delivery-orders
---
# Design Critique (Run 4) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)
Run disclosure: Assessment A flagged a conditional-hooks crash risk on login (hooks after the !currentUser early return, introduced in 77f5f5b). Verified real, hotfixed, pushed as f4a9a73 during this run before synthesis.

## Design Health Score: 33/40 — Good (top of band)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Rollback path reports false success (handleExecuteRollback awaits onStatusChange which never throws; rollbackError dead code) |
| 2 | Match System / Real World | 4 | psg, Terbilang, 3-ply legend, Tiba di Lokasi — fluent factory language |
| 3 | User Control and Freedom | 3 | Autosave restore only surfaces on next Edit tap; no persistent unsaved-draft cue |
| 4 | Consistency and Standards | 3 | Mobile bottom nav (5 tabs) omits Digitizer & Tax vs desktop sidebar |
| 5 | Error Prevention | 4 | Print gate, DRAFT-only delete, rollback reason, discard modal — exemplary |
| 6 | Recognition Rather Than Recall | 3 | Disabled-print reason is hover-only title — invisible on touch |
| 7 | Flexibility and Efficiency | 4 | Cmd+K, roving arrows, Home/End, Ctrl+Enter save, +50/+100/+200 pad |
| 8 | Aesthetic and Minimalist Design | 3 | Counts repeated 3x (KPI strip, mobile header, list footer) |
| 9 | Error Recovery | 3 | Good retry banners; rollback error branch unreachable |
| 10 | Help and Documentation | 3 | Strong inline hints; CTA sublabel hidden lg:block drops it on tablet |

## Design Specificity Verdict
Genuinely authored: ESC/P spool ceremony with tractor perforations + 3-ply legend, paper-twin doctrine, Terbilang, LX-310 naming. Two ceremonies visibly one family. Shell remains Tailwind-gray chrome; crimson survives as accent tints.
Deterministic scan: 0 findings (4th consecutive clean; positive control fired, exit 2; no waivers). Issues are behavioral.

## Priority Issues
1. [P1] False success on rollback/void (OrderDetail.tsx:568) — onStatusChange never throws; rollbackError dead code; success toast unconditional. Fix: onStatusChange returns result; gate modal close + toast. Command: harden
2. [P1] Primary CTA at screen-top of the mobile 90vh sheet (OrderDetail.tsx:633) — Casey's thumb lives at the bottom. Fix: sticky bottom action bar. Command: adapt
3. [P1] Hover-only title for disabled print (page.tsx:722) — no aria-label; reason invisible to touch/SR. Fix: aria-label + visible micro-copy. Command: harden
4. [P2] Touch pad control sprawl: 9 controls in one row (TouchSizePad.tsx:98-178). Fix: two labeled clusters or presets behind x10. Command: distill

## Persona Red Flags
- Casey: CTA top-of-sheet; draft restore announces only on next Edit tap; toast top-right out of thumb zone; Buat DO 40px (page.tsx:464) under 44px
- Alex: search no "/" shortcut or Esc-to-clear; list print hover-revealed (OrderList.tsx:417); no bulk dispatch/print
- Sam: listbox semantics correct now; rail-toggle/Rekap title-only; disabled-print reason unannounced on mobile

## What's Working
1. Print verification gate (SlipSpooledCeremonyModal.tsx:229-277) — PRINTED only after physical confirmation, 3-ply check spelled out
2. Single status-token source (STATUS_COLOR_MAP) — badge/CTA/stepper/ceremony one vocabulary
3. Interruption stack: autosave, restore toast, discard modal, beforeunload

## Minor Observations
- Error/success toasts share 4s timer (errors should persist); z-60/z-70 off-scale; desktop search ~30px; DispatchConfirmModal hardcodes purple/emerald; clipboard no fallback

## Emotional Journey / Cognitive Load
- Peak-end handled: Delivered peak, spool gate is the emotional high point (status becomes physical truth); valley: rollback modal same crimson for reversible correction and destructive void
- Cognitive load: TouchSizePad 9 controls ungrouped; mobile filter 7 chips; detail header and More menu at exactly 4 (defensible)

## Questions to Consider
- Should DISPATCHED demand evidence (truck photo, waybill) like PRINTED now demands verification?
- Should KPI counts be tap-to-filter triggers — summary as action?
- Is card + two actions Casey's entire mobile job, and should the sheet be rebuilt around that?
