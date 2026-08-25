import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateInsoleBom, INSOLE_BOM_PRESETS } from "@/lib/inventory/bom";
import { MaterialItem } from "@/types";

describe("Insole Bill of Materials (BOM) Calculation Engine", () => {
  const mockMaterials: MaterialItem[] = [
    {
      id: "mat-eva-1",
      sku: "RAW-EVA-4MM-BLK",
      name: "EVA Foam Sheet 4mm High-Density",
      category: "EVA_SHEET",
      unit: "Lembar",
      currentStock: 100,
      safetyThreshold: 20,
      unitCost: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-latex-1",
      sku: "RAW-LATEX-3MM",
      name: "Natural Latex 3mm Cushion Roll",
      category: "LATEX",
      unit: "Roll",
      currentStock: 2, // Low stock
      safetyThreshold: 5,
      unitCost: 600000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-fabric-1",
      sku: "RAW-BK-MESH-BLK",
      name: "BK Mesh Anti-Bacterial Fabric",
      category: "FABRIC",
      unit: "Meter",
      currentStock: 200,
      safetyThreshold: 30,
      unitCost: 30000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mat-tpu-1",
      sku: "RAW-TPU-SHANK-75",
      name: "Plat TPU Arch Shank 75mm",
      category: "TPU_SHANK",
      unit: "Pcs",
      currentStock: 5000,
      safetyThreshold: 500,
      unitCost: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("calculates accurate raw material consumption for 1,000 pairs of EQ-SPORT-01", () => {
    const result = calculateInsoleBom("EQ-SPORT-01", 1000, mockMaterials);

    assert.strictEqual(result.preset.articleCode, "EQ-SPORT-01");
    assert.strictEqual(result.targetPairs, 1000);

    // EVA: 5.0 sheets per 100 pairs * 10 = 50 sheets required
    const evaReq = result.requirements.find((r) => r.materialCategory === "EVA_SHEET");
    assert.ok(evaReq);
    assert.strictEqual(evaReq.requiredQuantity, 50);
    assert.strictEqual(evaReq.currentStock, 100);
    assert.strictEqual(evaReq.isSufficient, true);
    assert.strictEqual(evaReq.deficit, 0);

    // Latex: 0.3 roll per 100 pairs * 10 = 3 rolls required (currentStock is 2, deficit is 1)
    const latexReq = result.requirements.find((r) => r.materialCategory === "LATEX");
    assert.ok(latexReq);
    assert.strictEqual(latexReq.requiredQuantity, 3);
    assert.strictEqual(latexReq.currentStock, 2);
    assert.strictEqual(latexReq.isSufficient, false);
    assert.strictEqual(latexReq.deficit, 1);

    // TPU Shank: 200 pcs per 100 pairs * 10 = 2000 pcs required (currentStock 5000)
    const tpuReq = result.requirements.find((r) => r.materialCategory === "TPU_SHANK");
    assert.ok(tpuReq);
    assert.strictEqual(tpuReq.requiredQuantity, 2000);
    assert.strictEqual(tpuReq.isSufficient, true);

    // Overall sufficiency should be false due to latex shortage
    assert.strictEqual(result.allSufficient, false);
    assert.ok(result.totalEstimatedCostIDR > 0);
    assert.ok(result.costPerPairIDR > 0);
  });

  it("handles scaled volumes and fallback presets correctly", () => {
    const result = calculateInsoleBom("UNKNOWN-MODEL", 200, mockMaterials);
    // Defaults to first preset
    assert.strictEqual(result.targetPairs, 200);
    assert.ok(result.requirements.length > 0);
  });
});
