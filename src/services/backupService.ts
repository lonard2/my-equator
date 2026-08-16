import { db } from "@/lib/db";
import {
  deliveryOrders,
  deliveryOrderItems,
  materials,
  inventoryMovements,
  insoleBlueprints,
  users,
  auditLogs,
} from "@/lib/db/schema";
import { logAuditEvent } from "@/lib/auth/authService";

export interface DatabaseSnapshot {
  metadata: {
    system: "MyEquator";
    schemaVersion: "1.0.0";
    exportedAt: string;
    company: "Equator Insole Bandung";
    totalRecords: number;
  };
  data: {
    deliveryOrders: any[];
    deliveryOrderItems: any[];
    materials: any[];
    inventoryMovements: any[];
    insoleBlueprints: any[];
    users: any[];
    auditLogs: any[];
  };
}

export async function exportDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  const [
    orders,
    orderItems,
    allMaterials,
    movements,
    blueprints,
    allUsers,
    logs,
  ] = await Promise.all([
    db.select().from(deliveryOrders),
    db.select().from(deliveryOrderItems),
    db.select().from(materials),
    db.select().from(inventoryMovements),
    db.select().from(insoleBlueprints),
    db.select().from(users),
    db.select().from(auditLogs),
  ]);

  const totalRecords =
    orders.length +
    orderItems.length +
    allMaterials.length +
    movements.length +
    blueprints.length +
    allUsers.length +
    logs.length;

  const snapshot: DatabaseSnapshot = {
    metadata: {
      system: "MyEquator",
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      company: "Equator Insole Bandung",
      totalRecords,
    },
    data: {
      deliveryOrders: orders,
      deliveryOrderItems: orderItems,
      materials: allMaterials,
      inventoryMovements: movements,
      insoleBlueprints: blueprints,
      users: allUsers,
      auditLogs: logs,
    },
  };

  // Log Audit Event
  await logAuditEvent({
    userId: "SYSTEM",
    userName: "Administrator",
    userRole: "SUPER_ADMIN",
    action: "SNAPSHOT_EXPORT",
    entityType: "SYSTEM",
    entityId: "backup",
    details: `Exported offline database snapshot with ${totalRecords} records.`,
  });

  return snapshot;
}

export async function restoreDatabaseSnapshot(snapshot: DatabaseSnapshot): Promise<{ success: boolean; restoredCount: number }> {
  if (!snapshot || !snapshot.metadata || snapshot.metadata.system !== "MyEquator") {
    throw new Error("Invalid snapshot file: Not a valid MyEquator backup bundle.");
  }

  const { data } = snapshot;

  // Clear existing records & repopulate in order of relational dependencies
  await db.transaction(async (tx) => {
    // Delete children first
    await tx.delete(deliveryOrderItems);
    await tx.delete(deliveryOrders);
    await tx.delete(inventoryMovements);
    await tx.delete(materials);
    await tx.delete(insoleBlueprints);
    await tx.delete(users);
    await tx.delete(auditLogs);

    // Insert restored data
    if (data.users?.length) {
      for (const u of data.users) {
        await tx.insert(users).values(u);
      }
    }

    if (data.materials?.length) {
      for (const m of data.materials) {
        await tx.insert(materials).values(m);
      }
    }

    if (data.inventoryMovements?.length) {
      for (const im of data.inventoryMovements) {
        await tx.insert(inventoryMovements).values(im);
      }
    }

    if (data.deliveryOrders?.length) {
      for (const o of data.deliveryOrders) {
        await tx.insert(deliveryOrders).values(o);
      }
    }

    if (data.deliveryOrderItems?.length) {
      for (const it of data.deliveryOrderItems) {
        await tx.insert(deliveryOrderItems).values(it);
      }
    }

    if (data.insoleBlueprints?.length) {
      for (const bp of data.insoleBlueprints) {
        await tx.insert(insoleBlueprints).values(bp);
      }
    }

    if (data.auditLogs?.length) {
      for (const log of data.auditLogs) {
        await tx.insert(auditLogs).values(log);
      }
    }
  });

  // Log Restore Audit Event
  await logAuditEvent({
    userId: "SYSTEM",
    userName: "Administrator",
    userRole: "SUPER_ADMIN",
    action: "SNAPSHOT_RESTORE",
    entityType: "SYSTEM",
    entityId: "restore",
    details: `Restored database snapshot (${snapshot.metadata.totalRecords} records from ${snapshot.metadata.exportedAt}).`,
  });

  return { success: true, restoredCount: snapshot.metadata.totalRecords };
}
