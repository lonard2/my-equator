import { db } from "@/lib/db";
import { insoleBlueprints } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  buildInsoleGeometry,
  INSOLE_PRESETS,
  InsoleParameters,
  calculateInsoleLength,
  calculateDefaultWidths,
} from "@/lib/cad/insoleEngine";

export interface BlueprintRecord {
  id: string;
  name: string;
  shoeSize: number;
  baseLengthMm: number;
  ballWidthMm: number;
  heelWidthMm: number;
  waistWidthMm: number;
  archProfile: "FLAT" | "MEDIUM" | "HIGH";
  archOffsetFactor: number;
  thicknessForefootMm: number;
  thicknessHeelMm: number;
  materialType: string;
  svgPath?: string | null;
  createdAt: string;
}

export class CadService {
  /**
   * List all saved CAD blueprints, auto-seeding defaults if empty
   */
  static async getAllBlueprints(): Promise<BlueprintRecord[]> {
    const records = await db.select().from(insoleBlueprints).orderBy(desc(insoleBlueprints.createdAt));
    if (records.length === 0) {
      await this.seedDefaultBlueprints();
      return db.select().from(insoleBlueprints).orderBy(desc(insoleBlueprints.createdAt));
    }
    return records as BlueprintRecord[];
  }

  static async getBlueprintById(id: string): Promise<BlueprintRecord | null> {
    const records = await db.select().from(insoleBlueprints).where(eq(insoleBlueprints.id, id)).limit(1);
    return (records[0] as BlueprintRecord) || null;
  }

  static async saveBlueprint(params: {
    name: string;
    shoeSize: number;
    baseLengthMm?: number;
    ballWidthMm?: number;
    heelWidthMm?: number;
    waistWidthMm?: number;
    archProfile: "FLAT" | "MEDIUM" | "HIGH";
    archOffsetFactor?: number;
    thicknessForefootMm?: number;
    thicknessHeelMm?: number;
    materialType?: string;
  }): Promise<BlueprintRecord> {
    const size = params.shoeSize || 40;
    const length = params.baseLengthMm || calculateInsoleLength(size);
    const defaults = calculateDefaultWidths(length);

    const geo = buildInsoleGeometry({
      shoeSize: size,
      baseLengthMm: length,
      ballWidthMm: params.ballWidthMm || defaults.ballWidth,
      heelWidthMm: params.heelWidthMm || defaults.heelWidth,
      waistWidthMm: params.waistWidthMm || defaults.waistWidth,
      archProfile: params.archProfile,
      archOffsetFactor: params.archOffsetFactor || 1.0,
    });

    const newId = `CAD-${Date.now()}`;
    const newRecord: BlueprintRecord = {
      id: newId,
      name: params.name || `Insole Profile EU ${size}`,
      shoeSize: size,
      baseLengthMm: length,
      ballWidthMm: params.ballWidthMm || defaults.ballWidth,
      heelWidthMm: params.heelWidthMm || defaults.heelWidth,
      waistWidthMm: params.waistWidthMm || defaults.waistWidth,
      archProfile: params.archProfile || "MEDIUM",
      archOffsetFactor: params.archOffsetFactor || 1.0,
      thicknessForefootMm: params.thicknessForefootMm || 3.0,
      thicknessHeelMm: params.thicknessHeelMm || 5.0,
      materialType: params.materialType || "High Density EVA",
      svgPath: geo.svgPathRight,
      createdAt: new Date().toISOString(),
    };

    await db.insert(insoleBlueprints).values(newRecord);
    return newRecord;
  }

  static async deleteBlueprint(id: string): Promise<boolean> {
    await db.delete(insoleBlueprints).where(eq(insoleBlueprints.id, id));
    return true;
  }

  static async seedDefaultBlueprints(): Promise<void> {
    const size = 41;
    const length = calculateInsoleLength(size);
    const defaults = calculateDefaultWidths(length);

    for (const preset of INSOLE_PRESETS) {
      const geo = buildInsoleGeometry({
        shoeSize: size,
        baseLengthMm: length,
        ballWidthMm: defaults.ballWidth,
        heelWidthMm: defaults.heelWidth,
        waistWidthMm: defaults.waistWidth,
        archProfile: preset.archProfile,
        archOffsetFactor: preset.archOffsetFactor,
        toeShape: preset.toeShape,
      });

      await db.insert(insoleBlueprints).values({
        id: `PRESET-${preset.id}`,
        name: preset.name,
        shoeSize: size,
        baseLengthMm: length,
        ballWidthMm: defaults.ballWidth,
        heelWidthMm: defaults.heelWidth,
        waistWidthMm: defaults.waistWidth,
        archProfile: preset.archProfile,
        archOffsetFactor: preset.archOffsetFactor,
        thicknessForefootMm: preset.thicknessForefootMm,
        thicknessHeelMm: preset.thicknessHeelMm,
        materialType: preset.materialType,
        svgPath: geo.svgPathRight,
        createdAt: new Date().toISOString(),
      });
    }
  }
}
