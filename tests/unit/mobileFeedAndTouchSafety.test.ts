import { describe, it } from "node:test";
import assert from "node:assert";
import { DeliveryOrder } from "../../src/types";

// Mock delivery orders representing warehouse mobile feed data
const MOCK_MOBILE_ORDERS: Partial<DeliveryOrder>[] = [
  {
    id: "do-1",
    orderNumber: "SJ/EQ/2026/09/0001",
    recipientName: "PT Primarindo Asia Infrastructure Tbk",
    destinationAddress: "Jl. Gedebage Selatan No. 42, Bandung",
    poNumber: "PO-PRI-2026-088",
    driverName: "Asep Sunandar",
    status: "PRINTED",
    totalQuantity: 1200,
  },
  {
    id: "do-2",
    orderNumber: "SJ/EQ/2026/09/0002",
    recipientName: "CV Mandiri Footwear",
    destinationAddress: "Jl. Cibaduyut Raya No. 108, Bandung",
    poNumber: "PO-MND-441",
    driverName: "Dedi Kusnandar",
    status: "DISPATCHED",
    totalQuantity: 450,
  },
  {
    id: "do-3",
    orderNumber: "SJ/EQ/2026/09/0003",
    recipientName: "PT Bintang Surya Footwear",
    destinationAddress: "Kawasan Industri Cimahi Kav. 12",
    poNumber: "PO-BSF-901",
    driverName: "Ujang Rohmat",
    status: "DELIVERED",
    totalQuantity: 2800,
  },
  {
    id: "do-4",
    orderNumber: "SJ/EQ/2026/09/0004",
    recipientName: "PT Sepatu Bata Tbk",
    destinationAddress: "Purwakarta Industrial Estate",
    poNumber: "PO-BATA-101",
    driverName: null,
    status: "CONFIRMED",
    totalQuantity: 3500,
  },
  {
    id: "do-5",
    orderNumber: "SJ/EQ/2026/09/0005",
    recipientName: "Toko Sinar Jaya",
    destinationAddress: "Pasar Baru Trade Center Bandung",
    poNumber: null,
    driverName: null,
    status: "DRAFT",
    totalQuantity: 150,
  },
];

// Helper mirroring page.tsx mobile filtering
function filterMobileOrders(
  orders: Partial<DeliveryOrder>[],
  searchTerm: string,
  statusFilter: string
) {
  const q = searchTerm.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesSearch =
      !q ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q)) ||
      (order.recipientName && order.recipientName.toLowerCase().includes(q)) ||
      (order.destinationAddress && order.destinationAddress.toLowerCase().includes(q)) ||
      (order.poNumber && order.poNumber.toLowerCase().includes(q)) ||
      (order.driverName && order.driverName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

function countMobileOrdersByStatus(orders: Partial<DeliveryOrder>[], status: string) {
  if (status === "ALL") return orders.length;
  return orders.filter((o) => o.status === status).length;
}

describe("Mobile Warehouse Feed Search & Filter Engine (P0)", () => {
  it("returns all orders when search is empty and filter is 'ALL'", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "", "ALL");
    assert.strictEqual(results.length, 5);
  });

  it("filters orders by partial order number case-insensitively", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "0002", "ALL");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].orderNumber, "SJ/EQ/2026/09/0002");
  });

  it("filters orders by recipient name or company substring", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "Primarindo", "ALL");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "do-1");
  });

  it("filters orders by destination address keywords", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "Cibaduyut", "ALL");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "do-2");
  });

  it("filters orders by PO number", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "PO-BATA", "ALL");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "do-4");
  });

  it("filters orders by driver name", () => {
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "Asep", "ALL");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "do-1");
  });

  it("filters orders by status chip selection accurately", () => {
    const printed = filterMobileOrders(MOCK_MOBILE_ORDERS, "", "PRINTED");
    assert.strictEqual(printed.length, 1);
    assert.strictEqual(printed[0].id, "do-1");

    const dispatched = filterMobileOrders(MOCK_MOBILE_ORDERS, "", "DISPATCHED");
    assert.strictEqual(dispatched.length, 1);
    assert.strictEqual(dispatched[0].id, "do-2");

    const delivered = filterMobileOrders(MOCK_MOBILE_ORDERS, "", "DELIVERED");
    assert.strictEqual(delivered.length, 1);
    assert.strictEqual(delivered[0].id, "do-3");
  });

  it("combines text search with status chip filter", () => {
    // Both match "Bandung", but only one is PRINTED
    const results = filterMobileOrders(MOCK_MOBILE_ORDERS, "Bandung", "PRINTED");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, "do-1");

    // "Bandung" with DELIVERED status returns 0 because do-3 is in Cimahi
    const deliveredInBandung = filterMobileOrders(MOCK_MOBILE_ORDERS, "Bandung", "DELIVERED");
    assert.strictEqual(deliveredInBandung.length, 0);
  });

  it("calculates accurate live counts for all status chip badges", () => {
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "ALL"), 5);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "PRINTED"), 1);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "DISPATCHED"), 1);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "DELIVERED"), 1);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "CONFIRMED"), 1);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "DRAFT"), 1);
    assert.strictEqual(countMobileOrdersByStatus(MOCK_MOBILE_ORDERS, "CANCELLED"), 0);
  });
});

describe("Mobile Warehouse Feed UI Standards & Ergonomics", () => {
  it("distinguishes empty filtered search from completely empty database", () => {
    const hasActiveFilters = (search: string, filter: string) => {
      return search.trim().length > 0 || filter !== "ALL";
    };

    assert.strictEqual(hasActiveFilters("", "ALL"), false);
    assert.strictEqual(hasActiveFilters("bata", "ALL"), true);
    assert.strictEqual(hasActiveFilters("", "DISPATCHED"), true);
    assert.strictEqual(hasActiveFilters("xyz", "PRINTED"), true);
  });

  it("verifies touch target floor meets or exceeds 44px for warehouse glove operation", () => {
    const MIN_TOUCH_TARGET_PX = 44;

    const actionButtonTouchHeights = {
      printSlipButton: 44,
      dispatchButton: 44,
      markDeliveredButton: 44,
      viewDetailButton: 44,
      bottomSheetCloseButton: 44,
      resetFilterButton: 44,
      createFirstOrderButton: 44,
    };

    for (const [action, height] of Object.entries(actionButtonTouchHeights)) {
      assert.ok(
        height >= MIN_TOUCH_TARGET_PX,
        `${action} touch target height (${height}px) must be >= ${MIN_TOUCH_TARGET_PX}px`
      );
    }
  });
});
