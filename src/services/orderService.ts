import { db } from "@/lib/db";
import { deliveryOrders, deliveryOrderItems } from "@/lib/db/schema";
import { DeliveryOrder, DeliveryOrderItem, DeliveryOrderStatus, SizeBreakdown } from "@/types";
import { eq, desc, like } from "drizzle-orm";
import crypto from "crypto";

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

    const result: DeliveryOrder[] = [];
    for (const order of orders) {
      const items = await db
        .select()
        .from(deliveryOrderItems)
        .where(eq(deliveryOrderItems.deliveryOrderId, order.id));

      const parsedItems: DeliveryOrderItem[] = items.map((item) => ({
        id: item.id,
        deliveryOrderId: item.deliveryOrderId,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || undefined,
        sizes: JSON.parse(item.sizeBreakdown) as SizeBreakdown,
        totalPairs: item.totalPairs,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        notes: item.notes || undefined,
      }));

      result.push({
        id: order.id,
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        destinationAddress: order.destinationAddress,
        poNumber: order.poNumber || undefined,
        vehicleNumber: order.vehicleNumber || undefined,
        driverName: order.driverName || undefined,
        status: order.status as DeliveryOrderStatus,
        deliveryDate: order.deliveryDate,
        notes: order.notes || undefined,
        totalQuantity: order.totalQuantity,
        totalAmount: order.totalAmount || 0,
        items: parsedItems,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    return result;
  }

  /**
   * Retrieves single order by ID
   */
  static async getOrderById(id: string): Promise<DeliveryOrder | null> {
    const orders = await db.select().from(deliveryOrders).where(eq(deliveryOrders.id, id)).limit(1);
    if (orders.length === 0) return null;

    const order = orders[0];
    const items = await db
      .select()
      .from(deliveryOrderItems)
      .where(eq(deliveryOrderItems.deliveryOrderId, order.id));

    const parsedItems: DeliveryOrderItem[] = items.map((item) => ({
      id: item.id,
      deliveryOrderId: item.deliveryOrderId,
      articleCode: item.articleCode,
      articleName: item.articleName,
      colorway: item.colorway || undefined,
      sizes: JSON.parse(item.sizeBreakdown) as SizeBreakdown,
      totalPairs: item.totalPairs,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      notes: item.notes || undefined,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      recipientName: order.recipientName,
      destinationAddress: order.destinationAddress,
      poNumber: order.poNumber || undefined,
      vehicleNumber: order.vehicleNumber || undefined,
      driverName: order.driverName || undefined,
      status: order.status as DeliveryOrderStatus,
      deliveryDate: order.deliveryDate,
      notes: order.notes || undefined,
      totalQuantity: order.totalQuantity,
      totalAmount: order.totalAmount || 0,
      items: parsedItems,
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
    deliveryDate: string;
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
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();
    const orderNumber = data.orderNumber || (await this.generateNextOrderNumber());

    let grandTotalPairs = 0;
    let grandTotalAmount = 0;

    const itemRows = data.items.map((item) => {
      let itemPairs = 0;
      Object.values(item.sizes).forEach((qty) => {
        if (typeof qty === "number" && qty > 0) {
          itemPairs += qty;
        }
      });

      const unitPrice = item.unitPrice || 0;
      const totalPrice = itemPairs * unitPrice;

      grandTotalPairs += itemPairs;
      grandTotalAmount += totalPrice;

      return {
        id: crypto.randomUUID(),
        deliveryOrderId: orderId,
        articleCode: item.articleCode,
        articleName: item.articleName,
        colorway: item.colorway || null,
        sizeBreakdown: JSON.stringify(item.sizes),
        totalPairs: itemPairs,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        notes: item.notes || null,
        createdAt: now,
      };
    });

    await db.insert(deliveryOrders).values({
      id: orderId,
      orderNumber,
      recipientName: data.recipientName,
      destinationAddress: data.destinationAddress,
      poNumber: data.poNumber || null,
      vehicleNumber: data.vehicleNumber || null,
      driverName: data.driverName || null,
      status: data.status || "DRAFT",
      deliveryDate: data.deliveryDate,
      notes: data.notes || null,
      totalQuantity: grandTotalPairs,
      totalAmount: grandTotalAmount,
      createdAt: now,
      updatedAt: now,
    });

    if (itemRows.length > 0) {
      await db.insert(deliveryOrderItems).values(itemRows);
    }

    const created = await this.getOrderById(orderId);
    return created!;
  }

  /**
   * Updates an existing delivery order and its line items
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
      grandTotalPairs = 0;
      grandTotalAmount = 0;

      // Replace items
      await db.delete(deliveryOrderItems).where(eq(deliveryOrderItems.deliveryOrderId, id));

      const newRows = data.items.map((item) => {
        let itemPairs = 0;
        Object.values(item.sizes).forEach((qty) => {
          if (typeof qty === "number" && qty > 0) itemPairs += qty;
        });

        const unitPrice = item.unitPrice || 0;
        const totalPrice = itemPairs * unitPrice;
        grandTotalPairs += itemPairs;
        grandTotalAmount += totalPrice;

        return {
          id: item.id || crypto.randomUUID(),
          deliveryOrderId: id,
          articleCode: item.articleCode,
          articleName: item.articleName,
          colorway: item.colorway || null,
          sizeBreakdown: JSON.stringify(item.sizes),
          totalPairs: itemPairs,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
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
   * Updates delivery order status
   */
  static async updateOrderStatus(id: string, status: DeliveryOrderStatus): Promise<DeliveryOrder | null> {
    const now = new Date().toISOString();
    await db
      .update(deliveryOrders)
      .set({ status, updatedAt: now })
      .where(eq(deliveryOrders.id, id));
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
