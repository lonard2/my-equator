import { NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";

export async function GET() {
  try {
    const summary = await InventoryService.getInventorySummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch inventory summary" }, { status: 500 });
  }
}
