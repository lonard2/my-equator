import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateSalt, logAuditEvent } from "@/lib/auth/authService";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, role, isActive, password } = body;

    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updatedAt: now,
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    if (password) {
      const salt = generateSalt();
      updateData.salt = salt;
      updateData.passwordHash = hashPassword(password, salt);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    await logAuditEvent({
      userId: "ADMIN",
      userName: "Administrator",
      action: "USER_UPDATE",
      entityType: "AUTH",
      entityId: id,
      details: `Memperbarui akun ${existing.name} (@${existing.username}).`,
    });

    return NextResponse.json({ success: true, data: { id, ...updateData } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan." }, { status: 404 });
    }

    if (existing.username === "superadmin") {
      return NextResponse.json(
        { success: false, error: "Akun Super Admin utama tidak dapat dihapus." },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, id));

    await logAuditEvent({
      userId: "ADMIN",
      userName: "Administrator",
      action: "USER_DELETE",
      entityType: "AUTH",
      entityId: id,
      details: `Menghapus akun ${existing.name} (@${existing.username}).`,
    });

    return NextResponse.json({ success: true, message: "User berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
