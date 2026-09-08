/**
 * taxInvoiceService.ts
 * Database repository & business service for Tax Invoices, Company Tax Profile,
 * and Delivery Order integration.
 */
import { db } from "@/lib/db";
import {
  companyTaxProfiles,
  taxInvoices,
  taxInvoiceItems,
  deliveryOrders,
  deliveryOrderItems,
  inventoryMovements,
  materials,
} from "@/lib/db/schema";
import {
  TaxInvoice,
  TaxInvoiceItem,
  CompanyTaxProfile,
  BatchGenerateOptions,
  SptMasaPeriodSummary,
} from "@/types/tax";
import { DeliveryOrder } from "@/types";
import { eq, desc, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import {
  identifyUnbilledOrders,
  mapOrderToTaxInvoiceDraft,
  computeMonthlyVatSummary,
  MaterialPurchaseRecord,
} from "./taxReconciliationService";

export class TaxInvoiceService {
  /**
   * Fetch company tax profile (or return default if empty)
   */
  static async getCompanyTaxProfile(): Promise<CompanyTaxProfile> {
    const rows = await db.select().from(companyTaxProfiles).limit(1);
    if (rows.length > 0) {
      return rows[0] as CompanyTaxProfile;
    }

    // Default factory PKP profile
    const defaultProfile: CompanyTaxProfile = {
      id: "pkp-equator-default",
      companyName: "PT Equator Insole Indonesia",
      npwp16: "0123456789012345",
      nitku22: "0123456789012345000000",
      kppCode: "421",
      kppName: "KPP Pratama Bandung Cibeunying",
      taxAddress: "Jl. Terusan Cibaduyut No. 88, Bandung, Jawa Barat 40235",
      signatoryName: "Hendrawan Pratama",
      signatoryRole: "Direktur Utama",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(companyTaxProfiles).values(defaultProfile);
    return defaultProfile;
  }

  /**
   * Update or create company tax profile
   */
  static async saveCompanyTaxProfile(
    profile: Partial<CompanyTaxProfile>
  ): Promise<CompanyTaxProfile> {
    const existing = await this.getCompanyTaxProfile();
    const updated: CompanyTaxProfile = {
      ...existing,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(companyTaxProfiles)
      .set(updated)
      .where(eq(companyTaxProfiles.id, existing.id));

    return updated;
  }

  /**
   * Fetch all tax invoices, optionally filtered by tax period (YYYY-MM)
   */
  static async getTaxInvoices(period?: string): Promise<TaxInvoice[]> {
    let query = db.select().from(taxInvoices);
    if (period) {
      query = query.where(eq(taxInvoices.taxPeriod, period)) as typeof query;
    }
    const rows = await query.orderBy(desc(taxInvoices.createdAt));

    // Fetch items for all invoices
    const allItems = await db.select().from(taxInvoiceItems);
    const itemMap = new Map<string, TaxInvoiceItem[]>();
    for (const item of allItems) {
      if (!itemMap.has(item.taxInvoiceId)) {
        itemMap.set(item.taxInvoiceId, []);
      }
      itemMap.get(item.taxInvoiceId)!.push(item as TaxInvoiceItem);
    }

    return rows.map((r) => ({
      ...(r as unknown as TaxInvoice),
      isTaxIncluded: Boolean(r.isTaxIncluded),
      items: itemMap.get(r.id) || [],
    }));
  }

  /**
   * Fetch a single tax invoice by ID with line items
   */
  static async getTaxInvoiceById(id: string): Promise<TaxInvoice | null> {
    const rows = await db
      .select()
      .from(taxInvoices)
      .where(eq(taxInvoices.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    const items = await db
      .select()
      .from(taxInvoiceItems)
      .where(eq(taxInvoiceItems.taxInvoiceId, id));

    return {
      ...(rows[0] as unknown as TaxInvoice),
      isTaxIncluded: Boolean(rows[0].isTaxIncluded),
      items: items as TaxInvoiceItem[],
    };
  }

  /**
   * Create a new Tax Invoice
   */
  static async createTaxInvoice(
    invoice: Partial<TaxInvoice>
  ): Promise<TaxInvoice> {
    const id = invoice.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const newInvoice = {
      id,
      invoiceType: invoice.invoiceType || "OUTPUT_FPK",
      transactionCode: invoice.transactionCode || "01",
      nomorFaktur: invoice.nomorFaktur || `010.001-${now.slice(2, 4)}.${Math.floor(10000000 + Math.random() * 90000000)}`,
      referenceNumber: invoice.referenceNumber || null,
      taxPeriod: invoice.taxPeriod || now.slice(0, 7),
      invoiceDate: invoice.invoiceDate || now.split("T")[0],
      buyerName: invoice.buyerName || "Pembeli Umum",
      buyerNpwp16: invoice.buyerNpwp16 || "0000000000000000",
      buyerNitku22: invoice.buyerNitku22 || "0000000000000000000000",
      buyerAddress: invoice.buyerAddress || "Indonesia",
      dpp: invoice.dpp || 0,
      ppn: invoice.ppn || 0,
      taxRate: invoice.taxRate || 11,
      isTaxIncluded: invoice.isTaxIncluded ? 1 : 0,
      status: invoice.status || "DRAFT",
      deliveryOrderId: invoice.deliveryOrderId || null,
      inventoryMovementId: invoice.inventoryMovementId || null,
      notes: invoice.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(taxInvoices).values(newInvoice);

    // Insert line items
    if (invoice.items && invoice.items.length > 0) {
      for (const it of invoice.items) {
        await db.insert(taxInvoiceItems).values({
          id: crypto.randomUUID(),
          taxInvoiceId: id,
          itemCode: it.itemCode || "ITEM-1",
          itemName: it.itemName || "Insole BKP",
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          totalPrice: it.totalPrice || 0,
          dpp: it.dpp || 0,
          ppn: it.ppn || 0,
          createdAt: now,
        });
      }
    }

    const created = await this.getTaxInvoiceById(id);
    return created!;
  }

  /**
   * Update Tax Invoice status or fields
   */
  static async updateTaxInvoice(
    id: string,
    updates: Partial<TaxInvoice>
  ): Promise<TaxInvoice | null> {
    const existing = await this.getTaxInvoiceById(id);
    if (!existing) return null;

    const setPayload: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.status !== undefined) setPayload.status = updates.status;
    if (updates.transactionCode !== undefined) setPayload.transactionCode = updates.transactionCode;
    if (updates.nomorFaktur !== undefined) setPayload.nomorFaktur = updates.nomorFaktur;
    if (updates.buyerName !== undefined) setPayload.buyerName = updates.buyerName;
    if (updates.buyerNpwp16 !== undefined) setPayload.buyerNpwp16 = updates.buyerNpwp16;
    if (updates.buyerNitku22 !== undefined) setPayload.buyerNitku22 = updates.buyerNitku22;
    if (updates.buyerAddress !== undefined) setPayload.buyerAddress = updates.buyerAddress;
    if (updates.dpp !== undefined) setPayload.dpp = updates.dpp;
    if (updates.ppn !== undefined) setPayload.ppn = updates.ppn;
    if (updates.taxRate !== undefined) setPayload.taxRate = updates.taxRate;
    if (updates.notes !== undefined) setPayload.notes = updates.notes;

    await db.update(taxInvoices).set(setPayload).where(eq(taxInvoices.id, id));

    return this.getTaxInvoiceById(id);
  }

  /**
   * Delete a draft tax invoice
   */
  static async deleteTaxInvoice(id: string): Promise<boolean> {
    const existing = await this.getTaxInvoiceById(id);
    if (!existing) return false;

    // Delete items first
    await db.delete(taxInvoiceItems).where(eq(taxInvoiceItems.taxInvoiceId, id));
    await db.delete(taxInvoices).where(eq(taxInvoices.id, id));
    return true;
  }

  /**
   * Batch convert Delivery Orders into draft Tax Invoices
   */
  static async batchGenerateFromOrders(
    orderIds: string[],
    options: BatchGenerateOptions
  ): Promise<TaxInvoice[]> {
    if (!orderIds || orderIds.length === 0) return [];

    const orders = await db
      .select()
      .from(deliveryOrders)
      .where(inArray(deliveryOrders.id, orderIds));

    const orderItems = await db
      .select()
      .from(deliveryOrderItems)
      .where(inArray(deliveryOrderItems.deliveryOrderId, orderIds));

    const itemsByOrderId = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      if (!itemsByOrderId.has(item.deliveryOrderId)) {
        itemsByOrderId.set(item.deliveryOrderId, []);
      }
      itemsByOrderId.get(item.deliveryOrderId)!.push(item);
    }

    const createdInvoices: TaxInvoice[] = [];

    for (const order of orders) {
      const items = itemsByOrderId.get(order.id) || [];
      const orderWithItems = {
        ...(order as unknown as DeliveryOrder),
        items: items as unknown as DeliveryOrder["items"],
      };

      const draft = mapOrderToTaxInvoiceDraft(orderWithItems as any, options);
      const created = await this.createTaxInvoice(draft as any);
      createdInvoices.push(created);
    }

    return createdInvoices;
  }

  /**
   * Monthly VAT reconciliation: compares Output VAT (DOs/Invoices) against Input VAT (Inventory Purchases)
   */
  static async getMonthlyReconciliation(period: string): Promise<{
    summary: SptMasaPeriodSummary;
    unbilledOrders: DeliveryOrder[];
    invoices: TaxInvoice[];
  }> {
    // 1. Fetch all invoices for period
    const invoices = await this.getTaxInvoices(period);

    // 2. Fetch all delivery orders matching the period (YYYY-MM prefix)
    const allOrders = await db.select().from(deliveryOrders);
    const monthlyOrders = allOrders.filter((o) =>
      o.deliveryDate.startsWith(period)
    ) as unknown as DeliveryOrder[];

    // 3. Identify unbilled orders
    const unbilledOrders = identifyUnbilledOrders(monthlyOrders, invoices);
    const unbilledAmount = unbilledOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    // 4. Calculate Input VAT from raw material purchases in this period
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.type, "IN_PURCHASE"));

    const monthlyMovements = movements.filter((m) =>
      m.createdAt.startsWith(period)
    );

    // Get materials for unitCost
    const allMaterials = await db.select().from(materials);
    const materialCostMap = new Map(allMaterials.map((m) => [m.id, m.unitCost]));

    const materialPurchases: MaterialPurchaseRecord[] = monthlyMovements.map(
      (mov) => {
        const unitCost = materialCostMap.get(mov.materialId) || 0;
        const totalCost = mov.quantity * unitCost;
        const estimatedVat = Math.round(totalCost * 0.11);
        return { totalCost, estimatedVat };
      }
    );

    // 5. Summary
    const summary = computeMonthlyVatSummary(
      period,
      invoices,
      materialPurchases,
      unbilledOrders.length,
      unbilledAmount
    );

    return {
      summary,
      unbilledOrders,
      invoices,
    };
  }
}
