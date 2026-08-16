# Technical & Engineering Guide: Phase 1 — Delivery Orders, ESC/P Print Engine & Quick Digitizer

## 1. Module Overview & Industrial Role

The **Delivery Orders (Surat Jalan)** module is the operational core of the Equator Insole factory. It manages customer delivery shipments, footwear size breakdowns (EU 36–45), pricing in Indonesian Rupiah, tractor-feed continuous dot-matrix print stream generation for Epson LX-300 / LX-310 printers, and rapid digitization of legacy paper delivery slips.

---

## 2. Relational Database Schema Design (`src/lib/db/schema.ts`)

```typescript
// delivery_orders Table
export const deliveryOrders = sqliteTable("delivery_orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // e.g. SJ/EQ/2026/08/0001
  recipientName: text("recipient_name").notNull(),
  destinationAddress: text("destination_address").notNull(),
  poNumber: text("po_number"),
  vehicleNumber: text("vehicle_number"),
  driverName: text("driver_name"),
  status: text("status").notNull().default("DRAFT"), // DRAFT, CONFIRMED, PRINTED, DISPATCHED, DELIVERED, CANCELLED
  deliveryDate: text("delivery_date").notNull(),
  notes: text("notes"),
  totalQuantity: integer("total_quantity").notNull().default(0), // Total pairs (psg)
  totalAmount: integer("total_amount").notNull().default(0),     // Total IDR value
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// delivery_order_items Table (Line items with size matrix JSON)
export const deliveryOrderItems = sqliteTable("delivery_order_items", {
  id: text("id").primaryKey(),
  deliveryOrderId: text("delivery_order_id").notNull().references(() => deliveryOrders.id, { onDelete: "cascade" }),
  articleCode: text("article_code").notNull(),
  articleName: text("article_name").notNull(),
  colorway: text("colorway"),
  sizeBreakdown: text("size_breakdown").notNull(), // JSON string: { "36": 20, "37": 40, ... }
  totalPairs: integer("total_pairs").notNull().default(0),
  unitPrice: integer("unit_price").default(0),
  totalPrice: integer("total_price").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});
```

---

## 3. Core Business Logic & Algorithms

### 3.1 Sequential Surat Jalan Auto-Numbering (`src/services/orderService.ts`)
```typescript
export async function generateNextOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `SJ/EQ/${year}/${month}/`;

  const existingOrders = await db
    .select({ orderNumber: deliveryOrders.orderNumber })
    .from(deliveryOrders)
    .where(like(deliveryOrders.orderNumber, `${prefix}%`));

  let maxSeq = 0;
  existingOrders.forEach((o) => {
    const parts = o.orderNumber.split("/");
    const seqStr = parts[parts.length - 1];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}
```

### 3.2 Size Breakdown Matrix Auto-Summation
The size breakdown object `{ [size: number]: number }` calculates line item totals and order totals reactively:
```typescript
export function computeItemTotals(sizes: Record<number, number>, unitPrice: number) {
  let totalPairs = 0;
  for (const size of [36, 37, 38, 39, 40, 41, 42, 43, 44, 45]) {
    const qty = sizes[size];
    if (typeof qty === "number" && qty > 0) {
      totalPairs += qty;
    }
  }
  const totalPrice = totalPairs * unitPrice;
  return { totalPairs, totalPrice };
}
```

---

## 4. Hardware Integration: ESC/P 80-Column Dot-Matrix Printer Pipeline

### 4.1 Monospace 80-Column Grid Format (`src/lib/printer/escp.ts`)
Continuous form dot-matrix printers (Epson LX-300 / LX-310) rely on fixed character columns. Each text row MUST measure exactly 80 characters wide:
```
+--------------------------------------------------------------------------------+
| PT EQUATOR INSOLE BANDUNG                           SURAT JALAN / DELIVERY SLIP |
| Jl. Industri Insole No. 88, Bandung                No.  : SJ/EQ/2026/08/0001   |
| Tanggal: 16 Agustus 2026                           Hal. : 1 / 1                |
+--------------------------------------------------------------------------------+
| Kepada Yth: PT BINTANG SEPATU CEMERLANG                                        |
| Alamat    : Kawasan Industri Cimahi Blok D-12, Bandung                         |
+---+----------------------------+--+--+--+--+--+--+--+--+--+--+-----------------+
|No |Artikel & Spesifikasi Insole|36|37|38|39|40|41|42|43|44|45|Total Psg| Catatan|
+---+----------------------------+--+--+--+--+--+--+--+--+--+--+---------+-------+
| 1 |Insole Ortho High Density   |  |10|20|40|50|50|30|10|  |  |  210 psg|EVA 65C |
| 2 |Insole Dynamic Cushion Latex|  |  |15|30|45|45|20|  |  |  |  155 psg|Latex 3m|
+---+----------------------------+--+--+--+--+--+--+--+--+--+--+---------+-------+
| TOTAL KESELURUHAN (PASANG)                                   |  365 psg|        |
+--------------------------------------------------------------+---------+-------+
| Terbilang: Tiga Ratus Enam Puluh Lima Pasang                                   |
+--------------------------------------------------------------------------------+
|   Tanda Terima,               Pengemudi / Ekspedisi,         Hormat Kami,      |
|                                                                                |
|                                                                                |
| (....................)        (....................)    ( Bagian Gudang / DO ) |
+--------------------------------------------------------------------------------+
```

### 4.2 Hardware Control Code Byte Sequences
```typescript
export function buildBinaryEscpStream(plainText: string): Uint8Array {
  const encoder = new TextEncoder();
  const initPrinter = new Uint8Array([0x1b, 0x40]);            // ESC @ (Initialize printer)
  const setPageLength = new Uint8Array([0x1b, 0x43, 0x21]);    // ESC C ! (33 lines for 9.5"x5.5" half-page)
  const formFeed = new Uint8Array([0x0c]);                     // FF (Form Feed / Eject page)

  const textBytes = encoder.encode(plainText);
  const combined = new Uint8Array(initPrinter.length + setPageLength.length + textBytes.length + formFeed.length);

  combined.set(initPrinter, 0);
  combined.set(setPageLength, initPrinter.length);
  combined.set(textBytes, initPrinter.length + setPageLength.length);
  combined.set(formFeed, initPrinter.length + setPageLength.length + textBytes.length);

  return combined;
}
```

---

## 5. UI Architecture: Master-Detail & Quick Archive Digitizer

### 5.1 Multi-Pane Master-Detail View (`src/components/delivery-orders/`)
- **Left Rail (`OrderList.tsx`):** Filter by status (`ALL`, `DRAFT`, `CONFIRMED`, `PRINTED`, `DISPATCHED`, `DELIVERED`), real-time search, live badge status.
- **Right Rail (`OrderDetail.tsx`):** In-place interactive editing mode allowing operators to edit recipient, address, driver, vehicle, and size quantities directly in the sheet without opening complex modal wizards.
- **Print Modal (`PrintModal.tsx`):** Dual-view toggle between raw green-screen ESC/P dot-matrix simulation and printable HTML laser/inkjet sheet.

### 5.2 High-Speed Keyboard Archive Digitizer (`src/components/delivery-orders/ArchiveDigitizer.tsx`)
- Built for transcribing stacks of physical paper delivery slips into digital records.
- **Desktop/Tablet Mode:** 14-column spreadsheet grid where `Tab` advances across size inputs (`36` ➔ `45`) and `Enter` commits the line and adds a new item.
- **Mobile Mode:** Responsive touch cards with a **5x2 Touch Number Pad** (`inputmode="numeric"`) and sticky bottom action bar.

---

## 6. How to Build & Test Phase 1

1. **Run Database Migrations & Seeding:**
   ```bash
   npm run db:seed
   ```
2. **Verify Dot-Matrix Stream Output:**
   Navigate to `/api/orders/[id]/print-escp?format=text` and `/api/orders/[id]/print-escp?format=binary` to inspect exact 80-column alignment.
3. **Run Production Build:**
   ```bash
   npm run build
   ```
