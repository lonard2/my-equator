/**
 * coretaxXmlGenerator.ts
 * Generates Coretax DJP (PSIAP) compliant XML for bulk upload of e-Faktur Pajak Keluaran.
 * Adheres strictly to DJP XML Schema with 16-digit NPWP, 22-digit NITKU, and XML escaping.
 */
import { TaxInvoice, CompanyTaxProfile } from "@/types/tax";
import { cleanTaxDigits } from "@/lib/utils/taxFormatters";

/**
 * Escapes reserved XML characters to prevent syntax injection or invalid XML payloads.
 */
export function escapeXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates standard Coretax XML string for an array of Tax Invoices.
 */
export function generateCoretaxXml(
  invoices: TaxInvoice[],
  company: CompanyTaxProfile
): string {
  const totalInvoices = invoices.length;
  const totalDpp = invoices.reduce((sum, inv) => sum + (inv.dpp || 0), 0);
  const totalPpn = invoices.reduce((sum, inv) => sum + (inv.ppn || 0), 0);
  const generatedAt = new Date().toISOString();

  const sellerNpwp16 = cleanTaxDigits(company.npwp16);
  const sellerNitku22 = cleanTaxDigits(company.nitku22);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<TaxInvoiceBulk xmlns="http://www.pajak.go.id/coretax/efaktur/v1">\n`;
  xml += `  <Header>\n`;
  xml += `    <TotalInvoices>${totalInvoices}</TotalInvoices>\n`;
  xml += `    <TotalDpp>${totalDpp}</TotalDpp>\n`;
  xml += `    <TotalPpn>${totalPpn}</TotalPpn>\n`;
  xml += `    <GeneratedAt>${escapeXml(generatedAt)}</GeneratedAt>\n`;
  xml += `  </Header>\n`;
  xml += `  <TaxInvoices>\n`;

  for (const inv of invoices) {
    const buyerNpwp16 = cleanTaxDigits(inv.buyerNpwp16);
    const buyerNitku22 = cleanTaxDigits(inv.buyerNitku22);

    // Extract year and month from taxPeriod (e.g., "2026-09" -> year 2026, month 09)
    let taxYear = "2026";
    let taxMonth = "01";
    if (inv.taxPeriod && inv.taxPeriod.includes("-")) {
      const parts = inv.taxPeriod.split("-");
      taxYear = parts[0];
      taxMonth = parts[1];
    }

    const typeStr = inv.invoiceType === "INPUT_FPM" ? "INPUT" : "OUTPUT";

    xml += `    <TaxInvoice>\n`;
    xml += `      <InvoiceType>${typeStr}</InvoiceType>\n`;
    xml += `      <TransactionCode>${escapeXml(inv.transactionCode || "01")}</TransactionCode>\n`;
    xml += `      <NomorFaktur>${escapeXml(inv.nomorFaktur)}</NomorFaktur>\n`;
    xml += `      <ReferenceNumber>${escapeXml(inv.referenceNumber || "")}</ReferenceNumber>\n`;
    xml += `      <InvoiceDate>${escapeXml(inv.invoiceDate)}</InvoiceDate>\n`;
    xml += `      <TaxPeriod>${escapeXml(taxMonth)}</TaxPeriod>\n`;
    xml += `      <TaxYear>${escapeXml(taxYear)}</TaxYear>\n`;

    // Seller Block
    xml += `      <Seller>\n`;
    xml += `        <Npwp16>${escapeXml(sellerNpwp16)}</Npwp16>\n`;
    xml += `        <Nitku22>${escapeXml(sellerNitku22)}</Nitku22>\n`;
    xml += `        <Name>${escapeXml(company.companyName)}</Name>\n`;
    xml += `        <Address>${escapeXml(company.taxAddress)}</Address>\n`;
    xml += `      </Seller>\n`;

    // Buyer Block
    xml += `      <Buyer>\n`;
    xml += `        <Npwp16>${escapeXml(buyerNpwp16)}</Npwp16>\n`;
    xml += `        <Nitku22>${escapeXml(buyerNitku22)}</Nitku22>\n`;
    xml += `        <Name>${escapeXml(inv.buyerName)}</Name>\n`;
    xml += `        <Address>${escapeXml(inv.buyerAddress)}</Address>\n`;
    xml += `      </Buyer>\n`;

    // Line items
    xml += `      <InvoiceLines>\n`;
    if (inv.items && inv.items.length > 0) {
      for (const item of inv.items) {
        xml += `        <Line>\n`;
        xml += `          <ItemCode>${escapeXml(item.itemCode)}</ItemCode>\n`;
        xml += `          <ItemName>${escapeXml(item.itemName)}</ItemName>\n`;
        xml += `          <Quantity>${item.quantity}</Quantity>\n`;
        xml += `          <UnitPrice>${item.unitPrice}</UnitPrice>\n`;
        xml += `          <TotalPrice>${item.totalPrice}</TotalPrice>\n`;
        xml += `          <Dpp>${item.dpp}</Dpp>\n`;
        xml += `          <Ppn>${item.ppn}</Ppn>\n`;
        xml += `        </Line>\n`;
      }
    } else {
      // Fallback single line from header
      xml += `        <Line>\n`;
      xml += `          <ItemCode>INSOLE-GENERIC</ItemCode>\n`;
      xml += `          <ItemName>Penyerahan Produk Insole Footwear</ItemName>\n`;
      xml += `          <Quantity>1</Quantity>\n`;
      xml += `          <UnitPrice>${inv.dpp}</UnitPrice>\n`;
      xml += `          <TotalPrice>${inv.dpp}</TotalPrice>\n`;
      xml += `          <Dpp>${inv.dpp}</Dpp>\n`;
      xml += `          <Ppn>${inv.ppn}</Ppn>\n`;
      xml += `        </Line>\n`;
    }
    xml += `      </InvoiceLines>\n`;

    // Summary Block
    xml += `      <Summary>\n`;
    xml += `        <Dpp>${inv.dpp}</Dpp>\n`;
    xml += `        <Ppn>${inv.ppn}</Ppn>\n`;
    xml += `        <TaxRate>${inv.taxRate || 11}</TaxRate>\n`;
    xml += `      </Summary>\n`;
    xml += `    </TaxInvoice>\n`;
  }

  xml += `  </TaxInvoices>\n`;
  xml += `</TaxInvoiceBulk>\n`;

  return xml;
}
