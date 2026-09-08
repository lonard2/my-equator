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
    const profile = await TaxInvoiceService.getCompanyTaxProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch profile" },
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
    const updated = await TaxInvoiceService.saveCompanyTaxProfile(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
