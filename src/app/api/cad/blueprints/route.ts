import { NextResponse } from "next/server";
import { CadService } from "@/services/cadService";

export async function GET() {
  try {
    const blueprints = await CadService.getAllBlueprints();
    return NextResponse.json({ success: true, data: blueprints });
  } catch (error: any) {
    console.error("Failed to list CAD blueprints:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await CadService.saveBlueprint(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Failed to save CAD blueprint:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
