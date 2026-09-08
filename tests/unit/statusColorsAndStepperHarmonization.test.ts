import { describe, it } from "node:test";
import assert from "node:assert";
import { STATUS_COLOR_MAP, getStatusToken } from "../../src/lib/utils/statusColors";
import { DeliveryOrderStatus } from "../../src/types";

describe("Status Color Harmonization & Stepper De-escalation", () => {
  describe("DESIGN.md Color Fidelity", () => {
    it("binds each status to its exact hex specification from DESIGN.md", () => {
      assert.strictEqual(STATUS_COLOR_MAP.DRAFT.hex, "#6B7280");
      assert.strictEqual(STATUS_COLOR_MAP.CONFIRMED.hex, "#1D4ED8");
      assert.strictEqual(STATUS_COLOR_MAP.PRINTED.hex, "#B45309");
      assert.strictEqual(STATUS_COLOR_MAP.DISPATCHED.hex, "#6D28D9");
      assert.strictEqual(STATUS_COLOR_MAP.DELIVERED.hex, "#047857");
      assert.strictEqual(STATUS_COLOR_MAP.CANCELLED.hex, "#B91C1C");
    });

    it("ensures fallback getStatusToken returns DRAFT on unmapped status", () => {
      // @ts-expect-error test invalid fallback
      const token = getStatusToken("UNKNOWN_STATUS");
      assert.strictEqual(token.status, "DRAFT");
    });
  });

  describe("Stepper Current-Step Ring De-escalation (No Red on Non-Danger States)", () => {
    it("prohibits red ring classes on all operational active states (DRAFT, CONFIRMED, PRINTED, DISPATCHED, DELIVERED)", () => {
      const operationalStatuses: DeliveryOrderStatus[] = [
        "DRAFT",
        "CONFIRMED",
        "PRINTED",
        "DISPATCHED",
        "DELIVERED",
      ];

      for (const st of operationalStatuses) {
        const token = STATUS_COLOR_MAP[st];
        assert.doesNotMatch(
          token.stepper.activeRing,
          /ring-red-/i,
          `Operational status '${st}' must NOT use danger red ring in stepper`
        );
      }
    });

    it("verifies semantic status rings match each state's own color family", () => {
      assert.ok(STATUS_COLOR_MAP.CONFIRMED.stepper.activeRing.includes("ring-blue-"));
      assert.ok(STATUS_COLOR_MAP.PRINTED.stepper.activeRing.includes("ring-amber-"));
      assert.ok(STATUS_COLOR_MAP.DISPATCHED.stepper.activeRing.includes("ring-purple-"));
      assert.ok(STATUS_COLOR_MAP.DELIVERED.stepper.activeRing.includes("ring-emerald-"));
      assert.ok(STATUS_COLOR_MAP.DRAFT.stepper.activeRing.includes("ring-gray-"));
    });
  });

  describe("CTA Button & Badge Harmonization", () => {
    it("ensures forward CTA for DISPATCHED uses purple classes matching the DISPATCHED token", () => {
      const dispatchedCta = STATUS_COLOR_MAP.DISPATCHED.cta.buttonClasses;
      assert.ok(
        dispatchedCta.includes("bg-purple-600"),
        "Kirimkan / Dispatch CTA must use purple, matching the violet DISPATCHED badge"
      );
      assert.doesNotMatch(
        dispatchedCta,
        /bg-amber-/,
        "Dispatch CTA must not use amber (which was conflicting with PRINTED)"
      );
    });

    it("ensures forward CTA for DELIVERED uses emerald classes", () => {
      const deliveredCta = STATUS_COLOR_MAP.DELIVERED.cta.buttonClasses;
      assert.ok(deliveredCta.includes("bg-emerald-600"));
    });

    it("ensures StatusBadge badge and dot classes align with DESIGN.md color groups", () => {
      assert.ok(STATUS_COLOR_MAP.CONFIRMED.badge.classes.includes("blue"));
      assert.ok(STATUS_COLOR_MAP.PRINTED.badge.classes.includes("amber"));
      assert.ok(STATUS_COLOR_MAP.DISPATCHED.badge.classes.includes("purple"));
      assert.ok(STATUS_COLOR_MAP.DELIVERED.badge.classes.includes("emerald"));
      assert.ok(STATUS_COLOR_MAP.CANCELLED.badge.classes.includes("red"));
      assert.ok(STATUS_COLOR_MAP.DRAFT.badge.classes.includes("gray"));
    });
  });
});
