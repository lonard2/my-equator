export type TaxInvoiceType = "OUTPUT_FPK" | "INPUT_FPM";

export type TaxInvoiceStatus =
  | "DRAFT"
  | "READY"
  | "EXPORTED_XML"
  | "EXPORTED_EXCEL"
  | "UPLOADED_CORETAX"
  | "APPROVED"
  | "CANCELLED";

export type TaxTransactionCode =
  | "01" // Penyerahan BKP/JKP Umum
  | "02" // Pemungut Bendahara Pemerintah
  | "03" // Pemungut Lainnya (BUMN / K3S)
  | "04" // DPP Nilai Lain
  | "05" // Besaran Tertentu
  | "07" // Penyerahan tidak dipungut (Kawasan Berikat / KEK)
  | "08" // Penyerahan dibebaskan dari pengenaan PPN
  | "09"; // Aktiva pasal 16D

export interface CompanyTaxProfile {
  id: string;
  companyName: string;
  npwp16: string;
  nitku22: string;
  kppCode: string;
  kppName?: string | null;
  taxAddress: string;
  signatoryName: string;
  signatoryRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxInvoiceItem {
  id: string;
  taxInvoiceId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dpp: number;
  ppn: number;
  createdAt: string;
}

export interface TaxInvoice {
  id: string;
  invoiceType: TaxInvoiceType;
  transactionCode: TaxTransactionCode;
  nomorFaktur: string; // NSFP / Coretax Invoice Number
  referenceNumber?: string | null; // e.g. SJ/EQ/... or PO
  taxPeriod: string; // YYYY-MM
  invoiceDate: string; // YYYY-MM-DD
  buyerName: string;
  buyerNpwp16: string;
  buyerNitku22: string;
  buyerAddress: string;
  dpp: number;
  ppn: number;
  taxRate: number; // 11 or 12
  isTaxIncluded: boolean;
  status: TaxInvoiceStatus;
  deliveryOrderId?: string | null;
  inventoryMovementId?: string | null;
  notes?: string | null;
  items?: TaxInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPurchaseDetail {
  id: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  estimatedVat: number;
  date: string;
  notes?: string | null;
}

export interface SptMasaPeriodSummary {
  id?: string;
  period: string; // YYYY-MM
  totalDppKeluaran: number;
  totalPpnKeluaran: number;
  countFpk: number;
  totalDppMasukan: number;
  totalPpnMasukan: number;
  countFpm: number;
  netTaxPayable: number; // PPN Keluaran - PPN Masukan
  unbilledOrdersCount: number;
  unbilledOrdersAmount: number;
  status: "OPEN" | "RECONCILED" | "REPORTED";
  materialPurchases?: MaterialPurchaseDetail[];
}

export interface BatchGenerateOptions {
  transactionCode: TaxTransactionCode;
  taxRate: number;
  invoiceDate: string;
  isTaxIncluded: boolean;
}
