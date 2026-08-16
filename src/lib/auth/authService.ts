import crypto from "crypto";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { UserRole } from "@/types";
import { FactoryUser, FACTORY_DEMO_ACCOUNTS } from "@/lib/auth/types";
export { FACTORY_DEMO_ACCOUNTS };
export type { FactoryUser };

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function ensureDemoUsersSeeded(): Promise<void> {
  const existing = await db.select().from(users);
  if (existing.length >= FACTORY_DEMO_ACCOUNTS.length) return;

  const now = new Date().toISOString();

  for (const acc of FACTORY_DEMO_ACCOUNTS) {
    const found = existing.find((u) => u.username === acc.username || u.email === acc.email);
    if (!found) {
      const salt = generateSalt();
      const hash = hashPassword(acc.plainPassword, salt);
      await db.insert(users).values({
        id: acc.id,
        username: acc.username,
        name: acc.name,
        email: acc.email,
        passwordHash: hash,
        salt,
        role: acc.role,
        avatarUrl: acc.avatarUrl,
        isActive: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function authenticateUser(identifier: string, plainPassword: string): Promise<FactoryUser | null> {
  await ensureDemoUsersSeeded();

  const normalized = identifier.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, normalized), eq(users.email, normalized)));
  if (!user || user.isActive !== 1) return null;

  const computedHash = hashPassword(plainPassword, user.salt);
  if (computedHash !== user.passwordHash) return null;

  const now = new Date().toISOString();
  await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id));

  // Log to Audit Trail
  await logAuditEvent({
    userId: user.id,
    userName: user.name,
    userRole: user.role as UserRole,
    action: "USER_LOGIN",
    entityType: "AUTH",
    entityId: user.id,
    details: `Pengguna ${user.name} (${user.role}) berhasil masuk ke sistem.`,
  });

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    lastLoginAt: now,
  };
}

export async function logAuditEvent(params: {
  userId: string;
  userName: string;
  userRole?: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}): Promise<void> {
  try {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(auditLogs).values({
      id,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole || "SALES_OPERATOR",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export async function getRecentAuditLogs(limit: number = 50) {
  return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
}
