import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalizeDraftOrder } from "../../src/components/assistant/KhatulistiwaAssistant";

describe("Khatulistiwa AI Assistant Hardening & Usability Contracts", () => {
  const assistantSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/assistant/KhatulistiwaAssistant.tsx"),
    "utf-8"
  );
  const pageSource = fs.readFileSync(
    path.join(process.cwd(), "src/app/page.tsx"),
    "utf-8"
  );

  describe("1. Footwear Size Breakdown & Draft Schema Normalization", () => {
    it("returns null when raw draft is null or undefined", () => {
      assert.strictEqual(normalizeDraftOrder(null), null);
      assert.strictEqual(normalizeDraftOrder(undefined), null);
    });

    it("preserves explicit top-level size_breakdown and total_pairs", () => {
      const raw = {
        recipient_name: "PT KMK GLOBAL SPORTS",
        size_breakdown: { "40": 50, "41": 50 },
        total_pairs: 100,
      };
      const normalized = normalizeDraftOrder(raw);
      assert.deepStrictEqual(normalized?.size_breakdown, { "40": 50, "41": 50 });
      assert.strictEqual(normalized?.total_pairs, 100);
      assert.strictEqual(normalized?.recipient_name, "PT KMK GLOBAL SPORTS");
    });

    it("normalizes nested items[].sizes from OpenRouter tool calling format into top-level size_breakdown", () => {
      const raw = {
        recipient_name: "PT ADIS DIMENSION FOOTWEAR",
        destination_address: "Balaraja, Tangerang",
        po_number: "PO-ADIS-772",
        items: [
          {
            article_code: "EQ-SPORT-01",
            sizes: { "39": 60, "40": 80, "41": 80, "42": 80 },
          },
        ],
      };
      const normalized = normalizeDraftOrder(raw);
      assert.ok(normalized);
      assert.strictEqual(normalized.total_pairs, 300);
      assert.deepStrictEqual(normalized.size_breakdown, {
        "39": 60,
        "40": 80,
        "41": 80,
        "42": 80,
      });
      assert.strictEqual(normalized.recipient_name, "PT ADIS DIMENSION FOOTWEAR");
    });

    it("aggregates footwear sizes across multiple item lines", () => {
      const raw = {
        items: [
          { sizes: { "40": 20, "41": 30 } },
          { sizes: { "41": 20, "42": 40 } },
        ],
      };
      const normalized = normalizeDraftOrder(raw);
      assert.ok(normalized);
      assert.strictEqual(normalized.total_pairs, 110);
      assert.deepStrictEqual(normalized.size_breakdown, {
        "40": 20,
        "41": 50,
        "42": 40,
      });
    });
  });

  describe("2. Color Doctrine & Crimson Scarcity Compliance", () => {
    it("ensures user speech bubbles do NOT use brand crimson (bg-brand)", () => {
      // User bubble must not use bg-brand
      const hasUserBrandBubble = /isUser\s*\?\s*["'][^"']*bg-brand/.test(assistantSource);
      assert.strictEqual(
        hasUserBrandBubble,
        false,
        "User speech bubbles must not use brand crimson; they must use dark neutral ink per Crimson Scarcity doctrine."
      );
    });

    it("verifies user speech bubbles use neutral ink classes", () => {
      assert.match(
        assistantSource,
        /bg-neutral-900\s+dark:bg-neutral-100/,
        "User speech bubbles must use neutral dark-ink styling."
      );
    });

    it("verifies staged draft card uses Amber Data Tokens and avoids premature 'Terverifikasi' claim", () => {
      // Must use amber border / bg
      assert.match(
        assistantSource,
        /border-amber-300\s+dark:border-amber-700/,
        "Staged draft card must use amber data tokens."
      );
      assert.match(
        assistantSource,
        /Draft Surat Jalan Siap Ditinjau/,
        "Staged card label must read 'Draft Surat Jalan Siap Ditinjau' (not 'Terverifikasi')."
      );
      const hasPrematureVerified = /Draft Surat Jalan Terverifikasi/.test(assistantSource);
      assert.strictEqual(
        hasPrematureVerified,
        false,
        "Staged card must not use premature 'Terverifikasi' label."
      );
    });
  });

  describe("3. Modal Safety, Focus Trapping & Accessibility", () => {
    it("invokes useModalSafety hook for both floating drawer and confirmation modal", () => {
      assert.match(
        assistantSource,
        /import\s*{\s*useModalSafety\s*}\s*from\s*["']@\/lib\/utils\/useModalSafety["']/,
        "Assistant component must import useModalSafety."
      );
      assert.match(
        assistantSource,
        /useModalSafety\({\s*isOpen:\s*isConfirmClearOpen/,
        "Confirmation modal must be wrapped with useModalSafety."
      );
      assert.match(
        assistantSource,
        /useModalSafety\({\s*isOpen:\s*isOpen\s*&&\s*!isConfirmClearOpen/,
        "Assistant drawer must be wrapped with useModalSafety for Escape key and focus trapping."
      );
    });

    it("auto-focuses Cancel button in clear chat confirmation modal to prevent accidental data wipe", () => {
      assert.match(
        assistantSource,
        /initialFocusRef:\s*cancelClearRef/,
        "Clear chat modal must autofocus Cancel button first."
      );
    });

    it("auto-focuses textarea when Khatulistiwa AI opens", () => {
      assert.match(
        assistantSource,
        /initialFocusRef:\s*textareaRef/,
        "Assistant drawer must autofocus textarea when opened for instant typing."
      );
    });

    it("verifies dialog semantics on both confirmation modal and assistant drawer", () => {
      assert.match(
        assistantSource,
        /role="dialog"/,
        "Must declare role='dialog'."
      );
      assert.match(
        assistantSource,
        /aria-modal="true"/,
        "Clear confirmation modal must declare aria-modal='true'."
      );
      assert.match(
        assistantSource,
        /aria-labelledby="clear-chat-title"/,
        "Clear confirmation modal must bind aria-labelledby to its title."
      );
    });

    it("verifies backdrop click dismissal on clear chat modal overlay", () => {
      assert.match(
        assistantSource,
        /onClick=\{\(\)\s*=>\s*setIsConfirmClearOpen\(false\)\}/,
        "Clear confirmation backdrop overlay must dismiss on click."
      );
    });
  });

  describe("4. Touch Targets & Responsive Ergonomics (WCAG >=44px)", () => {
    it("enforces minimum 44px touch targets on interactive controls", () => {
      assert.match(
        assistantSource,
        /min-h-\[48px\]/,
        "Floating launcher button must have min-h-[48px]."
      );
      assert.match(
        assistantSource,
        /min-h-\[44px\]\s+min-w-\[44px\]/,
        "Header controls and icon buttons must enforce min 44px tap targets."
      );
      assert.match(
        assistantSource,
        /min-h-\[44px\]\s+rounded-xl\s+border/,
        "Quick suggestion chips must meet the 44px touch height floor."
      );
    });

    it("enforces 10px minimum typography floor (zero sub-10px fonts)", () => {
      const hasSub10px = /text-\[(?:[1-9])px\]/.test(assistantSource);
      assert.strictEqual(
        hasSub10px,
        false,
        "Assistant must not contain fonts under 10px."
      );
    });
  });

  describe("5. Workflow Collision Prevention & Error Recovery", () => {
    it("auto-closes assistant when applying draft order to prevent covering OrderFormModal", () => {
      assert.match(
        assistantSource,
        /onApplyDraftOrder\(staged\);[\s\S]*?onToggle\(\);/,
        "Applying draft order must invoke onToggle() to close assistant drawer."
      );
      assert.match(
        pageSource,
        /setIsAssistantOpen\(false\);\s+setIsFormOpen\(true\);/,
        "page.tsx handleApplyDraftOrder must ensure assistant is closed when OrderFormModal opens."
      );
    });

    it("provides error retry action with prompt retention", () => {
      assert.match(
        assistantSource,
        /lastFailedPrompt/,
        "Assistant must retain failed prompt in state."
      );
      assert.match(
        assistantSource,
        /Coba Lagi/,
        "Assistant must offer inline 'Coba Lagi' retry button upon failure."
      );
    });

    it("features progressive disclosure for AI model selection", () => {
      assert.match(
        assistantSource,
        /isModelSelectorOpen/,
        "Model selector must be collapsible via isModelSelectorOpen state."
      );
      assert.match(
        assistantSource,
        /id="assistant-model-selector"/,
        "Collapsible model selector must have accessible id bound to aria-controls."
      );
    });
  });
});
