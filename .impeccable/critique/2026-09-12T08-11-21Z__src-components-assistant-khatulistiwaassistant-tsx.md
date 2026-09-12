# Impeccable Critique: Khatulistiwa AI Assistant (`KhatulistiwaAssistant.tsx`)
**Date:** 2026-09-12T08:11:21Z  
**Target:** `src/components/assistant/KhatulistiwaAssistant.tsx`  
**Operating Mode:** Operate (Conversational Factory Floor Copilot & Business Operations Assistant)  
**Audience:** Super Admin, Factory Manager, Production Supervisor, Warehouse Crew (Bandung, West Java)

---

## 1. Executive Summary

| Evaluation Dimension | Assessment A (Design Review) | Assessment B (Detector & Evidence) |
| :--- | :--- | :--- |
| **Heuristics Usability Score** | **22.0 / 40** (Needs Remediation) | N/A (Automated checks) |
| **Cognitive Load Failures** | **5 of 8 Checkpoints Failed** | N/A |
| **CLI Detector Violations** | N/A | **0 Violations** (Deterministic clean) |
| **Typography Floor (>= 10px)** | Compliant (10px min) | **100% Compliant** |
| **Accessibility & Modal Safety** | Missing Escape & Focus Trap | Missing `useModalSafety` & ARIA dialog |
| **Color Doctrine** | Violates Crimson Scarcity | User bubbles use brand crimson `#8B0000` |

---

## 2. Nielsen's 10 Usability Heuristics Scorecard

| # | Heuristic | Score (0–4) | Key Finding / Observation |
| :--- | :--- | :---: | :--- |
| 1 | **Visibility of System Status** | 2/4 | Streaming indicator works, but raw engine ID leaks backend tech; network failure lacks retry. |
| 2 | **Match Between System & Real World** | 3/4 | Great footwear terminology (EVA, pasang, nomor sepatu), but draft DO prematurely labeled "Terverifikasi". |
| 3 | **User Control & Freedom** | 1/4 | No `Escape` dismissal; applying draft DO traps modal behind assistant z-50 overlay. |
| 4 | **Consistency & Standards** | 2/4 | User bubbles use crimson violating Crimson Scarcity; size pills fail to render due to schema mismatch. |
| 5 | **Error Prevention** | 2/4 | Clear chat modal lacks backdrop dismiss; failed prompt is lost upon network error. |
| 6 | **Recognition Rather Than Recall** | 3/4 | Suggestion chips help, but sized pills fail to render from API payload structure. |
| 7 | **Flexibility & Efficiency of Use** | 3/4 | Good quick suggestion prompts; lacks keyboard shortcuts and collapsed model selector. |
| 8 | **Aesthetic & Minimalist Design** | 2/4 | Saturated green draft cards and permanent 40px model selector bar crowd conversational viewport. |
| 9 | **Help Recognize & Recover from Errors** | 2/4 | Generic error message clears input without "Coba Lagi" (Retry) action. |
| 10| **Help & Documentation** | 2/4 | Minimal prompt tips; no explanation of structured tool capabilities. |
| **Total** | | **22.0 / 40** | **Grade: C (Substantial UX & Structural Improvements Required)** |

---

## 3. Cognitive Load Assessment (5 / 8 Failures)

1. [x] **Single Focus (FAILED):** Floating assistant collides with opened modal when "Terapkan ke Form DO" is clicked, presenting two overlapping primary workflows.
2. [x] **Visual Hierarchy (FAILED):** Permanent model bar competes with conversation header; saturated green cards dominate the chat history.
3. [x] **Minimal Choices (FAILED):** Exposing 6 AI model identifiers directly to factory workers induces decision fatigue.
4. [x] **Working Memory (FAILED):** Error drops the user prompt, forcing re-entry of complex order specifications.
5. [x] **Progressive Disclosure (FAILED):** Advanced technical model switching is permanently expanded instead of neatly tucked away.
6. [ ] **Chunking (PASS):** Messages and cards are cleanly separated in conversational flow.
7. [ ] **Grouping (PASS):** Customer and date fields are logically grouped in preview cards.
8. [ ] **One Thing at a Time (PASS):** Generation state blocks duplicate input submissions.

---

## 4. Priority Issues & Action Plan

### P0 (Critical UX Blockers & Data Schema Disconnects)
1. **Modal Collision on Draft DO Injection:**
   - *Issue:* Clicking *"Terapkan ke Form DO"* triggers `onApplyDraftOrder`, opening `OrderFormModal`, but `KhatulistiwaAssistant` remains open at `z-50`, hiding the newly opened form.
   - *Fix:* Auto-minimize or close the assistant (`onToggle()`) upon triggering `onApplyDraftOrder`.
2. **Sizing Matrix Pills Fail to Render:**
   - *Issue:* Staged draft card checks `staged.size_breakdown`, but OpenRouter response formats items inside `staged.items[0].sizes`. Result: size badge grid is completely blank.
   - *Fix:* Normalize `staged.size_breakdown` from `staged.items` and compute total pairs if missing so size pills (EU 38–44) render cleanly.

### P1 (Design System & Manufacturing Reality)
3. **Crimson Scarcity Violation:**
   - *Issue:* User speech bubbles use `bg-brand` (`#8B0000`), turning routine chatter into pseudo-alerts.
   - *Fix:* Recolor user bubbles to neutral dark ink (`bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900`).
4. **Premature Verification Badge:**
   - *Issue:* Staged draft wears saturated emerald with label *"Draft Surat Jalan Terverifikasi"*. AI drafts are unverified until human review.
   - *Fix:* Retoken to Amber Data Token (`border-amber-400 bg-amber-50/80 dark:bg-amber-950/40`) with label *"Draft Siap Ditinjau"* (*"Draft Ready for Review"*).
5. **Leaked AI Infrastructure:**
   - *Issue:* Prominent 40px model dropdown bar forces factory operators to manage LLM engines.
   - *Fix:* Collapse model picker into a secondary menu or compact popover trigger.

### P2 (Accessibility, Touch Targets & Error Recovery)
6. **Focus Trapping & Escape Key (`useModalSafety`):**
   - *Issue:* Floating drawer cannot be dismissed with `Escape`; lacks `role="dialog"`, `aria-modal="true"`, and focus trapping.
   - *Fix:* Implement `useModalSafety`, `Escape` listener, and appropriate ARIA attributes.
7. **Mobile Touch Targets ($< 44\text{px}$):**
   - *Issue:* Header icons (`~28px`), prompt chips (`~28px`), and modal buttons (`~32px`) violate touch target rules.
   - *Fix:* Add minimum 44px tap targets (`min-h-[44px] min-w-[44px]` or adequate padding).
8. **Fragile Error Recovery:**
   - *Issue:* API failure wipes prompt input.
   - *Fix:* Retain prompt on error and provide a 1-click *"Coba Lagi"* (Retry) button.
