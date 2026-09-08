import { NextResponse } from "next/server";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { generateCoretaxExcel } from "@/services/tax/coretaxExcelGenerator";
import { assertPermission } from "@/lib/auth/rbac";

export async function POST(req: Request) {
  const auth = assertPermission(req.headers, "TAX_VIEW");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { invoiceIds } = body;

    let invoices = await TaxInvoiceService.getTaxInvoices();
    if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      const idSet = new Set(invoiceIds);
      invoices = invoices.filter((inv) => idSet.has(inv.id));
    }

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: "No invoices found for export" },
        { status: 400 }
      );
    }

    const company = await TaxInvoiceService.getCompanyTaxProfile();
    const buffer = await generateCoretaxExcel(invoices, company);

    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const filename = `Coretax_Faktur_${timestamp}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to generate Coretax Excel" },
      { status: 500 }
    );
  }
}
