# Phase 5 Walkthrough — Factory Security, RBAC & Offline JSON Resiliency

## 1. Module Overview

Phase 5 delivers enterprise-grade access control, immutable security audit logging, and 1-click zero-configuration offline database backup and restore for the `MyEquator` manufacturing platform.

```
+-----------------------------------------------------------------------------------+
|                     Phase 5: Security, RBAC & Offline Resiliency                  |
+-----------------------------------------------------------------------------------+
|  1. 4-Tier Factory RBAC Matrix    |  2. Salted PBKDF2 Password Authentication    |
|     - Super Admin (Full Access)   |     - 10,000 iterations SHA-512 key derive    |
|     - Factory / Production Manager|     - Pre-seeded factory demo accounts        |
|     - Warehouse / Inventory Staff |     - Instant 1-click user & role switching   |
|     - Sales & Front Desk Operator |                                               |
+-----------------------------------+-----------------------------------------------+
|  3. Factory Security Audit Trail  |  4. 1-Click Offline Database Snapshot (.json) |
|     - Chronological mutation log  |     - Full multi-table relational export      |
|     - Searchable action timeline  |     - Schema version-checked atomic restore   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Role-Based Access Control (RBAC) Matrix

| Module / Operation | Super Admin | Factory Manager | Warehouse Staff | Sales Operator |
| :--- | :---: | :---: | :---: | :---: |
| **Delivery Orders (View / Search)** | Yes | Yes | Yes | Yes |
| **Delivery Orders (Create / Edit)** | Yes | Yes | No | Yes |
| **Delivery Orders (Dispatch / Status)** | Yes | Yes | Yes | No |
| **Dot-Matrix Printing (ESC/P)** | Yes | Yes | Yes | Yes |
| **Materials Inventory (View)** | Yes | Yes | Yes | Yes |
| **Stock IN/OUT Mutations** | Yes | Yes | Yes | No |
| **Insole CAD Studio (Design & DXF)** | Yes | Yes | No | View / Export |
| **Save CAD Blueprints to Catalog** | Yes | Yes | No | No |
| **Financial Revenue & AOV KPIs** | Yes | Yes | No | No |
| **Export Offline JSON Snapshot** | Yes | Yes | No | No |
| **Restore Database Snapshot** | Yes | No | No | No |
| **User & Role Administration** | Yes | No | No | No |

---

## 3. Offline Snapshot Schema & Restore Protocol

The offline snapshot is formatted as an encapsulated JSON payload with metadata and relational table data:

```json
{
  "metadata": {
    "system": "MyEquator",
    "schemaVersion": "1.0.0",
    "exportedAt": "2026-08-16T12:00:00.000Z",
    "company": "Equator Insole Bandung",
    "totalRecords": 142
  },
  "data": {
    "deliveryOrders": [...],
    "deliveryOrderItems": [...],
    "materials": [...],
    "inventoryMovements": [...],
    "insoleBlueprints": [...],
    "users": [...],
    "auditLogs": [...]
  }
}
```

### Atomic Restore Transaction Workflow:
1. Validates that `metadata.system === "MyEquator"` and `schemaVersion` is compatible.
2. Initiates atomic SQLite transaction `db.transaction()`.
3. Truncates dependent child tables first (`deliveryOrderItems`, `inventoryMovements`) followed by parent tables (`deliveryOrders`, `materials`, `users`, `insoleBlueprints`, `auditLogs`).
4. Repopulates records in foreign key dependency order.
5. Injects a persistent `SNAPSHOT_RESTORE` audit log entry with restored count and timestamp.

---

## 4. Directory & File Manifest

| File Path | Description |
| :--- | :--- |
| [`src/lib/auth/rbac.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/auth/rbac.ts) | Role definitions, permission matrix, and `hasPermission` authorization helper. |
| [`src/lib/auth/authService.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/lib/auth/authService.ts) | Salted PBKDF2 password hashing, demo user accounts, login authentication, and audit logger. |
| [`src/services/backupService.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/services/backupService.ts) | Full multi-table database snapshot exporter and atomic transactional restore engine. |
| [`src/components/security/SecurityDashboard.tsx`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/components/security/SecurityDashboard.tsx) | Security dashboard with live permissions checklist, role switcher, snapshot triggers, and audit trail table. |
| [`src/app/api/auth/login/route.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/app/api/auth/login/route.ts) | Authentication login endpoint. |
| [`src/app/api/security/snapshot-export/route.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/app/api/security/snapshot-export/route.ts) | Generates and streams JSON snapshot file. |
| [`src/app/api/security/snapshot-restore/route.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/app/api/security/snapshot-restore/route.ts) | Transactional snapshot restore endpoint. |
| [`src/app/api/security/audit-logs/route.ts`](file:///Users/lonard/Desktop/MyEquator-seconditer/src/app/api/security/audit-logs/route.ts) | Security audit trail log query endpoint. |
