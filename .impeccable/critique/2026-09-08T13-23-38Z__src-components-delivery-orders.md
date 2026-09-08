---
target: the delivery order page
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders"
timestamp: 2026-09-08T13-23-38Z
slug: src-components-delivery-orders
---
# Design Critique (Run 3) — Delivery Orders Page

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 29/40 — Good (low edge)
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | .prn download asserts success and fires spool ceremony unconditionally (OrderDetail.tsx:235) — print status claimed, not verified |
| 2 | Match System / Real World | 3 | Rollback modal shows raw English enums (DISPATCHED) in ID mode (OrderDetail.tsx:1512) |
| 3 | User Control and Freedom | 3 | Native window.confirm for discard-edit (OrderDetail.tsx:345) |
| 4 | Consistency and Standards | 3 | Two toast systems (page.tsx:989 vs OrderDetail.tsx:528); three modal header treatments |
| 5 | Error Prevention | 3 | CONFIRMED-to-PRINTED advances unguarded (OrderDetail.tsx:588) — void-boundary step |
| 6 | Recognition Rather Than Recall | 3 | Mobile search bg-black/20 + placeholder-red-200/70 low contrast (page.tsx:452) |
| 7 | Flexibility and Efficiency | 3 | Arrows/Cmd+K/Ctrl+Enter real; Cetak has no shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | KPI card 3 crams three statuses inline; type floor 9px |
| 9 | Error Recovery | 2 | fetchOrders failure console-only (page.tsx:170) — outage renders as "Belum ada dokumen" empty state |
| 10 | Help and Documentation | 3 | Good sublabels; disabled-print reasons hidden behind title tooltips |

## Design Specificity Verdict
Content unmistakably factory-authored: paper-twin void language, 3-ply carbonless legend, tractor perforations, 9.5x5.5 chips; SlipSpooledCeremonyModal is the best product-specific design in the codebase. Skin still category-default gray/white Tailwind admin; crimson lives in accents and ceremonies only.
Deterministic scan: 0 findings (3rd consecutive clean; positive control fired 2 findings, exit 2; no waivers). Detector blind spot: tiny-text rule did not fire on text-[9px] in TSX control, matching the 9px type-floor observation. Issues below are interaction-class.

## Priority Issues
1. [P1] Load failure masquerades as empty (page.tsx:170) — loadError state with Retry card, announced via live region. Command: harden
2. [P1] Arrow-key hijack vs screen readers (OrderList.tsx:86) — guard covers only INPUT/TEXTAREA; gate on e.target inside listContainerRef (closest [role=option]). Command: audit
3. [P2] Unguarded Tandai Tercetak (OrderDetail.tsx:588) — route through PrintModal or reuse DispatchConfirmModal anatomy. Command: harden
4. [P2] Native window.confirm discard-edit (OrderDetail.tsx:345) — in-app modal pattern, cancel-first focus, 44px. Command: harden
5. [P3] Dual toast systems — migrate OrderDetail showToast to page-level appToast. Command: distill

## Persona Red Flags
- Casey: tablet loses Rekap Size drawer (hidden md:flex); GRID edit cells ~36px (TOUCH_PAD mitigates, GRID default); no autosave, beforeunload unreliable on mobile Safari
- Alex: Cetak no shortcut; save shortcut only discoverable via its own kbd chip
- Sam: arrow hijack; fetch errors silent; listbox container semantics; DispatchConfirmModal cancel-first focus exemplary

## What's Working
1. statusColors.ts token map feeds badge/stepper/CTA/KPI/shared filter config
2. Factory-authored safety copy: print gating reasons, Void & Archive paper-twin explanation
3. OrderList keyboard stack with modal-aware suppression + Rekap Size drawer (OrderList.tsx:85-148)

## Minor Observations
- Arrow glyph in DispatchConfirmModal:104 amid Lucide iconography; redundant Detail button on DRAFT cards; key={currentTab} remount animation nice; Re-open as Draft banner copy excellent

## Emotional Journey / Cognitive Load
- Two ceremonies read as one family (emerald vs amber, same anatomy); slip-spool perforations + ply legend best-in-codebase; but ceremonies assert unverified states (Triad Lengkap claim, download celebrated as print); 4s auto-dismiss shows countdown (good)
- Cognitive load: TouchSizePad 9 controls in one strip; 7 filter chips (scrollable, tolerable); mobile bottom nav 5 tabs incl. role-gated Keamanan

## Questions to Consider
- What if each KPI count were a filter trigger — operational strip instead of decorative?
- Is PRINTED a status or a hope when the LX-310 jams after spool?
- Is the tablet a first-class Casey surface or a desktop rail that hides?
