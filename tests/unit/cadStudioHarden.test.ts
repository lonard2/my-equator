import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Insole CAD Studio P0 Hardenings (Impeccable Harden)", () => {
  const cadStudioPath = path.resolve(process.cwd(), "src/components/design-studio/CadStudio.tsx");
  const cadAiModalPath = path.resolve(process.cwd(), "src/components/design-studio/CadAiModal.tsx");

  const cadStudioSource = fs.readFileSync(cadStudioPath, "utf-8");
  const cadAiModalSource = fs.readFileSync(cadAiModalPath, "utf-8");

  describe("P0-1: Blueprint-Save Failure Toast Re-toning", () => {
    it("verifies blueprint-save API failure re-tones showToast to error", () => {
      // Must pass "error" tone on json.success === false
      assert.ok(
        cadStudioSource.includes(
          'showToast(json.error || (isId ? "Gagal menyimpan blueprint." : "Failed to save blueprint."), "error");'
        ),
        "API failure branch must explicitly pass 'error' tone to showToast"
      );
    });

    it("verifies blueprint-save network catch re-tones showToast to error", () => {
      // Must pass "error" tone on catch (err)
      assert.ok(
        cadStudioSource.includes(
          'showToast(isId ? "Terjadi kesalahan saat menyimpan blueprint." : "Error saving blueprint.", "error");'
        ),
        "Network catch block must explicitly pass 'error' tone to showToast"
      );
    });

    it("verifies showToast properly clears existing timeout to prevent ghost auto-dismissal", () => {
      assert.ok(
        cadStudioSource.includes("toastTimeoutRef.current") &&
          cadStudioSource.includes("clearTimeout(toastTimeoutRef.current)"),
        "showToast must clear prior timeout ref before establishing new auto-dismiss timer"
      );
    });
  });

  describe("P0-2: AI Modal success:false Branch & Red Error Card with Retry", () => {
    it("verifies success:false branch in AI modal sets explicit error state instead of silent failure", () => {
      assert.ok(
        cadAiModalSource.includes("const [error, setError] = useState<string | null>(null);"),
        "CadAiModal must maintain an error state"
      );
      assert.ok(
        cadAiModalSource.includes("setError(") &&
          cadAiModalSource.includes("Gagal menghasilkan rancangan insole AI dari server.") &&
          cadAiModalSource.includes("Failed to generate AI insole design from server."),
        "CadAiModal must set error when json.success is false or data is missing"
      );
    });

    it("verifies AI modal error card mirrors the library error card with role=alert and AlertTriangle", () => {
      assert.ok(
        cadAiModalSource.includes('role="alert"') &&
          cadAiModalSource.includes("border-red-900/60") &&
          cadAiModalSource.includes("bg-red-950/30") &&
          cadAiModalSource.includes("text-red-300"),
        "Error card must have role=alert and match the library card's red styling"
      );
      assert.ok(
        cadAiModalSource.includes("<AlertTriangle className="),
        "Error card must render the AlertTriangle icon"
      );
    });

    it("verifies AI modal error card provides an accessible 44px Retry button", () => {
      assert.ok(
        cadAiModalSource.includes("min-h-[44px]") &&
          cadAiModalSource.includes('isId ? "Coba Lagi" : "Retry"'),
        "Retry button must meet 44px touch target guidelines and support bilingual labels"
      );
      assert.ok(
        cadAiModalSource.includes("setError(null);") &&
          cadAiModalSource.includes("handleGenerate();"),
        "Retry button must clear error and re-trigger generation"
      );
    });
  });

  describe("P1: Sizing-System Switch Migrates rawSizeValue & Clamps to Target Slider Bounds", () => {
    it("verifies CadStudio imports SIZING_BOUNDS and migrateSizingValue", () => {
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS") &&
          cadStudioSource.includes("migrateSizingValue"),
        "CadStudio must import SIZING_BOUNDS and migrateSizingValue from insoleEngine"
      );
    });

    it("verifies clicking sizing buttons migrates rawSizeValue or customLengthMm", () => {
      assert.ok(
        cadStudioSource.includes("migrateSizingValue(sizingSystem, sys, currentVal)"),
        "CadStudio must call migrateSizingValue with current sizing system, target system, and current value"
      );
      assert.ok(
        cadStudioSource.includes("setCustomLengthMm(nextVal)") &&
          cadStudioSource.includes("setRawSizeValue(nextVal)"),
        "CadStudio must set customLengthMm when switching to CUSTOM_MM, or rawSizeValue otherwise"
      );
    });

    it("verifies slider and custom input use SIZING_BOUNDS for min, max, and step", () => {
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.min") &&
          cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.max") &&
          cadStudioSource.includes("SIZING_BOUNDS[sizingSystem]?.step"),
        "Slider range input must bind min, max, and step from SIZING_BOUNDS"
      );
      assert.ok(
        cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.min") &&
          cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.max") &&
          cadStudioSource.includes("SIZING_BOUNDS.CUSTOM_MM.step"),
        "Custom length input must bind min, max, and step from SIZING_BOUNDS.CUSTOM_MM"
      );
    });
  });

  describe("Clarify & Integrity: Truthful 'Keep editing' and Toast Timer Re-fire Clearing", () => {
    it("verifies overwrite confirm dialog cancel button uses truthful 'Keep editing' rather than deceptive 'Cancel, Save First'", () => {
      // Must not contain "Cancel, Save First"
      assert.strictEqual(
        cadStudioSource.includes("Cancel, Save First"),
        false,
        "CadStudio must not promise 'Cancel, Save First' since it does not save"
      );
      // Must contain "Keep editing" / "Lanjut Mengedit"
      assert.ok(
        cadStudioSource.includes('isId ? "Lanjut Mengedit" : "Keep editing"'),
        "CadStudio overwrite cancel button must read 'Keep editing' (or 'Lanjut Mengedit')"
      );
    });

    it("verifies toast timer is tracked with ref and cleared on re-fire and unmount in CadStudio", () => {
      assert.ok(
        cadStudioSource.includes("const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);"),
        "CadStudio must track toast timeout in a ref"
      );
      assert.ok(
        cadStudioSource.includes("if (toastTimeoutRef.current) {") &&
          cadStudioSource.includes("clearTimeout(toastTimeoutRef.current);"),
        "CadStudio must clear existing timer on showToast re-fire"
      );
    });

    it("verifies toast timer is tracked with ref and cleared on re-fire and unmount in InventoryDashboard", () => {
      const inventoryPath = path.resolve(process.cwd(), "src/components/inventory/InventoryDashboard.tsx");
      const inventorySource = fs.readFileSync(inventoryPath, "utf-8");

      assert.ok(
        inventorySource.includes("const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);"),
        "InventoryDashboard must track toast timeout in a ref"
      );
      assert.ok(
        inventorySource.includes("if (toastTimeoutRef.current) {") &&
          inventorySource.includes("clearTimeout(toastTimeoutRef.current);"),
        "InventoryDashboard must clear existing timer on showToast re-fire"
      );
    });
  });

  describe("Full Critique Heuristics: Global Escape, Sam's A11y & Layer Color Separation", () => {
    it("verifies global window Escape handling closes modals in CadStudio and CadAiModal", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");
      const freshCadAiModal = fs.readFileSync(cadAiModalPath, "utf-8");

      assert.ok(
        freshCadStudio.includes('if (e.key === "Escape")') &&
          freshCadStudio.includes("setPendingOverwriteAction(null)") &&
          freshCadStudio.includes("setIsCncPreFlightOpen(false)") &&
          freshCadStudio.includes("setIsLibraryOpen(false)") &&
          freshCadStudio.includes("setIsAiModalOpen(false)"),
        "CadStudio window keydown listener must handle Escape to close any open modal"
      );

      assert.ok(
        freshCadAiModal.includes('if (e.key === "Escape")') &&
          freshCadAiModal.includes("onClose()"),
        "CadAiModal window keydown listener must handle Escape"
      );
    });

    it("verifies Sam's a11y: distinct load button aria-labels, role=img on SVG, role=status on HUD", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      // Load model button aria-label includes blueprint name
      assert.ok(
        freshCadStudio.includes('aria-label={isId ? `Muat blueprint ${bp.name}` : `Load blueprint ${bp.name}`}'),
        "Load Model buttons must have distinct aria-label naming the blueprint"
      );

      // SVG role and aria-label
      assert.ok(
        freshCadStudio.includes('role="img"') &&
          freshCadStudio.includes('aria-label={isId ? `Pratinjau vektor CAD insole ${geometry.sizingLabel} ${foot}` : `CAD insole vector preview ${geometry.sizingLabel} ${foot}`}'),
        "Main CAD canvas SVG must have role=img and descriptive aria-label"
      );

      // HUD role=status aria-live=polite
      assert.ok(
        freshCadStudio.includes('role="status"') &&
          freshCadStudio.includes('aria-live="polite"'),
        "Live dimension HUD strip must be announced to screen readers as a live region"
      );
    });

    it("verifies laterality buttons use brand active color without colliding with layer colors (blue/emerald)", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      assert.ok(
        freshCadStudio.includes('foot === "LEFT"\n                    ? "bg-brand text-white border-brand shadow-xs"') ||
          freshCadStudio.includes('foot === "LEFT" ? "bg-brand text-white border-brand shadow-xs"'),
        "Foot laterality buttons must use brand active color rather than layer-owned blue"
      );
      assert.ok(
        freshCadStudio.includes('foot === "PAIR"\n                    ? "bg-brand text-white border-brand shadow-xs"') ||
          freshCadStudio.includes('foot === "PAIR" ? "bg-brand text-white border-brand shadow-xs"'),
        "Foot laterality buttons must use brand active color rather than layer-owned emerald"
      );
    });
  });

  describe("Rubric Improvements: True mm SVG Grid, Cursor Coordinates, Shortcuts, Cancel/Timeout & Anatomical Tooltips", () => {
    it("verifies CadAiModal includes 25s timeout, AbortController, and visible Cancel button", () => {
      const freshCadAiModal = fs.readFileSync(cadAiModalPath, "utf-8");

      assert.ok(
        freshCadAiModal.includes("const abortControllerRef = useRef<AbortController | null>(null);") &&
          freshCadAiModal.includes("const timeoutRef = useRef<NodeJS.Timeout | null>(null);"),
        "CadAiModal must maintain refs for abort controller and timeout"
      );
      assert.ok(
        freshCadAiModal.includes("setTimeout(() => {") &&
          freshCadAiModal.includes('controller.abort("TIMEOUT")') &&
          freshCadAiModal.includes("25000"),
        "CadAiModal must set 25-second auto-abort timeout"
      );
      assert.ok(
        freshCadAiModal.includes("handleCancel") &&
          freshCadAiModal.includes('isId ? "Batal" : "Cancel"'),
        "CadAiModal must provide a visible Cancel button while generating"
      );
    });

    it("verifies CadStudio renders true mm SVG grid pattern and eliminates static CSS grid", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      assert.ok(
        freshCadStudio.includes('pattern id="cad-grid-10mm"') &&
          freshCadStudio.includes('pattern id="cad-grid-50mm"'),
        "CadStudio must define true millimeter patterns (10mm minor, 50mm major) inside SVG defs"
      );
      assert.ok(
        freshCadStudio.includes('fill="url(#cad-grid-50mm)"'),
        "CadStudio must fill grid rect with the millimeter pattern"
      );
      assert.strictEqual(
        freshCadStudio.includes('backgroundSize: "20px 20px"'),
        false,
        "CadStudio must not rely on static 20px CSS background grid that does not scale with CAD"
      );
    });

    it("verifies CadStudio tracks live cursor mm coordinates and displays them in HUD", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      assert.ok(
        freshCadStudio.includes("setCursorMm") &&
          freshCadStudio.includes("matrixTransform") &&
          freshCadStudio.includes("getScreenCTM()"),
        "CadStudio must convert pointer events to exact SVG millimeter coordinates via getScreenCTM"
      );
      assert.ok(
        freshCadStudio.includes("cursorMm.x") &&
          freshCadStudio.includes("cursorMm.y"),
        "CadStudio must display cursor X/Y millimeter coordinates in the live HUD strip"
      );
    });

    it("verifies CadStudio supports arrow key panning and keyboard shortcuts legend dialog", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      assert.ok(
        freshCadStudio.includes('e.key === "ArrowLeft"') &&
          freshCadStudio.includes('e.key === "ArrowRight"') &&
          freshCadStudio.includes('e.key === "ArrowUp"') &&
          freshCadStudio.includes('e.key === "ArrowDown"'),
        "CadStudio must support arrow key viewport panning"
      );
      assert.ok(
        freshCadStudio.includes("isShortcutsOpen") &&
          freshCadStudio.includes("cad-shortcuts-title") &&
          freshCadStudio.includes("Pintasan Keyboard CAD"),
        "CadStudio must provide a dedicated keyboard shortcuts legend dialog"
      );
    });

    it("verifies clinical-grade anatomical tooltips for Heel Cup, Metatarsal Pad, and Caliper measurements", () => {
      const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

      // Heel cup tooltip
      assert.ok(
        freshCadStudio.includes('activeTooltip === "heel"') &&
          freshCadStudio.includes("calcaneal fat pad"),
        "CadStudio must provide an anatomical tooltip for the heel cup (calcaneal fat pad)"
      );

      // Metatarsal dome tooltip
      assert.ok(
        freshCadStudio.includes('activeTooltip === "metatarsal"') &&
          freshCadStudio.includes("metatarsalgia"),
        "CadStudio must provide an anatomical tooltip for the metatarsal pad (metatarsalgia relief)"
      );

      // Caliper measurement tooltip
      assert.ok(
        freshCadStudio.includes('activeTooltip === "caliper"') &&
          freshCadStudio.includes("skala 1:1"),
        "CadStudio must provide an informative tooltip for 1:1 caliper measurements"
      );
    });
  });

  describe("Impeccable Sequence: Harden, Adapt, Clarify & Ride-Along Deliverables", () => {
    const freshCadStudio = fs.readFileSync(cadStudioPath, "utf-8");

    it("1. Harden: provides inline 'Manual — auto-recompute off' chip with 1-click re-enable", () => {
      assert.ok(
        freshCadStudio.includes("Manual — auto-recompute off") &&
          freshCadStudio.includes("Manual — auto-recompute mati"),
        "Caliper header must display explicit 'Manual — auto-recompute off/mati' indicator"
      );
      assert.ok(
        freshCadStudio.includes("setManualWidths(false)") &&
          freshCadStudio.includes("calculateDefaultWidths("),
        "Clicking the manual chip must re-enable auto-calculation and apply default widths"
      );
    });

    it("1. Harden: traps focus in Overwrite and Shortcuts dialogs with trapModalTab", () => {
      assert.ok(
        freshCadStudio.includes("trapModalTab(e, cancelOverwriteRef, confirmOverwriteRef)"),
        "Overwrite dialog must trap tab navigation between cancel and confirm buttons"
      );
      assert.ok(
        freshCadStudio.includes("trapModalTab(e, shortcutsCloseRef, shortcutsGotItRef)"),
        "Shortcuts dialog must trap tab navigation between close and got-it buttons"
      );
      assert.ok(
        freshCadStudio.includes("firstRef.current === lastRef.current") &&
          freshCadStudio.includes("focusables.length > 1"),
        "trapModalTab must dynamically resolve focusable boundaries when first and last refs match (preventing lock in library modal)"
      );
      assert.ok(
        freshCadStudio.includes("ref={confirmOverwriteRef}") &&
          freshCadStudio.includes("ref={shortcutsGotItRef}"),
        "Dialog buttons must attach the respective ref elements for focus trapping"
      );
    });

    it("1. Harden (cont): prevents tab leak in CadAiModal when few focusable elements exist", () => {
      assert.ok(
        cadAiModalSource.includes("focusables.length < 2") &&
          cadAiModalSource.includes("e.preventDefault()"),
        "CadAiModal must prevent default when focusables < 2 to prevent focus leak"
      );
    });

    it("2. Harden (cont): renders persistent inline save and export error cards with retry and dismiss", () => {
      assert.ok(
        freshCadStudio.includes("saveError &&") &&
          freshCadStudio.includes('onClick={handleSaveBlueprint}') &&
          freshCadStudio.includes("setSaveError(null)"),
        "CadStudio must render persistent inline save failure alert with Retry and dismiss buttons"
      );
      assert.ok(
        freshCadStudio.includes("exportError &&") &&
          freshCadStudio.includes("setExportError(null)"),
        "CNC pre-flight modal must render persistent inline export failure alert with dismiss button"
      );
    });

    it("3. Adapt: supports wheel zoom toward cursor and pinch-to-zoom multi-touch tracking", () => {
      assert.ok(
        freshCadStudio.includes("onWheel={handleWheel}") &&
          freshCadStudio.includes("handleWheel = (e: React.WheelEvent<HTMLDivElement>)"),
        "CAD viewport div must attach onWheel handler for cursor-centered zooming"
      );
      assert.ok(
        freshCadStudio.includes("activePointersRef.current.size === 2") &&
          freshCadStudio.includes("Math.hypot"),
        "CAD viewport must track two active pointers to compute real pinch-to-zoom distance"
      );
    });

    it("4. Clarify: validates numeric caliper inputs with onBlur clamping and inline range hints", () => {
      // Range hints present
      assert.ok(freshCadStudio.includes("70–130 mm"), "Ball width must render 70-130 mm range hint");
      assert.ok(freshCadStudio.includes("45–95 mm"), "Heel width must render 45-95 mm range hint");
      assert.ok(freshCadStudio.includes("0.75–1.45x"), "Arch factor must render 0.75-1.45x range hint");
      assert.ok(freshCadStudio.includes("0.75–1.35x"), "Arch plate length must render 0.75-1.35x range hint");
      assert.ok(freshCadStudio.includes("0.70–1.30x"), "Arch plate width must render 0.70-1.30x range hint");

      // Blur clamp handlers
      assert.ok(freshCadStudio.includes("Math.max(70, Math.min(130,"), "Ball width must clamp to 70-130 mm on blur");
      assert.ok(freshCadStudio.includes("Math.max(45, Math.min(95,"), "Heel width must clamp to 45-95 mm on blur");
      assert.ok(freshCadStudio.includes("Math.max(0.75, Math.min(1.45,"), "Arch factor must clamp to 0.75-1.45 on blur");
    });

    it("4. Clarify: shortcuts legend includes Shift-fine-pan row and pre-flight export buttons meet 44px touch targets", () => {
      assert.ok(
        freshCadStudio.includes("Shift + ← ↑ → ↓") &&
          freshCadStudio.includes("Fine Pan Viewport"),
        "Shortcuts legend must explain Shift + Arrow keys fine panning"
      );
      assert.ok(
        freshCadStudio.includes('className="px-4 py-2 min-h-[44px] rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 transition active:scale-95"') &&
          freshCadStudio.includes('min-h-[44px] rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 active:scale-95 transition'),
        "Pre-flight SVG and DXF export buttons must have min-h-[44px]"
      );
    });

    it("5. Ride-along cleanups: toast z-index set to z-50 and yield estimate has nesting caveat", () => {
      assert.ok(
        freshCadStudio.includes("z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white border border-gray-700"),
        "Toast notification container must use z-50 to stay beneath modals"
      );
      assert.ok(
        freshCadStudio.includes("Estimasi teoritis bounding-box") &&
          freshCadStudio.includes("Theoretical bounding-box estimate"),
        "EVA Sheet Yield estimate must feature bilingual nesting loss caveat text"
      );
    });
  });
});


