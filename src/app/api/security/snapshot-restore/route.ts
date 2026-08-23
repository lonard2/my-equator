import { NextResponse } from "next/server";
import { restoreDatabaseSnapshot } from "@/services/backupService";
import { assertPermission } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  try {
    const auth = assertPermission(req.headers, "SYSTEM_SNAPSHOT_RESTORE");
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Akses ditolak: Hanya Super Admin yang berwenang melakukan restorasi basis data." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await restoreDatabaseSnapshot(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Snapshot restore error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}
