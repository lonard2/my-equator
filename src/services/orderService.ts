import { db } from "@/lib/db";
import { deliveryOrders, deliveryOrderItems, auditLogs } from "@/lib/db/schema";
import { DeliveryOrder, DeliveryOrderItem, DeliveryOrderStatus, SizeBreakdown } from "@/types";
import { eq, desc, like } from "drizzle-orm";
import crypto from "crypto";

export {
  VALID_STATUS_TRANSITIONS,
  STATUS_ROLLBACK_TARGETS,
  canTransitionStatus,
  getAvailableStatusRollbacks,
} from "@/lib/orders/status";
import { STATUS_ROLLBACK_TARGETS } from "@/lib/orders/status";

export function computeItemTotals(
  sizes: Record<number | string, number | undefined | null> | SizeBreakdown | undefined,
  unitPrice: number = 0
): { totalPairs: number; totalPrice: number } {
  if (!sizes || typeof sizes !== "object") {
    return { totalPairs: 0, totalPrice: 0 };
  }

  let totalPairs = 0;
  for (const key of Object.keys(sizes)) {
    const val = Number((sizes as Record<string, any>)[key]);
    if (!isNaN(val) && val > 0) {
      totalPairs += Math.floor(val);
    }
  }

  const cleanPrice = Math.max(0, isNaN(unitPrice) ? 0 : unitPrice);
  const totalPrice = totalPairs * cleanPrice;

  return { totalPairs, totalPrice };
}

export class OrderService {
  /**
   * Generates the next standard Surat Jalan number: SJ/EQ/YYYY/MM/XXXX
   */
  static async generateNextOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `SJ/EQ/${year}/${month}/`;

    const latest = await db
      .select({ orderNumber: deliveryOrders.orderNumber })
      .from(deliveryOrders)
      .where(like(deliveryOrders.orderNumber, `${prefix}%`))
      .orderBy(desc(deliveryOrders.orderNumber))
      .limit(1);

    let nextSequence = 1;
    if (latest.length > 0) {
      const parts = latest[0].orderNumber.split("/");
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSequence).padStart(4, "0")}`;
  }

  /**
   * Retrieves all delivery orders with their line items
   */
  static async getAllOrders(): Promise<DeliveryOrder[]> {
    const orders = await db.select().from(deliveryOrders).orderBy(desc(deliveryOrders.createdAt));
    const items = await db.select().from(deliveryOrderItems);

    const itemsByOrder: Record<string, DeliveryOrderItem[]> = {};
    items.forEach((item) => {
      if (!itemsByOrder[item.deliveryOrderId]) {
        itemsByOrder[item.deliveryOrderId] = [];
      }
      let parsedSizes: SizeBreakdown = {};
      try {
        parsedSizes = JSON.parse(item.sizeBreakdown);
      } catch (e) {
        parsedSizes = {};
      }

      itemsByOrder[item.deliveryOrderId].push({
        id: item.id,
        deliveryOrderId: item.deliveryOrderId,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || undefined,
        sizes: parsedSizes,
        totalPairs: item.totalPairs,
        unitPrice: item.unitPrice ?? undefined,
        totalPrice: item.totalPrice ?? undefined,
        notes: item.notes || undefined,
        createdAt: item.createdAt,
      });
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      recipientName: order.recipientName,
      destinationAddress: order.destinationAddress,
      poNumber: order.poNumber || undefined,
      vehicleNumber: order.vehicleNumber || undefined,
      driverName: order.driverName || undefined,
      deliveryDate: order.deliveryDate,
      notes: order.notes || undefined,
      status: order.status as DeliveryOrderStatus,
      items: itemsByOrder[order.id] || [],
      totalQuantity: order.totalQuantity,
      totalAmount: order.totalAmount ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }

  /**
   * Retrieves a single delivery order by ID with line items
   */
  static async getOrderById(id: string): Promise<DeliveryOrder | null> {
    const [order] = await db.select().from(deliveryOrders).where(eq(deliveryOrders.id, id)).limit(1);
    if (!order) return null;

    const items = await db
      .select()
      .from(deliveryOrderItems)
      .where(eq(deliveryOrderItems.deliveryOrderId, id));

    const formattedItems: DeliveryOrderItem[] = items.map((item) => {
      let parsedSizes: SizeBreakdown = {};
      try {
        parsedSizes = JSON.parse(item.sizeBreakdown);
      } catch (e) {
        parsedSizes = {};
      }

      return {
        id: item.id,
        deliveryOrderId: item.deliveryOrderId,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || undefined,
        sizes: parsedSizes,
        totalPairs: item.totalPairs,
        unitPrice: item.unitPrice ?? undefined,
        totalPrice: item.totalPrice ?? undefined,
        notes: item.notes || undefined,
        createdAt: item.createdAt,
      };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      recipientName: order.recipientName,
      destinationAddress: order.destinationAddress,
      poNumber: order.poNumber || undefined,
      vehicleNumber: order.vehicleNumber || undefined,
      driverName: order.driverName || undefined,
      deliveryDate: order.deliveryDate,
      notes: order.notes || undefined,
      status: order.status as DeliveryOrderStatus,
      items: formattedItems,
      totalQuantity: order.totalQuantity,
      totalAmount: order.totalAmount ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Creates a new delivery order with line items
   */
  static async createOrder(data: {
    orderNumber?: string;
    recipientName: string;
    destinationAddress: string;
    poNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    deliveryDate?: string;
    notes?: string;
    status?: DeliveryOrderStatus;
    items: Array<{
      articleCode: string;
      articleName: string;
      colorway?: string;
      sizes: SizeBreakdown;
      unitPrice?: number;
      notes?: string;
    }>;
  }): Promise<DeliveryOrder> {
    const id = `do-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const orderNumber = data.orderNumber || (await this.generateNextOrderNumber());
    const now = new Date().toISOString();
    const deliveryDate = data.deliveryDate || now.split("T")[0];

    let grandTotalPairs = 0;
    let grandTotalAmount = 0;

    const itemRows = data.items.map((item) => {
      const itemTotals = computeItemTotals(item.sizes, item.unitPrice || 0);
      grandTotalPairs += itemTotals.totalPairs;
      grandTotalAmount += itemTotals.totalPrice;

      return {
        id: `item-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        deliveryOrderId: id,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || null,
        sizeBreakdown: JSON.stringify(item.sizes),
        totalPairs: itemTotals.totalPairs,
        unitPrice: item.unitPrice || 0,
        totalPrice: itemTotals.totalPrice,
        notes: item.notes || null,
        createdAt: now,
      };
    });

    await db.insert(deliveryOrders).values({
      id,
      orderNumber,
      recipientName: data.recipientName,
      destinationAddress: data.destinationAddress,
      poNumber: data.poNumber || null,
      vehicleNumber: data.vehicleNumber || null,
      driverName: data.driverName || null,
      deliveryDate,
      notes: data.notes || null,
      status: data.status || "DRAFT",
      totalQuantity: grandTotalPairs,
      totalAmount: grandTotalAmount,
      createdAt: now,
      updatedAt: now,
    });

    if (itemRows.length > 0) {
      await db.insert(deliveryOrderItems).values(itemRows);
    }

    const created = await this.getOrderById(id);
    if (!created) throw new Error("Failed to retrieve created order");
    return created;
  }

  /**
   * Updates an existing delivery order and replaces its items
   */
  static async updateOrder(
    id: string,
    data: {
      recipientName?: string;
      destinationAddress?: string;
      poNumber?: string;
      vehicleNumber?: string;
      driverName?: string;
      deliveryDate?: string;
      notes?: string;
      status?: DeliveryOrderStatus;
      items?: Array<{
        id?: string;
        articleCode: string;
        articleName: string;
        colorway?: string;
        sizes: SizeBreakdown;
        unitPrice?: number;
        notes?: string;
      }>;
    }
  ): Promise<DeliveryOrder | null> {
    const existing = await this.getOrderById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    let grandTotalPairs = existing.totalQuantity;
    let grandTotalAmount = existing.totalAmount || 0;

    if (data.items) {
      await db.delete(deliveryOrderItems).where(eq(deliveryOrderItems.deliveryOrderId, id));

      grandTotalPairs = 0;
      grandTotalAmount = 0;

      const newRows = data.items.map((item) => {
        const itemTotals = computeItemTotals(item.sizes, item.unitPrice || 0);
        grandTotalPairs += itemTotals.totalPairs;
        grandTotalAmount += itemTotals.totalPrice;

        return {
          id: item.id || `item-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          deliveryOrderId: id,
          articleCode: item.articleCode,
          articleName: item.articleName,
          colorway: item.colorway || null,
          sizeBreakdown: JSON.stringify(item.sizes),
          totalPairs: itemTotals.totalPairs,
          unitPrice: item.unitPrice || 0,
          totalPrice: itemTotals.totalPrice,
          notes: item.notes || null,
          createdAt: now,
        };
      });

      if (newRows.length > 0) {
        await db.insert(deliveryOrderItems).values(newRows);
      }
    }

    await db
      .update(deliveryOrders)
      .set({
        recipientName: data.recipientName !== undefined ? data.recipientName : existing.recipientName,
        destinationAddress: data.destinationAddress !== undefined ? data.destinationAddress : existing.destinationAddress,
        poNumber: data.poNumber !== undefined ? data.poNumber : existing.poNumber,
        vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : existing.vehicleNumber,
        driverName: data.driverName !== undefined ? data.driverName : existing.driverName,
        deliveryDate: data.deliveryDate !== undefined ? data.deliveryDate : existing.deliveryDate,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        status: data.status !== undefined ? data.status : existing.status,
        totalQuantity: grandTotalPairs,
        totalAmount: grandTotalAmount,
        updatedAt: now,
      })
      .where(eq(deliveryOrders.id, id));

    return this.getOrderById(id);
  }

  /**
   * Updates delivery order status with optional rollback reason and audit trail
   */
  static async updateOrderStatus(
    id: string,
    status: DeliveryOrderStatus,
    reason?: string,
    actor?: { userId: string; userName: string; role?: string; userRole?: string }
  ): Promise<DeliveryOrder | null> {
    const existing = await this.getOrderById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    await db
      .update(deliveryOrders)
      .set({ status, updatedAt: now })
      .where(eq(deliveryOrders.id, id));

    if (actor) {
      const isRollback = STATUS_ROLLBACK_TARGETS[existing.status]?.includes(status);
      const isCancel = status === "CANCELLED";
      const actionType = isCancel ? "DO_CANCEL" : isRollback ? "DO_STATUS_ROLLBACK" : "DO_STATUS_UPDATE";
      const effectiveRole = actor.userRole || actor.role || "SUPER_ADMIN";

      const details = reason
        ? `Ubah status DO ${existing.orderNumber} dari ${existing.status} ➔ ${status}. Alasan: ${reason}`
        : `Ubah status DO ${existing.orderNumber} dari ${existing.status} ➔ ${status}`;

      await db.insert(auditLogs).values({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        userId: actor.userId,
        userName: actor.userName,
        userRole: effectiveRole,
        action: actionType,
        entityType: "DELIVERY_ORDER",
        entityId: id,
        details,
        timestamp: now,
      });
    }

    return this.getOrderById(id);
  }

  /**
   * Deletes a delivery order (cascades items)
   */
  static async deleteOrder(id: string): Promise<boolean> {
    await db.delete(deliveryOrders).where(eq(deliveryOrders.id, id));
    return true;
  }
}
