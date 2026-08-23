import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildInsoleGeometry, generateDxfR12Stream, InsoleParameters, calculateInsoleLength } from "@/lib/cad/insoleEngine";

describe("Insole CAD AutoCAD R12 DXF Binary Stream Exporter", () => {
  it("generates complete R12 DXF file with polyline vertices and standard layers", () => {
    const params: InsoleParameters = {
      shoeSize: 42,
      baseLengthMm: calculateInsoleLength(42),
      ballWidthMm: 98,
      heelWidthMm: 70,
      waistWidthMm: 59,
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
    const dxfString = generateDxfR12Stream(geometry, "RIGHT");

    assert.ok(dxfString.includes("SECTION"), "DXF must contain SECTION headers");
    assert.ok(dxfString.includes("HEADER"), "DXF must contain HEADER section");
    assert.ok(dxfString.includes("ENTITIES"), "DXF must contain ENTITIES section");
    assert.ok(dxfString.includes("CUT_OUTLINE"), "DXF must contain CUT_OUTLINE layer");
    assert.ok(dxfString.includes("ARCH_SUPPORT"), "DXF must contain ARCH_SUPPORT layer");
    assert.ok(dxfString.includes("HEEL_CUP"), "DXF must contain HEEL_CUP layer");
    assert.ok(dxfString.includes("METATARSAL"), "DXF must contain METATARSAL layer");
    assert.ok(dxfString.includes("POLYLINE"), "DXF must contain POLYLINE entities");
    assert.ok(dxfString.includes("VERTEX"), "DXF must contain VERTEX entities");
    assert.ok(dxfString.endsWith("0\nEOF\n") || dxfString.endsWith("0\r\nEOF\r\n"), "DXF must terminate with 0 EOF");
  });
});
