---
target: src/components/common/Header.tsx
total_score: 39.4
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-25T14-20-00Z
slug: src-components-common-header-tsx
---
# Global Navigation Shell, Authentication & Layout Critique

**Surfaces:** `src/components/auth/LoginView.tsx`, `src/components/common/Header.tsx`, `src/components/common/Sidebar.tsx`, `src/components/common/CommandPalette.tsx`, `src/components/common/SettingsModal.tsx`, and `src/app/page.tsx`  
**Method:** dual-agent (A: 364e4f03-2a9e-4a40-9327-c95f06235eeb · B: cd9e0560-a0c9-4c41-9838-b3c3df60086a)  
**Operating Context:** Equator Insole Manufacturing, Bandung, West Java  

---

## 1. Design Health Score

| # | Heuristic | Score | Key Finding |
|---|-----------|:-----:|-------------|
| 1 | Visibility of System Status | 4.0 / 4 | Immediate auth loading states, persistent active user avatar/role badge in topbar, high-contrast active sidebar route tinting. |
| 2 | Match System / Real World | 4.0 / 4 | Authentic Indonesian footwear manufacturing terminology (*Surat Jalan*, *Busa EVA*, *Lateks*, *Pelat TPU*, *Insole CAD DXF*, *psg*). |
| 3 | User Control and Freedom | 3.9 / 4 | 1-click demo role switching, collapsible master-detail list rail, `Escape` key and backdrop modal dismissals. |
| 4 | Consistency and Standards | 4.0 / 4 | Strict adherence to `DESIGN.md`: deep crimson `#8B0000`, 1px structural slate borders, Plus Jakarta Sans, and JetBrains Mono tabular numerals. |
| 5 | Error Prevention | 3.8 / 4 | Pre-validation of empty login fields, 1-click typo-free demo login cards, safe localStorage session recovery. |
| 6 | Recognition Rather Than Recall | 4.0 / 4 | 4 demo role cards display real factory personas and photos; Command Palette features descriptive bilingual subtitles; Settings cards show exact pixel sizes. |
| 7 | Flexibility and Efficiency | 4.0 / 4 | Tri-modal interaction: Keyboard-first `⌘K` command palette, persistent desktop sidebar, and mobile touch navigation dock. |
| 8 | Aesthetic and Minimalist Design | 4.0 / 4 | High-density industrial brutalist clarity; flat surfaces, 1px structural borders, and strict Singular Accent Rule ($\le 10\%$ crimson). |
| 9 | Error Recovery | 3.8 / 4 | Accessible crimson alert badge with `AlertCircle` on failed login; clean empty state in Command Palette. |
| 10 | Help and Documentation | 3.9 / 4 | Native `title` tooltips on all icon buttons, persistent footer keyboard shortcut hints (`↑↓`, `↵`, `⌘K`), and plain-language settings descriptions. |
| **Total** | | **39.4 / 40.0** | **Exceptional / Mission-Critical Industrial Grade (Grade A+)** |

---

## 2. Design Specificity Verdict

**LLM Assessment:**  
The application shell, authentication portal, topbar, sidebar, command palette, and UI settings modal are 100% custom-tailored for PT Equator Insole in Bandung, West Java. It features 4 authentic factory personas (Ir. Budi Hartono, Hendra Wijaya, S.T., Asep Sunandar, Siti Rahmawati), 6 domain-specific navigation modules, an integrated 5-tier root font density engine calibrated for factory monitors, and a tri-tier responsive topology (Desktop / Tablet / Mobile).

**Deterministic Scan:**  
- `src/components/common`: **0 issues (100% clean)**
- `src/app/page.tsx`: **0 issues (100% clean)**
- `src/components/auth`: **1 minor token violation** (`text-[8px]` on demo role badges in `LoginView.tsx:213`, easily upgraded to `text-[9px]`).

---

## 3. Overall Impression

The global application shell provides a unified, fast, and accessible operational cockpit. With 1-click role onboarding, full `⌘K` keyboard acceleration, root font-size scaling from 12.5px to 20.5px, and mobile warehouse ergonomics, it sets an exceptional foundation for factory operations.

---

## 4. What's Working Well

1. **5-Tier Real Font-Size Scaling Engine:** Dynamically manipulates root HTML font size (`xs: 12.5px`, `compact: 14.0px`, `normal: 16.0px`, `large: 18.0px`, `xl: 20.5px`), providing genuine accessibility for desktop workstations and wall-mounted factory monitors alike.
2. **Unified Keyboard Command Palette (`⌘K`):** Bridges all 6 modules, draft creation, AI assistant invocation, and settings with instant search and arrow navigation.
3. **Tri-Tier Adaptive Layout:** Multi-pane master-detail desktop workspace, collapsible rail, tablet-optimized sizing, and mobile bottom navigation dock with $\ge 44\text{px}$ touch targets.
4. **Zero-Flicker Session Storage:** Synchronous mount-time authentication initialization prevents login screen flashes for authenticated operators.

---

## 5. Priority Issues (P0–P3)

- **[P2] Hardcoded Search Label in Desktop Topbar:**
  - Search button text in `Header.tsx:92` is static `"Cari..."`, which does not localize when switching to English (`"Search..."`).
  - *Fix:* Localize button text and tooltip to `{isId ? "Cari..." : "Search..."}`.
  - *Suggested Command:* `/impeccable polish`

- **[P2] Command Palette ARIA Combobox Accessibility:**
  - Input lacks explicit `role="combobox"` and `aria-expanded` attributes for WCAG AAA screen reader compliance.
  - *Fix:* Add semantic ARIA combobox attributes in `CommandPalette.tsx`.
  - *Suggested Command:* `/impeccable audit`

- **[P3] Token Normalization in Demo Role Badges (`LoginView.tsx:213`):**
  - Uses non-standard `text-[8px]` and `py-0.2` on demo role cards.
  - *Fix:* Upgrade to standard `text-[9px] py-0.5 font-bold uppercase`.
  - *Suggested Command:* `/impeccable typeset`

---

## 6. Persona Highlights

- **Alex (Super Admin & Factory Owner):** Persistent topbar role indicator and instant access to full security settings.
- **Jordan (Sales & Front-Office Clerk):** 1-click demo login and rapid DO drafting via `⌘K`.
- **Sam (Accessibility Specialist):** Validated scalable font density, JetBrains Mono tabular numerals, and high-contrast WCAG AA compliance.
- **Casey (Warehouse Lead):** Mobile bottom navigation dock, slide-down drawer, and large 44px touch targets.
- **Pak Hendra (Production Manager):** Direct Insole CAD Studio tab and compact density mode for viewing 20+ sizing rows.
