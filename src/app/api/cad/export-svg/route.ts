import { NextResponse } from "next/server";
import { buildInsoleGeometry, generateSvgDocument, FootType } from "@/lib/cad/insoleEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const foot: FootType = body.foot || "RIGHT";
    const geometry = buildInsoleGeometry(body);
    const svgContent = generateSvgDocument(geometry, foot);

    const filename = `Equator_Insole_EU${geometry.size}_${foot}_${Date.now()}.svg`;

    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Failed to export SVG:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
