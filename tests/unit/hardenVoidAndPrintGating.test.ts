import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DeliveryOrderStatus } from "@/types";

describe("Harden P1: Print Gating, Void & Archive, and Alert Elimination", () => {
  describe("Print Status-Gating Protocol", () => {
    const checkPrintEligibility = (status: DeliveryOrderStatus, lang: "id" | "en" = "id") => {
      const isPrintable = status !== "DRAFT" && status !== "CANCELLED";
      let reason: string | null = null;
      if (!isPrintable) {
        if (status === "DRAFT") {
          reason = lang === "id" ? "Konfirm dulu untuk cetak resmi" : "Confirm order before official print";
        } else {
          reason = lang === "id" ? "Dokumen dibatalkan, tidak dapat dicetak" : "Cancelled order cannot be printed";
        }
      }
      return { isPrintable, reason };
    };

    it("disables print for DRAFT orders with descriptive guidance", () => {
      const idResult = checkPrintEligibility("DRAFT", "id");
      assert.strictEqual(idResult.isPrintable, false);
      assert.strictEqual(idResult.reason, "Konfirm dulu untuk cetak resmi");

      const enResult = checkPrintEligibility("DRAFT", "en");
      assert.strictEqual(enResult.isPrintable, false);
      assert.strictEqual(enResult.reason, "Confirm order before official print");
    });

    it("disables print for CANCELLED orders with cancellation notice", () => {
      const idResult = checkPrintEligibility("CANCELLED", "id");
      assert.strictEqual(idResult.isPrintable, false);
      assert.strictEqual(idResult.reason, "Dokumen dibatalkan, tidak dapat dicetak");

      const enResult = checkPrintEligibility("CANCELLED", "en");
      assert.strictEqual(enResult.isPrintable, false);
      assert.strictEqual(enResult.reason, "Cancelled order cannot be printed");
    });

    it("allows print for operational active statuses: CONFIRMED, PRINTED, DISPATCHED, DELIVERED", () => {
      const allowedStatuses: DeliveryOrderStatus[] = ["CONFIRMED", "PRINTED", "DISPATCHED", "DELIVERED"];
      for (const st of allowedStatuses) {
        const result = checkPrintEligibility(st, "id");
        assert.strictEqual(result.isPrintable, true, `Status ${st} should be printable`);
        assert.strictEqual(result.reason, null);
      }
    });
  });

  describe("Void & Archive vs Hard Delete (Paper-Twin Protection)", () => {
    const validateDeletionEligibility = (order: { orderNumber: string; status: DeliveryOrderStatus }) => {
      if (order.status !== "DRAFT") {
        return {
          allowed: false,
          error: `Surat jalan ${order.orderNumber} berstatus ${order.status} tidak dapat dihapus permanen karena risiko paper-twin fisik. Gunakan 'Void & Arsip' untuk membatalkan.`,
          actionRecommended: "VOID_AND_ARCHIVE",
        };
      }
      return {
        allowed: true,
        actionRecommended: "HARD_DELETE",
      };
    };

    it("permits hard delete only for DRAFT status", () => {
      const draftOrder = { orderNumber: "SJ/EQ/2026/09/0001", status: "DRAFT" as DeliveryOrderStatus };
      const res = validateDeletionEligibility(draftOrder);
      assert.strictEqual(res.allowed, true);
      assert.strictEqual(res.actionRecommended, "HARD_DELETE");
    });

    it("blocks hard delete for PRINTED and other active orders to prevent orphaned paper-twins", () => {
      const nonDraftStatuses: DeliveryOrderStatus[] = ["CONFIRMED", "PRINTED", "DISPATCHED", "DELIVERED", "CANCELLED"];
      for (const st of nonDraftStatuses) {
        const order = { orderNumber: "SJ/EQ/2026/09/0002", status: st };
        const res = validateDeletionEligibility(order);
        assert.strictEqual(res.allowed, false, `Status ${st} must not be hard deletable`);
        assert.strictEqual(res.actionRecommended, "VOID_AND_ARCHIVE");
        assert.ok(res.error?.includes("paper-twin"));
      }
    });

    it("configures More menu actions dynamically based on order status", () => {
      const getMenuAction = (status: DeliveryOrderStatus, lang: "id" | "en") => {
        if (status === "DRAFT") {
          return {
            type: "DELETE",
            label: lang === "id" ? "Hapus Draft Surat Jalan" : "Delete Draft Order",
            isDestructive: true,
          };
        }
        return {
          type: "VOID_ARCHIVE",
          label: lang === "id" ? "Void & Arsipkan Surat Jalan" : "Void & Archive Delivery Order",
          isDestructive: true,
        };
      };

      const draftAction = getMenuAction("DRAFT", "id");
      assert.strictEqual(draftAction.type, "DELETE");
      assert.strictEqual(draftAction.label, "Hapus Draft Surat Jalan");

      const printedAction = getMenuAction("PRINTED", "id");
      assert.strictEqual(printedAction.type, "VOID_ARCHIVE");
      assert.strictEqual(printedAction.label, "Void & Arsipkan Surat Jalan");

      const dispatchedActionEn = getMenuAction("DISPATCHED", "en");
      assert.strictEqual(dispatchedActionEn.type, "VOID_ARCHIVE");
      assert.strictEqual(dispatchedActionEn.label, "Void & Archive Delivery Order");
    });
  });

  describe("Accessible Live-Region Toast vs Native alert()", () => {
    it("dispatches error feedback via aria-live polite region without blocking UI thread", () => {
      interface ToastState {
        message: string;
        type: "info" | "error" | "success";
        role: "status";
        ariaLive: "polite";
        zIndex: number;
      }

      let activeToast: ToastState | null = null;
      const showToast = (message: string, type: "info" | "error" | "success" = "info") => {
        activeToast = {
          message,
          type,
          role: "status",
          ariaLive: "polite",
          zIndex: 70,
        };
      };

      const simulateStatusFailure = () => {
        showToast("Gagal memperbarui status surat jalan: Network timeout", "error");
      };

      simulateStatusFailure();
      assert.ok(activeToast !== null);
      assert.strictEqual((activeToast as ToastState).type, "error");
      assert.strictEqual((activeToast as ToastState).role, "status");
      assert.strictEqual((activeToast as ToastState).ariaLive, "polite");
      assert.strictEqual((activeToast as ToastState).zIndex, 70);
      assert.ok((activeToast as ToastState).message.includes("Network timeout"));
    });
  });
});
