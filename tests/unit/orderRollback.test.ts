import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionStatus,
  getAvailableStatusRollbacks,
  DeliveryOrderStatus,
} from "@/services/orderService";

describe("Delivery Order Status Rollback, Reversal & Cancellation Lifecycle", () => {
  it("allows standard forward progression", () => {
    assert.strictEqual(canTransitionStatus("DRAFT", "CONFIRMED"), true);
    assert.strictEqual(canTransitionStatus("CONFIRMED", "PRINTED"), true);
    assert.strictEqual(canTransitionStatus("PRINTED", "DISPATCHED"), true);
    assert.strictEqual(canTransitionStatus("DISPATCHED", "DELIVERED"), true);
  });

  it("allows safe operational rollbacks / reversals to earlier states", () => {
    // Delivered back to dispatched (e.g. customer rejected or wrong address)
    assert.strictEqual(canTransitionStatus("DELIVERED", "DISPATCHED"), true);

    // Dispatched back to printed or confirmed (e.g. driver dispatch cancelled / wrong armada)
    assert.strictEqual(canTransitionStatus("DISPATCHED", "PRINTED"), true);
    assert.strictEqual(canTransitionStatus("DISPATCHED", "CONFIRMED"), true);

    // Printed back to confirmed or draft (e.g. wrong size matrix or pricing error before physical loading)
    assert.strictEqual(canTransitionStatus("PRINTED", "CONFIRMED"), true);
    assert.strictEqual(canTransitionStatus("PRINTED", "DRAFT"), true);

    // Confirmed back to draft (e.g. customer requested changes before printing)
    assert.strictEqual(canTransitionStatus("CONFIRMED", "DRAFT"), true);

    // Re-opening a cancelled order back to draft
    assert.strictEqual(canTransitionStatus("CANCELLED", "DRAFT"), true);
  });

  it("allows direct cancellation from any active status", () => {
    assert.strictEqual(canTransitionStatus("DRAFT", "CANCELLED"), true);
    assert.strictEqual(canTransitionStatus("CONFIRMED", "CANCELLED"), true);
    assert.strictEqual(canTransitionStatus("PRINTED", "CANCELLED"), true);
    assert.strictEqual(canTransitionStatus("DISPATCHED", "CANCELLED"), true);
  });

  it("lists appropriate available rollback targets for each status", () => {
    const deliveredRollbacks = getAvailableStatusRollbacks("DELIVERED");
    assert.ok(deliveredRollbacks.includes("DISPATCHED"));

    const dispatchedRollbacks = getAvailableStatusRollbacks("DISPATCHED");
    assert.ok(dispatchedRollbacks.includes("PRINTED"));
    assert.ok(dispatchedRollbacks.includes("CONFIRMED"));
    assert.ok(dispatchedRollbacks.includes("DRAFT"));

    const printedRollbacks = getAvailableStatusRollbacks("PRINTED");
    assert.ok(printedRollbacks.includes("CONFIRMED"));
    assert.ok(printedRollbacks.includes("DRAFT"));

    const draftRollbacks = getAvailableStatusRollbacks("DRAFT");
    assert.strictEqual(draftRollbacks.length, 0, "Draft has no earlier rollback target");
  });
});
