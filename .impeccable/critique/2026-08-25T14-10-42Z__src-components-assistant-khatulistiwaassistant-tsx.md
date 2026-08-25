---
target: src/components/assistant/KhatulistiwaAssistant.tsx
total_score: 33.9
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-25T14-10-42Z
slug: src-components-assistant-khatulistiwaassistant-tsx
---
# Khatulistiwa AI Assistant & Operations Copilot Critique

**Surface:** `src/components/assistant/KhatulistiwaAssistant.tsx` & AI Gateway Subsystem  
**Method:** dual-agent (A: 2cbd3852-4aaa-4ae3-85c5-0b311266e9cc · B: ec539d90-c216-4176-98be-b729542c9537)  
**Operating Context:** Equator Insole Manufacturing, Bandung, West Java  

---

## 1. Design Health Score

| # | Heuristic | Score | Key Finding |
|---|-----------|:-----:|-------------|
| 1 | Visibility of System Status | 3.5 / 4 | Compass loading state with status message; staged draft button lacks immediate "Applied ✓" feedback. |
| 2 | Match System / Real World | 3.8 / 4 | Excellent factory domain grounding (*Bahan Baku*, *Lembar EVA*, *BK Mesh*, *SPK*, *Pasang*); markdown is unformatted plain text. |
| 3 | User Control and Freedom | 2.8 / 4 | Window expand/minimize toggle, quick prompt chips, but `Trash2` immediately purges conversation with zero confirmation. |
| 4 | Consistency and Standards | 3.6 / 4 | Brand crimson `#8B0000` accents and bilingual parity; staged draft cards use emerald theme. |
| 5 | Error Prevention | 3.0 / 4 | Deterministic local fallback prevents crashing; single-line input prevents reviewing long WhatsApp order pastes. |
| 6 | Recognition Rather Than Recall | 3.5 / 4 | 4 preset quick chips, but staged DO cards omit the shoe size matrix (e.g., EU 39: 60, EU 40: 80). |
| 7 | Flexibility and Efficiency | 3.2 / 4 | 1-Click "Terapkan ke Form Surat Jalan", but single-line input blocks multiline pastes and copy button is hover-only. |
| 8 | Aesthetic and Minimalist Design | 3.5 / 4 | Clean hierarchy, but unparsed markdown syntax clutters long inventory and BOM calculation responses. |
| 9 | Error Recovery | 3.4 / 4 | Graceful try/catch with friendly bilingual fallback; lacks an inline "Coba Lagi" (Retry) action button. |
| 10 | Help and Documentation | 3.6 / 4 | Clear introductory greeting and quick prompt suggestions; model dropdown omits role guidance descriptions. |
| **Total** | | **33.9 / 40.0** | **Good / Solid Industrial UX (Grade B+)** |

---

## 2. Design Specificity Verdict

**LLM Assessment:**  
Khatulistiwa AI is grounded specifically in Bandung footwear manufacturing operations: EVA foam sheet yields (~12 pairs per 1.2m × 2.4m sheet), BK mesh fabric roll consumption (0.08m/pair), dual TPU shank plates (2 pcs/pair), Indonesian Rupiah formatting (`Rp 1.250.000`), and European footwear sizing matrices (EU 36–45). It connects to a specialized OpenRouter model roster (`gemini-3.5-flash-lite`, `gemini-3.7-flash`, `deepseek-v4-pro`, `qwen3.7-plus`, `gpt-5.6-luna`) and features deterministic local database fallback queries.

**Deterministic Scan:**  
`detect.mjs` returned **0 issues** across `src/components/assistant/` (**100% clean**).

---

## 3. Overall Impression

Khatulistiwa AI has a strong, domain-accurate foundation with 1-click staged draft integration directly into the delivery order form. Addressing the destructive history deletion safeguard, multiline input expansion, visible size matrix badges in staged drafts, and lightweight markdown formatting will transform it into an elite factory copilot.

---

## 4. What's Working Well

1. **Footwear Engineering Calculations:** Real BOM consumption logic calculates exact EVA sheet counts and fabric yardage for production batches.
2. **Deterministic Offline Fallback:** When OpenRouter API keys are missing or network is offline, the copilot executes local database queries against Inventory and Delivery Orders.
3. **1-Click Form Integration:** `onApplyDraftOrder` parses natural language orders into structured delivery order forms with one tap.
4. **Expandable Split-Screen Workspace:** Smooth transition between compact floating widget and expanded 800px split-screen view for computer workstations.

---

## 5. Priority Issues (P0–P3)

- **[P0] Unprotected Chat History Deletion (Instant Data Loss):**
  - *Why it matters:* Clicking `Trash2` immediately purges all conversation history and staged drafts without confirmation.
  - *Fix:* Add an in-app confirmation dialog or inline confirmation chip before clearing chat.
  - *Suggested Command:* `/impeccable harden`

- **[P1] Single-Line Input Restricts Multiline WhatsApp Order Pasting:**
  - *Why it matters:* Sales operators (Jordan) paste multi-line WhatsApp messages containing customer names, addresses, and size matrices.
  - *Fix:* Replace `<input>` with an auto-expanding `<textarea>` supporting `Shift+Enter` for newlines and `Enter` to submit.
  - *Suggested Command:* `/impeccable adapt`

- **[P1] Staged Draft Card Omissions & Missing "Applied" State:**
  - *Why it matters:* Staged draft cards omit shoe size matrices (e.g. EU 39: 60, EU 40: 80), and clicking apply gives no visual "Applied ✓" confirmation.
  - *Fix:* Display size matrix badges inside the draft card and transition the button to a green checkmark state after applying.
  - *Suggested Command:* `/impeccable polish`

- **[P2] Raw Markdown Text Rendering in Chat Stream:**
  - *Why it matters:* Asterisks (`**bold**`) and list hyphens render as raw symbols, reducing legibility on factory screens.
  - *Fix:* Implement lightweight markdown formatting for bold text, bulleted lists, and code blocks.
  - *Suggested Command:* `/impeccable typeset`

- **[P2] Touch Inaccessibility of Hover-Only Copy Button:**
  - *Why it matters:* `group-hover:opacity-100` makes the copy action invisible on mobile phones and warehouse touch tablets.
  - *Fix:* Ensure action buttons are always accessible on mobile/tablet viewports.
  - *Suggested Command:* `/impeccable adapt`

- **[P3] Continuous Animation on Idle Launcher Button:**
  - *Why it matters:* `animate-ping` and `animate-spin-slow` pulse continuously while idle, creating visual restlessness.
  - *Fix:* Quiet the idle state and animate only when actively processing queries.
  - *Suggested Command:* `/impeccable quieter`

---

## 6. Persona Highlights

- **Alex (Owner / Executive):** Wants structured KPI summary cards when asking for business overviews.
- **Jordan (Sales Operator):** Needs multiline textarea to paste customer orders directly from WhatsApp.
- **Sam (Accessibility Specialist):** Requires explicit `aria-label` attributes and focus rings on icon buttons.
- **Pak Hendra (Production Manager):** Relies on accurate EVA sheet yield calculations and visible size matrices in draft cards.
