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
    const period =
      searchParams.get("period") || new Date().toISOString().slice(0, 7);

    const result = await TaxInvoiceService.getMonthlyReconciliation(period);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch reconciliation" },
      { status: 500 }
    );
  }
}
