---
target: tax preparation
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/lonard/Desktop/MyEquator-seconditer/src/components/tax/TaxDashboard.tsx"
target_fingerprint: "sha256:538ada9294a3055026803a1d8a4f0b4a7c4dfd6eb857388c4ce0e4416e6ce1ec"
target_path: /Users/lonard/Desktop/MyEquator-seconditer/src/components/tax/TaxDashboard.tsx
timestamp: 2026-09-10T05-16-47Z
slug: src-components-tax-taxdashboard-tsx
---
# Impeccable Critique: Coretax Tax Filing Preparation (Persiapan Pengisian Pajak DJP Coretax)

**Target:** `src/components/tax/` (`TaxDashboard.tsx`, `TaxInvoiceList.tsx`, `SptMasaSummaryCard.tsx`, `CoretaxExportModal.tsx`, `CompanyTaxProfileModal.tsx`, `TaxBatchGenerateModal.tsx`, `TaxInvoiceDetailDrawer.tsx`, `TaxManualInvoiceModal.tsx`, `TaxMaterialPurchasesModal.tsx`)  
**Method:** dual-agent (A: 3ac447e4-b25e-47c5-86b4-9f2a803d16d4 · B: 78d293ab-5f24-4ea8-abfa-7b7edb108e81)  
**Operating Mode:** Operate (Executive & Accounting workflow for Super Admin, Factory Owner, and Tax Accountant)  
**Industry:** Footwear Insole Manufacturing (EVA foam, Latex, PU, Orthotics) — Bandung, West Java, Indonesia  

---

## 1. Usability Health Score

| Heuristic | Score | Key Finding / Rationale |
| :--- | :---: | :--- |
| **1. Visibility of System Status** | 3 / 4 | Good live calculation of SPT Masa PPN 1111 (Output vs Input VAT). Invoices lack real-time validation flags in the main ledger table prior to opening the export modal. |
| **2. Match Between System & Real World** | 4 / 4 | Outstanding alignment with Indonesian DJP Coretax standards: 16-digit NPWP, 22-digit NITKU auto-padding, BKP transaction codes, official SPT Masa PPN 1111 terminology (Kurang/Lebih Bayar). |
| **3. User Control & Freedom** | 2 / 4 | Draft deletion relies on primitive native `confirm()`. Modals and drawers lack `Escape` key dismissal and accessible backdrop dismissal traps. |
| **4. Consistency & Standards** | 2 / 4 | **P0 Violation:** Entire module hardcodes dark theme classes (`bg-neutral-900`, `bg-neutral-950`, `text-neutral-100`) across all 9 components, breaking when user toggles to Light Mode. |
| **5. Error Prevention** | 3 / 4 | Built-in NPWP/NITKU length validation and date range bounds. However, table row selection uses red highlights (`bg-red-950/20`, `text-red-400`), violating the Crimson Scarcity doctrine and causing false-alarm audit anxiety. |
| **6. Recognition Rather than Recall** | 4 / 4 | Clear breakdown cards for Pajak Keluaran, Pajak Masukan, and Net Settlement with dual IDR and Terbilang representation in drawer inspection. |
| **7. Flexibility & Efficiency of Use** | 3 / 4 | Batch generation and dual export (Coretax XML + 3-Sheet DJP Excel) enable swift monthly closing. Table row action buttons have small touch targets (28px) on mobile/tablet. |
| **8. Aesthetic & Minimalist Design** | 3 / 4 | High information density appropriate for industrial accounting; clean typography with tabular numbers (`tabular-nums font-mono`). |
| **9. Error Recovery** | 2 / 4 | API error handling catches exceptions silently (`console.error`) in several modal workflows without displaying persistent banner notifications or field-specific inline hints. |
| **10. Help & Documentation** | 3 / 4 | Good inline guidance on DJP Coretax requirements (NPWP 16, NITKU 22, BKP 01/04/07/08), though missing contextual tooltips on XML schema versioning. |
| **Total Usability Score** | **29 / 40** | **72.5% — Functional & Compliant, Needs Theming & Interaction Hardening** |

---

## 2. Design Specificity
- **Verdict:** Authentically Crafted for Indonesian Manufacturing & DJP Compliance.
- The module is specifically tailored to West Java footwear insole manufacturing and Indonesian tax reform:
  - Accurate implementation of **DJP Coretax 2024/2025** rules: 16-digit NPWP (transition from 15-digit), 22-digit NITKU with `000000` auto-padding for central branches, and SPT Masa PPN 1111 Form 1111 AB & A2.
  - Authentic transaction classification for BKP (Barang Kena Pajak) Footwear Insoles (EVA, PU, Orthotics) and raw materials (EVA sheets, chemicals, mold tooling).
  - Dual export capabilities: official **DJP Coretax XML schema** and **3-Sheet DJP Excel format**.

---

## 3. Cognitive Load Assessment (Failures: 3 / 8)
1. ❌ **Single Focus:** Batch generation and manual invoice creation modals contain dense multi-section forms that force simultaneous cognitive evaluation of customer profile, tax rates, and line items without progressive staging.
2. ❌ **Minimal Choices:** Export modal exposes raw XML and Excel export buttons simultaneously without a clear recommendation based on the user's intended filing step (e.g. e-Faktur web vs Coretax client).
3. ❌ **Working Memory:** Users must memorize which delivery orders have invalid or missing customer NPWP/NITKU because the main invoice ledger does not display validation error indicators on table rows.
4. ✅ *Chunking:* SPT Masa summary cleanly chunks Pajak Keluaran, Pajak Masukan, and Net Balance.
5. ✅ *Grouping:* Logical grouping of tax profiles, invoice lines, and export configuration.
6. ✅ *Visual Hierarchy:* Clear numerical hierarchy on tax balances and monetary totals.
7. ✅ *One Thing at a Time:* Dedicated modal workflows for profile configuration and batch generation.
8. ✅ *Progressive Disclosure:* Invoice detail drawer provides drill-down into delivery order lines.

---

## 4. Strengths
1. **DJP Coretax Regulatory Fidelity:** Complete adherence to modern Indonesian tax architecture (NPWP 16, NITKU 22, PPN 11%, BKP classification, Kurang/Lebih Bayar settlement).
2. **Dual-Format Official Export Pipeline:** Direct client-side generation of both official DJP Coretax XML and DJP 3-sheet Excel workbooks matching official tax office import templates.
3. **Robust Monospace Financial Typography:** Strictly formatted currency with `tabular-nums font-mono` and `formatRupiahTax`, preventing column misalignment during rapid audits.

---

## 5. Priority Issues (P0–P3)

### [P0] Broken Theme Parity — Hardcoded Dark Palette
- **What:** All 9 components in `src/components/tax/` hardcode dark utility classes (`bg-neutral-900`, `bg-neutral-950`, `border-neutral-800`, `text-neutral-100`) without light-mode variants.
- **Why:** When switching the application to Light Mode, the Tax Preparation module renders as an unreadable pitch-black block with low contrast, breaking system-wide UI consistency.
- **Fix:** Refactor background, border, and text tokens to responsive theme classes (e.g. `bg-white dark:bg-neutral-900`, `border-neutral-200 dark:border-neutral-800`, `text-neutral-900 dark:text-neutral-100`).
- **Suggested Command:** `/impeccable adapt`

### [P1] Crimson Selection Violates the "Crimson-is-Danger" Rule
- **What:** In `TaxInvoiceList.tsx` (lines 312, 322), selected rows and active selection checkboxes use crimson styles (`bg-red-950/20`, `text-red-400`, `accent-red-600`).
- **Why:** In Indonesian tax preparation, crimson signifies tax non-compliance, severe audit penalties, or invalid NPWP. Using crimson for benign row selection triggers immediate panic and cognitive alarm.
- **Fix:** Reserve crimson exclusively for invalid NPWP/NITKU errors and audit flags. Use brand neutral/indigo/blue accents (`bg-neutral-800/40 dark:bg-neutral-800/60` or `accent-neutral-700`) for table selection.
- **Suggested Command:** `/impeccable colorize`

### [P1] Modal Accessibility & Keyboard Trapping Deficits
- **What:** Modals (`CompanyTaxProfileModal`, `CoretaxExportModal`, `TaxBatchGenerateModal`, `TaxManualInvoiceModal`, `TaxMaterialPurchasesModal`) and `TaxInvoiceDetailDrawer` lack WAI-ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), lack `Escape` key listeners, and form labels are not linked to inputs via `htmlFor`/`id`.
- **Why:** Keyboard-only users and screen-reader operators cannot navigate, dismiss, or operate tax filing dialogs reliably.
- **Fix:** Wrap modals with standard dialog semantics, bind `Escape` key listeners for dismiss, trap focus, and link all form labels to their inputs with unique IDs.
- **Suggested Command:** `/impeccable harden`

### [P2] Native `confirm()` & Silent API Failures
- **What:** `TaxDashboard.tsx` uses native browser `window.confirm()` for deleting draft invoices, and catches API submission errors with only `console.error()`.
- **Why:** Native dialogs freeze the browser thread and fail modern UX expectations. Silent catches leave accountants stranded without knowing why an invoice failed to save or generate.
- **Fix:** Implement custom styled confirmation popovers and visible error alert banners in the dashboard and modal dialogs.
- **Suggested Command:** `/impeccable harden`

### [P2] Validation Status Invisible in Main Ledger
- **What:** Invoices with missing or invalid 16-digit NPWP / 22-digit NITKU look identical to valid invoices in the main table list until the export modal is triggered.
- **Why:** The accountant (Dewi) only discovers errors at the final export step, forcing repetitive round-trips.
- **Fix:** Add inline Coretax readiness warning badges (`Siap Ekspor` vs `Perlu Perbaikan NPWP`) directly in table rows.
- **Suggested Command:** `/impeccable clarify`

---

## 6. Persona Walkthroughs

### Alex — Factory Owner (High-Stakes Oversight & Cash Flow)
- **Primary Action:** Review monthly PPN Kurang/Lebih Bayar before approving bank transfer to Kas Negara.
- **Experience:** Alexander easily understands the SPT Masa card summary and appreciates the exact IDR figure for SPT PPN Kurang Bayar. However, when inspecting selected invoices, the pervasive red highlights make him fear that multiple invoices are rejected or flagged by the tax office.

### Dewi — Tax Accountant (DJP Coretax Compliance & Monthly Filing)
- **Primary Action:** Generate Coretax XML and Excel files for filing via the DJP online portal.
- **Experience:** Dewi is pleased by the NITKU `000000` central auto-padding and BKP 01 footwear classification. However, she must open the export modal to discover which delivery orders have missing customer tax IDs. Having to click through native `confirm()` prompts when clearing test drafts disrupts her workflow.

### Sam — Accessibility-Dependent User (Screen Reader & Keyboard Only)
- **Primary Action:** Review draft invoices and trigger batch generation using keyboard navigation.
- **Experience:** Severe failure. When pressing Enter to open `TaxBatchGenerateModal`, focus remains trapped in the background table. Pressing `Escape` does not dismiss the modal. Form inputs inside the modal announce generic "edit text" without reading the adjacent unlinked labels.

---

## 7. Minor Observations
- Table action buttons (view, edit, delete) have 28px touch targets, making them difficult to tap accurately on tablet inspection screens.
- Several modals lack autofocus on their primary input field when opened.
- The company tax profile modal does not provide quick copy buttons for company NPWP 16 and NITKU 22.
