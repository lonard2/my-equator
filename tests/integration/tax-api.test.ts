import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET as getProfile, POST as saveProfile } from "@/app/api/tax/profile/route";
import { GET as getInvoices, POST as createInvoice } from "@/app/api/tax/invoices/route";
import { GET as getReconciliation } from "@/app/api/tax/reconciliation/route";
import { POST as exportXml } from "@/app/api/tax/export-xml/route";
import { POST as exportExcel, GET as exportExcelGet } from "@/app/api/tax/export-excel/route";
import { POST as batchGenerate } from "@/app/api/tax/batch-generate/route";
import { POST as seedDemo } from "@/app/api/tax/seed-demo/route";
import { PUT as updateInvoice } from "@/app/api/tax/invoices/[id]/route";

describe("Coretax Tax Management API Endpoints & RBAC Enforcement", () => {
  it("rejects unauthorized roles (SALES_OPERATOR, WAREHOUSE_STAFF) from accessing tax routes", async () => {
    const req = new Request("http://localhost:3000/api/tax/reconciliation", {
      headers: {
        "x-user-role": "SALES_OPERATOR",
        "x-user-id": "user-sales",
        "x-user-name": "Sales Operator",
      },
    });

    const res = await getReconciliation(req);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.error?.includes("Akses ditolak"));
  });

  it("allows SUPER_ADMIN to fetch and update Company Tax Profile", async () => {
    const getReq = new Request("http://localhost:3000/api/tax/profile", {
      headers: { "x-user-role": "SUPER_ADMIN" },
    });
    const getRes = await getProfile(getReq);
    assert.strictEqual(getRes.status, 200);
    const getBody = await getRes.json();
    assert.strictEqual(getBody.success, true);
    assert.ok(getBody.data.companyName);

    // Update
    const postReq = new Request("http://localhost:3000/api/tax/profile", {
      method: "POST",
      headers: {
        "x-user-role": "SUPER_ADMIN",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName: "PT Equator Insole Indonesia Tax Unit",
      }),
    });
    const postRes = await saveProfile(postReq);
    assert.strictEqual(postRes.status, 200);
    const postBody = await postRes.json();
    assert.strictEqual(postBody.data.companyName, "PT Equator Insole Indonesia Tax Unit");
  });

  it("handles invoice creation, monthly reconciliation, and bulk export", async () => {
    // 1. Create Invoice
    const invoicePayload = {
      nomorFaktur: "010.001-26.88889999",
      buyerName: "PT Sentosa Mandiri",
      buyerNpwp16: "0123456789012345",
      buyerNitku22: "0123456789012345000000",
      buyerAddress: "Jl. Industri No. 10 Bandung",
      taxPeriod: "2026-09",
      invoiceDate: "2026-09-08",
      dpp: 5000000,
      ppn: 550000,
      taxRate: 11,
      items: [
        {
          itemCode: "INS-40",
          itemName: "Insole Size 40",
          quantity: 100,
          unitPrice: 50000,
          totalPrice: 5000000,
          dpp: 5000000,
          ppn: 550000,
        },
      ],
    };

    const createReq = new Request("http://localhost:3000/api/tax/invoices", {
      method: "POST",
      headers: { "x-user-role": "SUPER_ADMIN" },
      body: JSON.stringify(invoicePayload),
    });

    const createRes = await createInvoice(createReq);
    assert.strictEqual(createRes.status, 201);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.success, true);
    const invoiceId = createBody.data.id;
    assert.ok(invoiceId);

    // 2. Fetch Reconciliation
    const reconReq = new Request("http://localhost:3000/api/tax/reconciliation?period=2026-09", {
      headers: { "x-user-role": "FACTORY_MANAGER" },
    });
    const reconRes = await getReconciliation(reconReq);
    assert.strictEqual(reconRes.status, 200);
    const reconBody = await reconRes.json();
    assert.strictEqual(reconBody.success, true);
    assert.ok(reconBody.data.summary);
    assert.ok(reconBody.data.summary.totalDppKeluaran >= 5000000);

    // 3. Export XML
    const xmlReq = new Request("http://localhost:3000/api/tax/export-xml", {
      method: "POST",
      headers: { "x-user-role": "SUPER_ADMIN" },
      body: JSON.stringify({ invoiceIds: [invoiceId] }),
    });
    const xmlRes = await exportXml(xmlReq);
    assert.strictEqual(xmlRes.status, 200);
    assert.strictEqual(xmlRes.headers.get("Content-Type"), "application/xml");
    const xmlText = await xmlRes.text();
    assert.ok(xmlText.includes("TaxInvoiceBulk"));
    assert.ok(xmlText.includes("010.001-26.88889999"));

    // 4. Export Excel (POST)
    const excelReq = new Request("http://localhost:3000/api/tax/export-excel", {
      method: "POST",
      headers: { "x-user-role": "SUPER_ADMIN" },
      body: JSON.stringify({ invoiceIds: [invoiceId] }),
    });
    const excelRes = await exportExcel(excelReq);
    assert.strictEqual(excelRes.status, 200);
    assert.ok(
      excelRes.headers.get("Content-Type")?.includes("spreadsheetml.sheet") ||
      excelRes.headers.get("Content-Type")?.includes("octet-stream")
    );

    // 5. Direct 1-Click Excel Download (GET)
    const getExcelReq = new Request("http://localhost:3000/api/tax/export-excel?period=2026-09", {
      headers: { "x-user-role": "SUPER_ADMIN" },
    });
    const getExcelRes = await exportExcelGet(getExcelReq);
    assert.strictEqual(getExcelRes.status, 200);
    assert.strictEqual(
      getExcelRes.headers.get("Content-Type"),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const excelBytes = await getExcelRes.arrayBuffer();
    assert.ok(excelBytes.byteLength > 0, "Direct GET Excel should return non-empty binary buffer");

    // 6. Update Invoice Status via PUT
    const putReq = new Request(`http://localhost:3000/api/tax/invoices/${invoiceId}`, {
      method: "PUT",
      headers: {
        "x-user-role": "SUPER_ADMIN",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "READY" }),
    });
    const putRes = await updateInvoice(putReq, { params: Promise.resolve({ id: invoiceId }) });
    assert.strictEqual(putRes.status, 200);
    const putBody = await putRes.json();
    assert.strictEqual(putBody.data.status, "READY");

    // 7. Seed Demo Invoices
    const seedReq = new Request("http://localhost:3000/api/tax/seed-demo", {
      method: "POST",
      headers: {
        "x-user-role": "SUPER_ADMIN",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ period: "2026-09" }),
    });
    const seedRes = await seedDemo(seedReq);
    assert.strictEqual(seedRes.status, 200);
    const seedBody = await seedRes.json();
    assert.strictEqual(seedBody.success, true);
    assert.strictEqual(seedBody.data.length, 4);
    assert.ok(seedBody.data.some((i: any) => i.buyerName.includes("Bintang Footwear")));
  });
});
