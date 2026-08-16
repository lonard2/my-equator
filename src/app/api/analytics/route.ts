import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/services/analyticsService";

export async function GET() {
  try {
    const data = await getAnalyticsSummary();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
