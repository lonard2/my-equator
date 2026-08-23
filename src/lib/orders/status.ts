import { DeliveryOrderStatus } from "@/types";

export const VALID_STATUS_TRANSITIONS: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PRINTED", "DRAFT", "CANCELLED"],
  PRINTED: ["DISPATCHED", "CONFIRMED", "DRAFT", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "PRINTED", "CONFIRMED", "DRAFT", "CANCELLED"],
  DELIVERED: ["DISPATCHED", "CANCELLED"],
  CANCELLED: ["DRAFT"],
};

export const STATUS_ROLLBACK_TARGETS: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> = {
  DRAFT: [],
  CONFIRMED: ["DRAFT"],
  PRINTED: ["CONFIRMED", "DRAFT"],
  DISPATCHED: ["PRINTED", "CONFIRMED", "DRAFT"],
  DELIVERED: ["DISPATCHED"],
  CANCELLED: ["DRAFT"],
};

export function canTransitionStatus(from: DeliveryOrderStatus, to: DeliveryOrderStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getAvailableStatusRollbacks(currentStatus: DeliveryOrderStatus): DeliveryOrderStatus[] {
  return STATUS_ROLLBACK_TARGETS[currentStatus] || [];
}
