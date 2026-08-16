import { NextResponse } from "next/server";
import { InventoryService } from "@/services/inventoryService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await InventoryService.getMaterialById(id);
    if (!material) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch material" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await InventoryService.updateMaterial(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json({ success: false, error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await InventoryService.deleteMaterial(id);
    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ success: false, error: "Failed to delete material" }, { status: 500 });
  }
}
