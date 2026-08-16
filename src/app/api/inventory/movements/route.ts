import { NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId") || undefined;
    const movements = await InventoryService.getMovements(materialId);
    return NextResponse.json({ success: true, data: movements });
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch movements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.materialId || !body.type || !body.quantity || !body.operatorName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (materialId, type, quantity, operatorName)" },
        { status: 400 }
      );
    }
    const result = await InventoryService.recordMovement(body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error recording inventory movement:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record movement" },
      { status: 500 }
    );
  }
}
