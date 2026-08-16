import { NextResponse } from "next/server";
import { restoreDatabaseSnapshot } from "@/services/backupService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await restoreDatabaseSnapshot(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Snapshot restore error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}
