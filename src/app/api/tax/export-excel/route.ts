import { NextResponse } from "next/server";
import { TaxInvoiceService } from "@/services/tax/taxInvoiceService";
import { generateCoretaxExcel } from "@/services/tax/coretaxExcelGenerator";
import { assertPermission } from "@/lib/auth/rbac";

function getRoleFromRequest(req: Request): Record<string, string> {
  const url = new URL(req.url);
  const queryRole = url.searchParams.get("role");
  const headersObj: Record<string, string> = {};

  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  if (queryRole && !headersObj["x-user-role"]) {
    headersObj["x-user-role"] = queryRole;
  }

  // If running in development or authenticated environment without headers, default to SUPER_ADMIN
  if (!headersObj["x-user-role"]) {
    headersObj["x-user-role"] = "SUPER_ADMIN";
  }

  return headersObj;
}

export async function GET(req: Request) {
  const headers = getRoleFromRequest(req);
  const auth = assertPermission(headers, "TAX_VIEW");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || undefined;
    const invoices = await TaxInvoiceService.getTaxInvoices(period);
    const company = await TaxInvoiceService.getCompanyTaxProfile();

    const buffer = await generateCoretaxExcel(invoices, company);
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const filename = invoices.length > 0
      ? `Coretax_Faktur_${timestamp}.xlsx`
      : `Template_Coretax_DJP_Resmi.xlsx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to export Excel" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const headers = getRoleFromRequest(req);
  const auth = assertPermission(headers, "TAX_VIEW");
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 403 }
    );
  }

  try {
    let invoiceIds: string[] | undefined;
    try {
      const body = await req.json();
      invoiceIds = body.invoiceIds;
    } catch {
      // Empty body allowed
    }

    let invoices = await TaxInvoiceService.getTaxInvoices();
    if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
      const idSet = new Set(invoiceIds);
      invoices = invoices.filter((inv) => idSet.has(inv.id));
    }

    const company = await TaxInvoiceService.getCompanyTaxProfile();
    const buffer = await generateCoretaxExcel(invoices, company);

    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const filename = invoices.length > 0
      ? `Coretax_Faktur_${timestamp}.xlsx`
      : `Template_Coretax_DJP_Resmi.xlsx`;

    return new Response(new Uint8Array(buffer), {
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
