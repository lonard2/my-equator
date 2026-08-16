import { NextResponse } from "next/server";
import { CadService } from "@/services/cadService";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blueprint = await CadService.getBlueprintById(id);
    if (!blueprint) {
      return NextResponse.json({ success: false, error: "Blueprint not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: blueprint });
  } catch (error: any) {
    console.error("Failed to get CAD blueprint:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CadService.deleteBlueprint(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete CAD blueprint:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
