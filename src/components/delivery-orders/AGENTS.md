# Delivery Orders Component Guidelines (`src/components/delivery-orders/`)

## 1. Domain Responsibility
This directory contains UI components for Delivery Order (Surat Jalan) creation, master-detail viewing, size matrix breakdown spreadsheet inputs, quick keyboard digitizer, and print triggers.

## 2. Delivery Order Numbering Scheme
- Format: `SJ/EQ/YYYY/MM/XXXX`
  - `SJ`: Surat Jalan
  - `EQ`: Equator Insole
  - `YYYY`: 4-digit Year (e.g., 2026)
  - `MM`: 2-digit Month (e.g., 08)
  - `XXXX`: 4-digit sequential zero-padded number (e.g., 0042)

## 3. Size Matrix Breakdown (EU 36–45)
- Standard footwear matrix covers EU sizes: 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 (expandable to 46-48 if needed).
- All size cells MUST trigger numeric keypads on mobile/tablet (`inputmode="numeric"`, `pattern="[0-9]*"`).
- Total pairs (*Total Pasang / Psg*) must be calculated reactively without delay:
  $$\text{Total Psg} = \sum_{s=36}^{45} \text{Quantity}_s$$

## 4. Status Lifecycle State Machine
```
[DRAFT] ──► [CONFIRMED] ──► [PRINTED] ──► [DISPATCHED] ──► [DELIVERED]
   │             │
   └─────────────┴────────► [CANCELLED]
```
- Only `DRAFT` and `CONFIRMED` orders can have line items edited.
- `DISPATCHED` triggers material BOM consumption logs if enabled.

## 5. Keyboard-First Quick Digitizer
- Optimized for entering paper archive delivery slips.
- Tab advances to the next size column; Enter commits the row and adds a new item.
- Global date applicator button to assign one delivery date across 50+ batch rows instantly.
