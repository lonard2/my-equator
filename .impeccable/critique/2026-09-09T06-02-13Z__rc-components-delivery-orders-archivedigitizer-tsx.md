---
target: the digitizer page
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx"
target_fingerprint: "sha256:8cbde62502dc53837dc002499412bb59b2375123da2249b1ab8d410ed0451e46"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/ArchiveDigitizer.tsx
timestamp: 2026-09-09T06-02-13Z
slug: rc-components-delivery-orders-archivedigitizer-tsx
---
# Design Critique (Run 3) — Archive & Paper Quick Digitizer

Method: dual-agent (A: design director review · B: deterministic detector)

## Design Health Score: 32/40 — Good
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Banner names the exact SJ saving; per-row chips; sticky rekap |
| 2 | Match System / Real World | 3 | TSV column order never documented; no IDR batch value anywhere |
| 3 | User Control and Freedom | 3 | Error chip cannot be cleared per-row |
| 4 | Consistency and Standards | 3 | Simpan ke DB vs Simpan ke Database; two undo toasts on opposite corners |
| 5 | Error Prevention | 3 | Photo rows fabricate unitPrice 18000 (L374-377) — the sin the paste fix removed (L635) |
| 6 | Recognition Rather Than Recall | 3 | Manual identity label hidden below lg (L1824); address edit is a truncated 10px line |
| 7 | Flexibility and Efficiency | 4 | Vertical Enter stepping, Alt+N, auto-spawn, paste, global date |
| 8 | Aesthetic and Minimalist Design | 3 | Amber does 5 jobs; two commit buttons |
| 9 | Error Recovery | 3 | Status stays red/Gagal after the user fixes the field |
| 10 | Help and Documentation | 3 | Shortcuts modal good; paste schema is tribal knowledge |

## Design Specificity Verdict
Genuinely authored: live SJ/EQ numbering, real directory datalists, payload provenance note (L894), truth-gated date applicator. The paper half is still second-class: the reference photo is a 12px badge (L1808-1818), the layout never echoes reading a slip.
Deterministic scan: 6 findings, all verified FALSE POSITIVES — the sanctioned per-row status bars (3 mobile + 3 desktop), count stable, no new rules in 2299 lines. No waivers. Doctrine and detector agree: clean under the Inset Indicator Rule.

## Priority Issues
1. [P1] Photo rows fabricate economics — handleCapturePhoto stages unitPrice 18000 + default article (L374-377) while paste stages 0 and blocks (L635). Fix: same rule as paste — stage 0, let commit validation catch it. Command: harden
2. [P1] Photo overlay breaks the modal contract — no focus moved in, no trap, no return; Escape sits on a non-focusable div (L2230) so keyboard-only users cannot reliably close it. Command: audit
3. [P2] Tab leaks out of shortcuts & date-confirm modals — trapModalTab(e, ref, ref) passes the same ref as first and last (L1216, L2179); Tab from the second button escapes. Fix: reuse the clear-confirm inline first/last pattern. Command: audit
4. [P2] Stale failure state after fixing — handleRowChange clears invalidRowIds but not status/errorMessage (L341-353); corrected rows keep red + Gagal until next Ctrl+S. Fix: reset to idle on any edit of an errored row. Command: harden
5. [P2] Seed rows are live ammunition — two fully-priced demo rows (L116-141) render on first load with no sample marker; one Ctrl+S pollutes the real DB with 500 fake pairs. Fix: start empty; the empty state already sells the three entry paths. Command: harden

## Persona Red Flags
- Jordan: fake seed rows look pre-approved; two identically-styled commit buttons (L1159, L2093)
- Alex: max-h-[650px] forces inner scroll at 50 rows on a big monitor (L1705); error refs by row-number go stale mid-session
- Sam: photo overlay keyboard-dead; camera badge 12px target (L1817); saving banner re-announces all 50 rows via implicit-atomic role=status (L1389)
- Casey: price fabrication risk highest in her flow; undo toast buttons ~28px (L1025, L2289); batch total hidden below sm (L2083)

## What's Working
1. Date truth gate (L291-339): divergence detection, confirm modal, snapshot undo with 6s buffer
2. Deterministic auto-spawn via pendingFocusRef (L231-255): the setTimeout race is dead
3. Partial-failure recovery: retained rows, failed-SJ pills, scroll-to-first-invalid

## Minor Observations
- Datalist miss keeps stale articleName (L348); no batch monetary total (sum price x psg); Ctrl+S fires while clear-confirm is open; paste has no staged preview; undo toasts bottom-left and bottom-right can stack; pb-28 serves the fixed toast

## Emotional Journey / Cognitive Load
- Commit reassurance is the strongest arc (named-SJ progress, amber-to-emerald chips, retained failures with honest copy); photo moment weakest (dark overlay blocks the grid, no split view)
- Cognitive load: 6-affordance header cluster; stale row-number error refs; saved rows vanish with only a count as trace

## Questions to Consider
- Is this surface a spreadsheet with photos or a queue of papers — why is the photo a badge instead of the row's identity?
- What does Jordan trust more after a partial save: the green check on rows that vanished, or the copy claiming they are safe?
- Should the last checkpoint before money enters the ERP show a pre-flight manifest (rows per customer, batch IDR value) instead of firing 50 POSTs on faith?
