import { NextResponse } from "next/server";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { assertPermission } from "@/lib/auth/rbac";

export async function GET(req: Request) {
  const auth = assertPermission(req.headers, "TAX_VIEW");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || undefined;
    const invoices = await TaxInvoiceService.getTaxInvoices(period);
    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

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
    const created = await TaxInvoiceService.createTaxInvoice(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
