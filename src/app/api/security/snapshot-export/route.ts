import { NextResponse } from "next/server";
import { exportDatabaseSnapshot } from "@/services/backupService";
import { assertPermission } from "@/lib/auth/rbac";

export async function GET(req: Request) {
  try {
    const auth = assertPermission(req.headers, "SYSTEM_SNAPSHOT_BACKUP");
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Akses ditolak: Hanya Super Admin dan Manajer Pabrik yang berwenang mengekspor cadangan basis data." },
        { status: 403 }
      );
    }

    const snapshot = await exportDatabaseSnapshot();
    const filename = `Equator_DB_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Snapshot export error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
