import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InventoryService } from "@/services/inventoryService";

describe("Inventory Stock Health & Safety Threshold Logic", () => {
  it("classifies stock health correctly into HEALTHY, WARNING, and CRITICAL", () => {
    const safetyThreshold = 100;

    // Healthy: Current stock > Safety Threshold (e.g. 150)
    assert.strictEqual(
      InventoryService.computeHealthStatus(150, safetyThreshold),
      "HEALTHY"
    );

    // Warning: Current stock <= Safety Threshold but > 50% (e.g. 80, 100)
    assert.strictEqual(
      InventoryService.computeHealthStatus(100, safetyThreshold),
      "WARNING"
    );
    assert.strictEqual(
      InventoryService.computeHealthStatus(60, safetyThreshold),
      "WARNING"
    );

    // Critical: Current stock <= 50% of Safety Threshold (e.g. 50, 20, 0)
    assert.strictEqual(
      InventoryService.computeHealthStatus(50, safetyThreshold),
      "CRITICAL"
    );
    assert.strictEqual(
      InventoryService.computeHealthStatus(10, safetyThreshold),
      "CRITICAL"
    );
    assert.strictEqual(
      InventoryService.computeHealthStatus(0, safetyThreshold),
      "CRITICAL"
    );
  });
});
