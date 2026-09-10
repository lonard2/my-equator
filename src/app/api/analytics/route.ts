import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/services/analyticsService";

export async function GET(request: NextRequest) {
  try {
    const periodParam = request.nextUrl.searchParams.get("period");
    const period = (periodParam === "30D" || periodParam === "Q" || periodParam === "YTD" || periodParam === "ALL")
      ? periodParam
      : "ALL";
    const customer = request.nextUrl.searchParams.get("customer") || undefined;
    const data = await getAnalyticsSummary(period, customer);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
