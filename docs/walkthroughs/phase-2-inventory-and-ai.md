# Walkthrough: Phase 2 — Materials Inventory & Khatulistiwa AI Assistant

## 1. Objective
Establish the raw materials inventory management system (EVA sheets, natural latex, PU chemicals, TPU torsion shanks, BK mesh fabrics, and cutting dies), atomic stock movement tracking (IN / OUT / Adjustment audit trail), stock safety threshold health gauges, and the OpenRouter-powered **Khatulistiwa AI Assistant** capable of natural language delivery order drafting, inventory queries, and Bill of Materials (BOM) calculations.

---

## 2. Deliverables & Architecture Overview

```
Phase 2 Architecture Map
├── Database & Business Services
│   ├── src/lib/db/schema.ts (materials, inventoryMovements)
│   ├── src/services/inventoryService.ts (Atomic stock mutations, safety health gauge, valuation)
│   └── src/services/seedService.ts (Realistic footwear raw material catalog)
├── API Routes
│   ├── src/app/api/inventory/materials/route.ts (Material catalog CRUD)
│   ├── src/app/api/inventory/materials/[id]/route.ts (Single SKU update & delete)
│   ├── src/app/api/inventory/movements/route.ts (Atomic IN/OUT movement audit logging)
│   ├── src/app/api/inventory/summary/route.ts (Factory inventory KPI metrics)
│   └── src/app/api/ai/chat/route.ts (OpenRouter AI conversational gateway)
├── Inventory UI Components
│   ├── src/components/inventory/InventoryDashboard.tsx (Valuation cards, alert banner, master table)
│   ├── src/components/inventory/MaterialFormModal.tsx (SKU register & parameter editor)
│   └── src/components/inventory/StockMovementModal.tsx (IN/OUT transaction modal with projection preview)
├── Khatulistiwa AI Conversational Assistant
│   ├── src/lib/ai/openrouter.ts (Model router, structured JSON tool schemas, local fallback)
│   └── src/components/assistant/KhatulistiwaAssistant.tsx (Floating launcher, model picker, 1-click DO staging)
└── Master Integration
    └── src/app/page.tsx (Integrated Stok & AI Assistant navigation)
```

---

## 3. Core Mechanisms & Algorithms

### 3.1 Stock Health Status State Machine
Each material SKU dynamically computes its health level based on physical stock vs safety threshold:
$$\text{Health Level} = \begin{cases} \text{CRITICAL} & \text{if } \text{Stock} \le 0.5 \times \text{Threshold} \\ \text{WARNING} & \text{if } 0.5 \times \text{Threshold} < \text{Stock} \le \text{Threshold} \\ \text{HEALTHY} & \text{if } \text{Stock} > \text{Threshold} \end{cases}$$

- **Critical:** Triggers red alert banner and 1-click restock purchase recommendation.
- **Warning:** Amber badge alerting shopfloor staff of upcoming reorder necessity.
- **Healthy:** Emerald badge indicating adequate buffer stock.

### 3.2 Atomic Stock Movement Accounting
Every physical intake or issuance is executed atomically within SQLite:
- `IN_PURCHASE` / `IN_RETURN`: $\text{New Stock} = \text{Current Stock} + \Delta Q$
- `OUT_PRODUCTION` / `OUT_WASTAGE`: $\text{New Stock} = \max(0, \text{Current Stock} - \Delta Q)$
- `ADJUSTMENT`: $\text{New Stock} = Q_{\text{opname}}$

Simultaneously, a row is inserted into `inventory_movements` with the reference number (e.g. `PO-881`, `SPK-CUTTING-04`), operator name, and exact ISO timestamp to preserve an audit trail.

### 3.3 OpenRouter AI Gateway & Tool-Calling Protocol
Khatulistiwa AI connects to OpenRouter supporting a multi-model hierarchy:
1. `google/gemini-3.5-flash-lite`: Fast, economical daily drafting.
2. `google/gemini-3.7-flash`: Multimodal parsing and complex logic.
3. `deepseek/deepseek-v4-pro-0813`: Deep inventory reconciliation & SQL analytics.
4. `qwen/qwen3.7-plus`: Indonesian factory vernacular & bilingual translation.
5. `openai/gpt-5.6-luna`: Creative CAD generative suggestions.

#### Structured Tools Provided to LLM:
- `check_inventory_stock`: Returns current quantities and health levels.
- `draft_delivery_order`: Generates a structured JSON draft of a Delivery Order (Surat Jalan) with footwear size matrix breakdown.
- `calculate_material_bom`: Computes required raw material yield based on insole pair counts.
- `get_business_summary`: Retrieves monthly active delivery orders, pairs volume, and warehouse asset valuation in IDR.

#### 1-Click Order Staging:
When the user asks Khatulistiwa AI to draft a Delivery Order (e.g. *"Tolong buatkan surat jalan untuk PT KMK 300 pasang insole sport"*), the AI calls `draft_delivery_order` and renders a green action card. Clicking **"Terapkan ke Form DO"** pre-fills [`OrderFormModal.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/delivery-orders/OrderFormModal.tsx) with the recipient, address, PO, and full size matrix breakdown.

---

## 4. Verification & Testing
1. **Production Build:** `npm run build` executed and passed with 0 errors.
2. **Database Integrity:** Verified atomic movements increment and decrement material stocks correctly.
3. **AI Gateway:** Verified both online OpenRouter streaming and offline deterministic fallback engines.
