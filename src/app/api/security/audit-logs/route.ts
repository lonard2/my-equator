import { NextResponse } from "next/server";
import { getRecentAuditLogs } from "@/lib/auth/authService";

export async function GET(req: Request) {
  try {
    const logs = await getRecentAuditLogs(100);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
