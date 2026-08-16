import { NextResponse } from "next/server";
import { ensureDemoUsersSeeded, FACTORY_DEMO_ACCOUNTS, logAuditEvent } from "@/lib/auth/authService";

export async function GET() {
  try {
    await ensureDemoUsersSeeded();
    const demoRoster = FACTORY_DEMO_ACCOUNTS.map((acc) => ({
      id: acc.id,
      username: acc.username,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      avatarUrl: acc.avatarUrl,
    }));

    return NextResponse.json({ success: true, data: demoRoster });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
