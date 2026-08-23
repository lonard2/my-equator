import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { hashPassword, generateSalt, logAuditEvent, ensureDemoUsersSeeded } from "@/lib/auth/authService";
import { assertPermission, extractRequesterRole } from "@/lib/auth/rbac";
import crypto from "crypto";

export async function GET() {
  try {
    await ensureDemoUsersSeeded();
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, data: allUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = assertPermission(req.headers, "SYSTEM_USER_MANAGEMENT");
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Akses ditolak: Hanya Super Admin yang berwenang menambah dan mengelola peran pengguna." },
        { status: 403 }
      );
    }

    const requester = extractRequesterRole(req.headers);
    const body = await req.json();
    const { username, name, email, password, role } = body;

    if (!username || !name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const id = `usr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      username: username.trim().toLowerCase(),
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      role: role || "SALES_OPERATOR",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent({
      userId: "ADMIN",
      userName: "Administrator",
      action: "USER_CREATE",
      entityType: "AUTH",
      entityId: id,
      details: `Membuat akun baru ${name} (@${username}) dengan peran ${role}.`,
    });

    return NextResponse.json({ success: true, data: { id, username, name, email, role } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
