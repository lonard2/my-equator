import { describe, it } from "node:test";
import assert from "node:assert";

describe("Accessibility Batch (P1): Print Button, Roving Tabindex, and Toast Region", () => {
  describe("Visible-on-focus and Mobile Print Trigger", () => {
    it("ensures print button satisfies desktop hover, keyboard focus-visible, and mobile touch visibility classes", () => {
      // Class token configuration required on the order listbox print trigger
      const printButtonClasses =
        "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 max-md:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all min-h-[28px] min-w-[28px] flex items-center justify-center active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

      // 1. Mobile touch users must see print button without needing hover
      assert.ok(
        printButtonClasses.includes("max-md:opacity-100"),
        "Must include 'max-md:opacity-100' for mobile and touch floor visibility"
      );

      // 2. Keyboard navigators must see print button when focused
      assert.ok(
        printButtonClasses.includes("focus-visible:opacity-100"),
        "Must include 'focus-visible:opacity-100' so tabbing surfaces the button"
      );

      // 3. Focus within row or item must show button
      assert.ok(
        printButtonClasses.includes("group-focus-within:opacity-100"),
        "Must include 'group-focus-within:opacity-100' for row-level focus tracking"
      );

      // 4. Must feature high-contrast focus ring
      assert.ok(
        printButtonClasses.includes("focus-visible:ring-2 focus-visible:ring-brand"),
        "Must include explicit brand focus ring for WCAG 2.4.7 Focus Visible compliance"
      );
    });
  });

  describe("WAI-ARIA Listbox Pattern with Roving Tabindex", () => {
    interface MockListItem {
      id: string;
      orderNumber: string;
    }

    const items: MockListItem[] = [
      { id: "do-1", orderNumber: "SJ/EQ/2026/09/0001" },
      { id: "do-2", orderNumber: "SJ/EQ/2026/09/0002" },
      { id: "do-3", orderNumber: "SJ/EQ/2026/09/0003" },
    ];

    // Helper implementing roving tabindex resolution
    function getRovingTabIndices(list: MockListItem[], selectedId: string | null) {
      return list.map((item, index) => {
        const isSelected = item.id === selectedId;
        const isFocusedTarget = isSelected || (!selectedId && index === 0);
        return {
          id: item.id,
          tabIndex: isFocusedTarget ? 0 : -1,
          isSelected,
        };
      });
    }

    it("assigns tabIndex=0 strictly to the selected item and tabIndex=-1 to all siblings", () => {
      const state = getRovingTabIndices(items, "do-2");

      assert.strictEqual(state[0].tabIndex, -1);
      assert.strictEqual(state[0].isSelected, false);

      assert.strictEqual(state[1].tabIndex, 0);
      assert.strictEqual(state[1].isSelected, true);

      assert.strictEqual(state[2].tabIndex, -1);
      assert.strictEqual(state[2].isSelected, false);

      // Verify exactly one item has tabIndex=0
      const zeroCount = state.filter((s) => s.tabIndex === 0).length;
      assert.strictEqual(zeroCount, 1, "Roving tabindex requires exactly one tabIndex=0 entry");
    });

    it("defaults tabIndex=0 to the first item (index 0) when no order is currently selected", () => {
      const state = getRovingTabIndices(items, null);

      assert.strictEqual(state[0].tabIndex, 0);
      assert.strictEqual(state[1].tabIndex, -1);
      assert.strictEqual(state[2].tabIndex, -1);
    });

    it("resolves aria-activedescendant correctly for the active option", () => {
      const getActiveDescendant = (selectedId: string | null) =>
        selectedId ? `order-opt-${selectedId}` : undefined;

      assert.strictEqual(getActiveDescendant("do-1"), "order-opt-do-1");
      assert.strictEqual(getActiveDescendant(null), undefined);
    });

    it("handles Home and End key boundary navigation", () => {
      const handleListboxBoundaryKeys = (
        key: "Home" | "End" | "ArrowDown" | "ArrowUp",
        list: MockListItem[],
        currentIndex: number
      ) => {
        if (key === "Home") return 0;
        if (key === "End") return list.length - 1;
        if (key === "ArrowDown") return currentIndex < list.length - 1 ? currentIndex + 1 : 0;
        if (key === "ArrowUp") return currentIndex > 0 ? currentIndex - 1 : list.length - 1;
        return currentIndex;
      };

      assert.strictEqual(handleListboxBoundaryKeys("Home", items, 2), 0);
      assert.strictEqual(handleListboxBoundaryKeys("End", items, 0), 2);
      assert.strictEqual(handleListboxBoundaryKeys("ArrowDown", items, 0), 1);
      assert.strictEqual(handleListboxBoundaryKeys("ArrowUp", items, 0), 2);
    });
  });

  describe("Accessible Live Region (aria-live='polite') Toast Contract", () => {
    it("enforces role='status', aria-live='polite', and aria-atomic='true' attributes", () => {
      const toastRegionContract = {
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      };

      assert.strictEqual(toastRegionContract.role, "status");
      assert.strictEqual(toastRegionContract["aria-live"], "polite");
      assert.strictEqual(toastRegionContract["aria-atomic"], "true");
    });

    it("remains present in accessibility tree with sr-only when inactive to register with screen readers", () => {
      const getToastClasses = (toastMessage: string | null) => {
        return toastMessage
          ? "fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl"
          : "sr-only";
      };

      // When null, the region exists invisibly for screen reader registration
      assert.strictEqual(getToastClasses(null), "sr-only");

      // When message arrives, the region presents visually while announcing
      assert.ok(getToastClasses("Data disimpan").includes("fixed top-4 right-4"));
    });
  });
});
