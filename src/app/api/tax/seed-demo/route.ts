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
    const body = await req.json().catch(() => ({}));
    const period = body.period || new Date().toISOString().slice(0, 7);
    const invoices = await TaxInvoiceService.seedDemoInvoices(period);

    return NextResponse.json({
      success: true,
      data: invoices,
      message: `Berhasil menambahkan ${invoices.length} faktur contoh untuk masa ${period}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat data contoh" },
      { status: 500 }
    );
  }
}
