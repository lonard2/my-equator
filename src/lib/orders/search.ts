import { DeliveryOrder } from "@/types";

/**
 * Single source of truth for delivery-order text search.
 * Consumed by the desktop rail (OrderList), the mobile feed (page), and the
 * filter-chip counters so chips can never contradict the visible list.
 */
export function matchesOrderSearch(order: DeliveryOrder, rawTerm: string): boolean {
  const q = rawTerm.trim().toLowerCase();
  if (!q) return true;
  return (
    order.orderNumber.toLowerCase().includes(q) ||
    order.recipientName.toLowerCase().includes(q) ||
    Boolean(order.destinationAddress && order.destinationAddress.toLowerCase().includes(q)) ||
    Boolean(order.poNumber && order.poNumber.toLowerCase().includes(q)) ||
    Boolean(order.driverName && order.driverName.toLowerCase().includes(q)) ||
    Boolean(order.vehicleNumber && order.vehicleNumber.toLowerCase().includes(q))
  );
}
