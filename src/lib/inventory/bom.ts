// Insole Bill of Materials (BOM) Calculation Engine — Equator Insole
import { MaterialItem, MaterialCategory } from "@/types";

export interface BomMaterialRequirement {
  materialCategory: MaterialCategory;
  materialNamePattern: string; // SKU or Name matcher
  requiredQuantity: number;
  unit: string;
  matchedMaterial?: MaterialItem;
  currentStock: number;
  isSufficient: boolean;
  deficit: number;
  estimatedCost: number;
}

export interface InsoleBomPreset {
  articleCode: string;
  articleName: string;
  description: string;
  requirementsPer100Pairs: Array<{
    category: MaterialCategory;
    namePattern: string;
    quantityPer100Pairs: number;
    unit: string;
    notes: string;
  }>;
}

export const INSOLE_BOM_PRESETS: InsoleBomPreset[] = [
  {
    articleCode: "EQ-SPORT-01",
    articleName: "Insole Dynamic Running Sport (Dual-Density EVA + Latex + TPU)",
    description: "Insole olahraga lari dengan bantalan tumit latex dan plat penopang arch TPU.",
    requirementsPer100Pairs: [
      {
        category: "EVA_SHEET",
        namePattern: "EVA",
        quantityPer100Pairs: 5.0, // ~20 pairs per 1.2x2.4m sheet
        unit: "Lembar",
        notes: "Lembaran EVA 4mm High-Density (Hasil cutting nest ~20 psg/lembar)",
      },
      {
        category: "LATEX",
        namePattern: "Latex",
        quantityPer100Pairs: 0.3, // ~330 pairs per 50m roll
        unit: "Roll",
        notes: "Latex High-Rebound 3mm untuk bantalan forefoot & heel",
      },
      {
        category: "FABRIC",
        namePattern: "BK Mesh",
        quantityPer100Pairs: 14.0,
        unit: "Meter",
        notes: "Kain BK Mesh breathable anti-bakteri",
      },
      {
        category: "TPU_SHANK",
        namePattern: "Shank",
        quantityPer100Pairs: 200, // 2 pcs per pair
        unit: "Pcs",
        notes: "Plat shank penstabil arch kaki 75mm (2 pcs per pasang)",
      },
    ],
  },
  {
    articleCode: "EQ-ARCH-01",
    articleName: "Insole Orthotic Arch Support (High-Density EVA 8mm + TPU Rigid)",
    description: "Insole orthotik medis untuk koreksi flat foot dan plantar fasciitis.",
    requirementsPer100Pairs: [
      {
        category: "EVA_SHEET",
        namePattern: "EVA",
        quantityPer100Pairs: 6.5, // ~15 pairs per sheet due to deep heel cup
        unit: "Lembar",
        notes: "Lembaran EVA 8mm High-Density 55° Shore C",
      },
      {
        category: "FABRIC",
        namePattern: "Cambrelle",
        quantityPer100Pairs: 15.0,
        unit: "Meter",
        notes: "Kain Cambrelle Velvet anti-slip",
      },
      {
        category: "TPU_SHANK",
        namePattern: "Shank",
        quantityPer100Pairs: 200,
        unit: "Pcs",
        notes: "Plat TPU Rigid Arch Torsion Bar 85mm",
      },
    ],
  },
  {
    articleCode: "EQ-CASUAL-02",
    articleName: "Insole Daily Comfort Cushion (EVA Soft 3mm + Fabric)",
    description: "Insole kenyamanan harian untuk sepatu casual, sneakers & kerja.",
    requirementsPer100Pairs: [
      {
        category: "EVA_SHEET",
        namePattern: "EVA",
        quantityPer100Pairs: 4.8, // ~21 pairs per sheet
        unit: "Lembar",
        notes: "Lembaran EVA 3mm Soft 30° Shore C",
      },
      {
        category: "FABRIC",
        namePattern: "Mesh",
        quantityPer100Pairs: 14.0,
        unit: "Meter",
        notes: "Kain laminasi Cotton Mesh",
      },
    ],
  },
];

/**
 * Calculates raw material requirements for a given insole production target
 */
export function calculateInsoleBom(
  articleCode: string,
  targetPairs: number,
  availableMaterials: MaterialItem[]
): {
  preset: InsoleBomPreset;
  targetPairs: number;
  totalEstimatedCostIDR: number;
  costPerPairIDR: number;
  allSufficient: boolean;
  requirements: BomMaterialRequirement[];
} {
  const preset =
    INSOLE_BOM_PRESETS.find((p) => p.articleCode === articleCode) || INSOLE_BOM_PRESETS[0];

  const scale = targetPairs / 100;
  let totalCost = 0;
  let allSufficient = true;

  const requirements: BomMaterialRequirement[] = preset.requirementsPer100Pairs.map((req) => {
    const totalQty = Math.round(req.quantityPer100Pairs * scale * 10) / 10;

    // Find best matching material in inventory
    const matched = availableMaterials.find(
      (m) =>
        m.category === req.category &&
        (m.name.toLowerCase().includes(req.namePattern.toLowerCase()) ||
          m.sku.toLowerCase().includes(req.namePattern.toLowerCase()))
    ) || availableMaterials.find((m) => m.category === req.category);

    const currentStock = matched ? matched.currentStock : 0;
    const unitCost = matched ? matched.unitCost : 0;
    const isSufficient = currentStock >= totalQty;
    const deficit = isSufficient ? 0 : Math.round((totalQty - currentStock) * 10) / 10;
    const estimatedCost = totalQty * unitCost;

    if (!isSufficient) allSufficient = false;
    totalCost += estimatedCost;

    return {
      materialCategory: req.category,
      materialNamePattern: req.namePattern,
      requiredQuantity: totalQty,
      unit: req.unit,
      matchedMaterial: matched,
      currentStock,
      isSufficient,
      deficit,
      estimatedCost,
    };
  });

  return {
    preset,
    targetPairs,
    totalEstimatedCostIDR: totalCost,
    costPerPairIDR: targetPairs > 0 ? Math.round(totalCost / targetPairs) : 0,
    allSufficient,
    requirements,
  };
}
