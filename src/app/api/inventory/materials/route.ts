import { NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";

export async function GET() {
  try {
    const materialsList = await InventoryService.getAllMaterials();
    return NextResponse.json({ success: true, data: materialsList });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.sku || !body.name || !body.category || !body.unit) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (sku, name, category, unit)" },
        { status: 400 }
      );
    }
    const material = await InventoryService.createMaterial(body);
    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create material" },
      { status: 500 }
    );
  }
}
