import { NextResponse } from "next/server";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { assertPermission } from "@/lib/auth/rbac";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = assertPermission(req.headers, "TAX_VIEW");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const invoice = await TaxInvoiceService.getTaxInvoiceById(id);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = assertPermission(req.headers, "TAX_MANAGE");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await TaxInvoiceService.updateTaxInvoice(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = assertPermission(req.headers, "TAX_MANAGE");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const deleted = await TaxInvoiceService.deleteTaxInvoice(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Invoice deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
