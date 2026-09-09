import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateInsoleLength,
  calculateDefaultWidths,
  buildInsoleGeometry,
  convertSizing,
  SIZING_BOUNDS,
  migrateSizingValue,
  INSOLE_PRESETS,
  InsoleParameters,
} from "@/lib/cad/insoleEngine";

describe("Insole CAD Engine & Geometric Calculations", () => {
  it("calculates standard European Paris point length formula", () => {
    // EU 36: (36 * 6.6667 - 6.6667) = 233.3 mm
    const len36 = calculateInsoleLength(36);
    assert.strictEqual(len36, 233.3);

    // EU 40: (40 * 6.6667 - 6.6667) = 260.0 mm
    const len40 = calculateInsoleLength(40);
    assert.strictEqual(len40, 260);

    // EU 45: (45 * 6.6667 - 6.6667) = 293.3 mm
    const len45 = calculateInsoleLength(45);
    assert.strictEqual(len45, 293.3);
  });

  it("converts sizing accurately across international sizing systems", () => {
    const eu41 = convertSizing("EU", 41);
    assert.strictEqual(eu41.eu, 41);
    assert.strictEqual(eu41.uk, 7.5);
    assert.strictEqual(eu41.usMen, 8);
    assert.strictEqual(eu41.usWomen, 9.5);
  });

  it("migrates raw size value accurately across systems preserving sane insole length", () => {
    // EU 41 -> UK: 7.5
    const ukVal = migrateSizingValue("EU", "UK", 41);
    assert.strictEqual(ukVal, 7.5);

    // Converted length check: UK 7.5 -> insole length should match EU 41 length (266.7 mm)
    const ukConv = convertSizing("UK", ukVal);
    assert.strictEqual(ukConv.eu, 41);
    assert.strictEqual(ukConv.insoleLengthMm, 266.7);

    // EU 41 -> US Men: 8
    const usMenVal = migrateSizingValue("EU", "US_MEN", 41);
    assert.strictEqual(usMenVal, 8);
    assert.strictEqual(convertSizing("US_MEN", usMenVal).insoleLengthMm, 266.7);

    // US Men 8 -> US Women: 9.5
    const usWomenVal = migrateSizingValue("US_MEN", "US_WOMEN", 8);
    assert.strictEqual(usWomenVal, 9.5);

    // US Women 9.5 -> UK: 7.5
    assert.strictEqual(migrateSizingValue("US_WOMEN", "UK", 9.5), 7.5);

    // EU 41 -> Mondopoint cm
    const mondoVal = migrateSizingValue("EU", "MONDOPOINT_CM", 41);
    assert.strictEqual(mondoVal, 25.5);

    // Custom MM 260 -> EU 40
    assert.strictEqual(migrateSizingValue("CUSTOM_MM", "EU", 260), 40);

    // Identity migration
    assert.strictEqual(migrateSizingValue("EU", "EU", 41), 41);
    assert.strictEqual(migrateSizingValue("UK", "UK", 8.5), 8.5);
  });

  it("clamps migrated size values within target slider bounds", () => {
    // EU 35 (minimum EU) -> UK conversion is 1.5, which is below UK minimum of 4
    const clampedUkMin = migrateSizingValue("EU", "UK", 35);
    assert.strictEqual(clampedUkMin, SIZING_BOUNDS.UK.min);
    assert.strictEqual(clampedUkMin, 4);

    // EU 48 (maximum EU) -> UK conversion is 14.5, which is above UK maximum of 14
    const clampedUkMax = migrateSizingValue("EU", "UK", 48);
    assert.strictEqual(clampedUkMax, SIZING_BOUNDS.UK.max);
    assert.strictEqual(clampedUkMax, 14);

    // Custom MM 150mm (below minimum) -> CUSTOM_MM clamped to 180
    assert.strictEqual(migrateSizingValue("EU", "CUSTOM_MM", 20), SIZING_BOUNDS.CUSTOM_MM.min);
  });

  it("computes anatomical width proportions for ball, heel, and waist", () => {
    const length = 260.0; // EU 40
    const widths = calculateDefaultWidths(length);

    // Ball width ~ 36.5% of length
    assert.strictEqual(widths.ballWidth, Math.round(length * 0.365 * 10) / 10);
    // Heel width ~ 25.5% of length
    assert.strictEqual(widths.heelWidth, Math.round(length * 0.255 * 10) / 10);
    // Waist width ~ 22.5% of length
    assert.strictEqual(widths.waistWidth, Math.round(length * 0.225 * 10) / 10);
  });

  it("builds complete parametric geometry with valid point sets and closed SVG paths for right and left foot", () => {
    const params: InsoleParameters = {
      shoeSize: 41,
      baseLengthMm: calculateInsoleLength(41),
      ballWidthMm: 96,
      heelWidthMm: 69,
      waistWidthMm: 58,
      archProfile: "MEDIUM",
      archOffsetFactor: 1.0,
      toeShape: "ROUNDED",
      thicknessForefootMm: 3.0,
      thicknessHeelMm: 5.0,
      materialType: "EVA High Density",
      archPlateLengthFactor: 1.0,
      archPlateWidthFactor: 1.0,
      archPlateLateralWing: true,
      heelCupDepthProfile: "MEDIUM",
      heelCupRadiusFactor: 1.0,
      metatarsalPadSizeFactor: 1.0,
      metatarsalPadYPosition: 0.65,
    };

    const geometry = buildInsoleGeometry(params);

    assert.ok(geometry.outlinePointsRight.length > 20, "Should produce smooth right polyline outline");
    assert.ok(geometry.outlinePointsLeft.length > 20, "Should produce smooth left polyline outline");
    assert.ok(geometry.archPlatePointsRight.length > 5, "Should produce TPU arch support polyline");
    assert.ok(geometry.heelCupPointsRight.length > 5, "Should produce heel cup polyline");
    assert.ok(geometry.metatarsalPadPointsRight.length > 5, "Should produce metatarsal cushion dome polyline");

    assert.ok(geometry.svgPathRight.startsWith("M"), "Right SVG path must begin with Move command");
    assert.ok(geometry.svgPathRight.endsWith("Z"), "Right SVG path must close with Z command");
    assert.ok(geometry.svgPathLeft.startsWith("M"), "Left SVG path must begin with Move command");
    assert.ok(geometry.svgPathLeft.endsWith("Z"), "Left SVG path must close with Z command");

    assert.notStrictEqual(geometry.svgPathRight, geometry.svgPathLeft, "Left and right SVG paths must be mirrored");
  });

  it("contains standard factory insole presets", () => {
    assert.ok(INSOLE_PRESETS.length >= 4, "Must contain at least 4 factory presets");
    const presetNames = INSOLE_PRESETS.map((p) => p.name);
    assert.ok(presetNames.some((n) => n.toLowerCase().includes("comfort") || n.toLowerCase().includes("memory")), "Should have Comfort preset");
    assert.ok(presetNames.some((n) => n.toLowerCase().includes("sport") || n.toLowerCase().includes("performance")), "Should have Sport preset");
    assert.ok(presetNames.some((n) => n.toLowerCase().includes("ortho") || n.toLowerCase().includes("flatfoot")), "Should have Ortho preset");
  });
});
