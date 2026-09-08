import { NextResponse } from "next/server";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { assertPermission } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  const auth = assertPermission(req.headers, "TAX_MANAGE");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { orderIds, options } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderIds array is required" },
        { status: 400 }
      );
    }

    const defaultOptions = {
      transactionCode: options?.transactionCode || "01",
      taxRate: options?.taxRate || 11,
      invoiceDate: options?.invoiceDate || new Date().toISOString().split("T")[0],
      isTaxIncluded: Boolean(options?.isTaxIncluded),
    };

    const created = await TaxInvoiceService.batchGenerateFromOrders(
      orderIds,
      defaultOptions
    );

    return NextResponse.json({
      success: true,
      data: created,
      count: created.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to batch generate invoices" },
      { status: 500 }
    );
  }
}
