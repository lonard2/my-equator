# Technical & Engineering Guide: Phase 5 — Security (RBAC), Mobile Experience & Offline Resilience

## 1. Module Overview & Industrial Role

Phase 5 hardens the MyEquator factory platform with **Cryptographic Authentication**, **4-Tier Role-Based Access Control (RBAC)**, **Audit Logging**, **Mobile Hamburger Drawer & Responsive Ergonomics**, **Crash-Proof SQLite Architecture via `@libsql/client`**, and **1-Click Offline JSON Snapshot Backup & Restore**.

---

## 2. Cryptographic Security & RBAC Architecture (`src/lib/auth/`)

### 2.1 Role-Based Access Control (RBAC) Matrix
```
+-------------------+----------------+-----------------+-----------------+----------------+
| Permission / Area | SUPER_ADMIN    | FACTORY_MANAGER | WAREHOUSE_STAFF | SALES_OPERATOR |
+-------------------+----------------+-----------------+-----------------+----------------+
| Surat Jalan CRUD  | Full (All)     | Full (All)      | View + Dispatch | Create Draft   |
| Quick Digitizer   | Full Access    | Full Access     | Full Access     | Full Access    |
| Stock IN / OUT    | Full Access    | Full Access     | Full Access     | View Only      |
| Insole CAD Studio | Full Access    | Full Access     | View / Export   | View Only      |
| Financial Revenue | Full Access    | Full Access     | Restricted      | Restricted     |
| User Admin & Logs | Full Access    | Restricted      | Restricted      | Restricted     |
| Offline Backup    | Full Access    | Restricted      | Restricted      | Restricted     |
+-------------------+----------------+-----------------+-----------------+----------------+
```

### 2.2 Salted PBKDF2 Password Hashing (`authService.ts`)
```typescript
import crypto from "crypto";

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  // 10,000 PBKDF2 iterations using SHA-512 with 64-byte key length
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}
```

### 2.3 Dual Username & Email Authentication Query
Allows factory employees to authenticate using either their official email or simplified operator username:

```typescript
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
```

---

## 3. Mobile UI Ergonomics & Clean Header Architecture

### 3.1 Mobile Hamburger Drawer Navigation (`src/components/common/Header.tsx`)
On screens under 768px (`md:hidden`), top-bar menu clutter is condensed into an animated slide-down navigation drawer:
- Active User Profile Card with Role Badge.
- Direct Navigation Links to all 6 Modules.
- Global Search Shortcut (`⌘K`).
- Live Language (`ID`/`EN`) and Theme (`Dark`/`Light`) toggles.
- Secure Logout Button (`handleLogout`).

### 3.2 Mobile CAD Viewport Optimization (`src/components/design-studio/CadStudio.tsx`)
Resolves viewport clipping and hidden action bars on mobile devices with a 4-tier bottom navigation switcher:
- `CANVAS`: Dedicated interactive vector pan/zoom viewport.
- `PARAMETERS`: Sizing standard and curve dimensions.
- `ORTHOTICS`: Layer visibility and orthotic plate sliders.
- `EXPORT`: Generative AI CAD prompt modal and DXF/SVG downloads.

---

## 4. SQLite Stability & Next.js V8 Crash Elimination (`src/lib/db/index.ts`)

### 4.1 The V8 Native Assertion Bug
In Next.js development server mode, native C++ Node addons like `better-sqlite3` attach `node::AddEnvironmentCleanupHook` on prepared statement creation. When V8 garbage collects statements during route reloads, destructors assert `(env) != nullptr` and crash the server.

### 4.2 Crash-Proof Migration to `@libsql/client` + `drizzle-orm/libsql`
By migrating to `@libsql/client`, the database runs on pure JavaScript and WebAssembly engines without native C++ cleanup hooks:

```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = path.join(process.cwd(), "data", "myequator.db");

const client =
  globalThis._libsqlClient ||
  createClient({
    url: `file:${dbPath}`,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._libsqlClient = client;
}

export const db = globalThis._db || drizzle(client, { schema });
```

---

## 5. Offline JSON Snapshot Backup & Restore Pipeline (`src/services/backupService.ts`)

### 5.1 JSON Snapshot Structure
```json
{
  "metadata": {
    "system": "MyEquator",
    "schemaVersion": "1.0.0",
    "exportedAt": "2026-08-16T13:00:00.000Z",
    "company": "Equator Insole Bandung",
    "totalRecords": 348
  },
  "data": {
    "users": [...],
    "materials": [...],
    "inventoryMovements": [...],
    "deliveryOrders": [...],
    "deliveryOrderItems": [...],
    "insoleBlueprints": [...],
    "auditLogs": [...]
  }
}
```

### 5.2 Atomic Relational Restoration Order
During restoration, the system truncates child tables first to respect foreign key constraints, and repopulates parent tables before dependent children inside an atomic database transaction:
1. `delivery_order_items` ➔ `delivery_orders`
2. `inventory_movements` ➔ `materials`
3. `insole_blueprints`, `users`, `audit_logs`

---

## 6. How to Build & Test Phase 5

1. **Test User Authentication & Security:**
   - Log in with default Super Admin credentials: `superadmin` / `equator2026!`.
   - Create a new factory user in the Security Dashboard.
   - Verify login with both Username and Email address.
2. **Test 1-Click Database Snapshot Export & Restore:**
   - Click **"Ekspor Backup JSON"** in the Security Dashboard.
   - Verify the downloaded JSON bundle contains metadata and all table records.
3. **Verify Production Build:**
   ```bash
   npm run build
   ```
