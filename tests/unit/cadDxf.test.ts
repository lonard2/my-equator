import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildInsoleGeometry,
  generateDxfR12Stream,
  generateDxfContent,
  generatePairDxfContent,
  generateSvgDocument,
  generatePairSvgDocument,
  InsoleParameters,
  calculateInsoleLength,
} from "@/lib/cad/insoleEngine";

describe("Insole CAD AutoCAD R12 DXF Binary Stream Exporter", () => {
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

  it("generates complete R12 DXF file with polyline vertices and standard layers", () => {
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

  it("filters DXF layers based on LayerVisibilityOptions in single foot view", () => {
    const geometry = buildInsoleGeometry(params);

    // Filter out ARCH_SUPPORT and HEEL_CUP
    const dxfFiltered = generateDxfContent(geometry, "RIGHT", {
      showOutline: true,
      showArchPlate: false,
      showHeelCup: false,
      showMetatarsal: true,
    });

    assert.ok(dxfFiltered.includes("CUT_OUTLINE"), "Must include CUT_OUTLINE");
    assert.ok(dxfFiltered.includes("METATARSAL"), "Must include METATARSAL");
    assert.ok(!dxfFiltered.includes("ARCH_SUPPORT"), "Must NOT include ARCH_SUPPORT when disabled");
    assert.ok(!dxfFiltered.includes("HEEL_CUP"), "Must NOT include HEEL_CUP when disabled");

    // Filter out CUT_OUTLINE as well
    const dxfNoOutline = generateDxfContent(geometry, "LEFT", {
      showOutline: false,
      showArchPlate: true,
    });
    assert.ok(!dxfNoOutline.includes("CUT_OUTLINE"), "Must NOT include CUT_OUTLINE when disabled");
    assert.ok(dxfNoOutline.includes("ARCH_SUPPORT"), "Must include ARCH_SUPPORT when enabled");
  });

  it("filters DXF layers based on LayerVisibilityOptions in pair view", () => {
    const geometry = buildInsoleGeometry(params);

    const pairDxf = generatePairDxfContent(geometry, {
      showOutline: true,
      showArchPlate: true,
      showHeelCup: false,
      showMetatarsal: false,
    });

    assert.ok(pairDxf.includes("CUT_OUTLINE"), "Pair DXF must include CUT_OUTLINE");
    assert.ok(pairDxf.includes("ARCH_SUPPORT"), "Pair DXF must include ARCH_SUPPORT");
    assert.ok(!pairDxf.includes("HEEL_CUP"), "Pair DXF must NOT include HEEL_CUP when disabled");
    assert.ok(!pairDxf.includes("METATARSAL"), "Pair DXF must NOT include METATARSAL when disabled");
  });

  it("filters SVG layers based on LayerVisibilityOptions in single and pair view", () => {
    const geometry = buildInsoleGeometry(params);

    // Single foot SVG with metatarsal only
    const svgFiltered = generateSvgDocument(geometry, "RIGHT", {
      showOutline: false,
      showArchPlate: false,
      showHeelCup: false,
      showMetatarsal: true,
    });

    assert.ok(svgFiltered.includes(geometry.metatarsalSvgRight), "Must contain metatarsal path");
    assert.ok(!svgFiltered.includes(geometry.svgPathRight), "Must NOT contain outline path");
    assert.ok(!svgFiltered.includes(geometry.archPlateSvgRight), "Must NOT contain arch plate path");

    // Pair SVG with outline and heel cup only
    const pairSvgFiltered = generatePairSvgDocument(geometry, {
      showOutline: true,
      showArchPlate: false,
      showHeelCup: true,
      showMetatarsal: false,
    });

    assert.ok(pairSvgFiltered.includes(geometry.svgPathLeft), "Must contain left outline path");
    assert.ok(pairSvgFiltered.includes(geometry.svgPathRight), "Must contain right outline path");
    assert.ok(pairSvgFiltered.includes(geometry.heelCupSvgLeft), "Must contain heel cup left path");
    assert.ok(pairSvgFiltered.includes(geometry.heelCupSvgRight), "Must contain heel cup right path");
    assert.ok(!pairSvgFiltered.includes(geometry.archPlateSvgLeft), "Must NOT contain arch plate left path");
    assert.ok(!pairSvgFiltered.includes(geometry.metatarsalSvgRight), "Must NOT contain metatarsal path");
  });
});
