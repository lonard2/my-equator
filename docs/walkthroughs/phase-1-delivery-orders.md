# Walkthrough: Phase 1 — Core Foundation, Layout Shell & Delivery Orders MVP

## 1. Objective
Establish the foundational Next.js 15+ App Router codebase, Drizzle ORM + SQLite database pipeline, adaptive multi-device presentation shell (Desktop, Tablet, Mobile), and full Delivery Order (Surat Jalan) MVP with reactive size matrix auto-summation, 80-column ESC/P dot-matrix binary printing, and the Archive Quick Digitizer.

---

## 2. What Was Built in Phase 1

```
Phase 1 Deliverables
├── Project Infrastructure
│   ├── package.json (Next.js 15, React 19, Tailwind v4, Drizzle ORM, better-sqlite3)
│   ├── tsconfig.json (Strict mode + path aliases)
│   ├── drizzle.config.ts (SQLite schema management)
│   └── src/styles/globals.css (Theme engine, darkred brand tokens, print styles)
├── Database & Persistence
│   ├── src/lib/db/schema.ts (delivery_orders, items, materials, CAD, audit logs)
│   ├── src/lib/db/index.ts (better-sqlite3 connection with WAL mode)
│   └── src/services/seedService.ts & scripts/seed.ts (Realistic factory test seed)
├── Business Services & API Routes
│   ├── src/services/orderService.ts (SJ numbering generator & atomic transactions)
│   ├── src/app/api/orders/route.ts (Order CRUD API)
│   ├── src/app/api/orders/[id]/route.ts (Single order & status patch)
│   └── src/app/api/orders/[id]/print-escp/route.ts (Monospace preview & .prn binary export)
├── ESC/P Dot-Matrix Printing Engine
│   └── src/lib/printer/escp.ts (80-column ASCII grid & binary escape codes)
├── Responsive UI & Delivery Order Components
│   ├── src/components/common/Header.tsx (Device switcher, theme toggle, i18n switcher)
│   ├── src/components/common/Sidebar.tsx (Module navigation)
│   ├── src/components/delivery-orders/OrderList.tsx (Master list with status badges)
│   ├── src/components/delivery-orders/OrderDetail.tsx (Detail view & size heatmap)
│   ├── src/components/delivery-orders/OrderFormModal.tsx (Create form & reactive size sum)
│   ├── src/components/delivery-orders/PrintModal.tsx (Dual-mode ESC/P terminal + HTML sheet)
│   └── src/components/delivery-orders/ArchiveDigitizer.tsx (Keyboard-first batch entry grid)
└── Root Application Pages
    ├── src/app/layout.tsx
    └── src/app/page.tsx (Adaptive Desktop, Tablet, and Mobile warehouse views)
```

---

## 3. Deep Dive into Core Mechanisms

### 3.1 Standard Surat Jalan Numbering Algorithm
```typescript
// Prefix: SJ/EQ/YYYY/MM/XXXX
const prefix = `SJ/EQ/${year}/${month}/`;
// Finds the maximum existing sequence for the current month and increments by 1
```

### 3.2 Reactive Size Matrix Auto-Sum
Insole manufacturing requires exact size breakdown tracking (EU 36–45). When an operator enters quantities in size cells, the total pairs are computed instantly:
$$\text{Total Pairs} = \sum_{s=36}^{45} \text{Quantity}_s$$
On touch devices (tablets and smartphones), all size cells declare `inputmode="numeric"` and `pattern="[0-9]*"` to invoke the numerical touch keypad automatically.

### 3.3 80-Column Dot-Matrix Stream Construction
The printer generator creates a binary payload using Epson Standard Code for Printers:
- `\x1B\x40` (Reset / Init)
- `\x1B\x43\x21` (Set page length to 33 lines for 5.5" half-page continuous slip)
- `\x1B\x4D` (Set 10 CPI pitch -> 80 characters per line)
- Monospace 80-column ASCII grid formatted lines
- `\x0C` (Form Feed to advance paper to tear-off perforation)

---

## 4. Verification & Testing
1. **Database Schema:** SQLite database initialized with WAL mode and seeded with 4 realistic Delivery Orders and 5 raw materials.
2. **Build Verification:** Tested Next.js production build (`npm run build`).
3. **API & Print Verification:** Validated JSON responses, `.prn` binary downloads, and monospace rendering.

---

## 5. Next Steps
With Phase 1 complete, the next phase is **Phase 2: Materials Inventory & Khatulistiwa AI Assistant**.
