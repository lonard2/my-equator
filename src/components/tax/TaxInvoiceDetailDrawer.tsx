import React, { useState } from "react";
import { TaxInvoice, TaxInvoiceStatus } from "@/types/tax";
import { formatRupiahTax, formatNpwp16, formatNitku22 } from "@/lib/utils/taxFormatters";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import {
  X,
  FileText,
  Building,
  MapPin,
  Calendar,
  Hash,
  Copy,
  Check,
  Code2,
  Receipt,
  FileSpreadsheet,
  Download,
  CheckCircle2,
} from "lucide-react";

interface TaxInvoiceDetailDrawerProps {
  invoice: TaxInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  userRole?: string;
  onUpdateStatus?: (id: string, status: TaxInvoiceStatus) => Promise<void>;
}

export function TaxInvoiceDetailDrawer({
  invoice,
  isOpen,
  onClose,
  language,
  userRole = "SUPER_ADMIN",
  onUpdateStatus,
}: TaxInvoiceDetailDrawerProps) {
  const isId = language === "id";
  const [activeTab, setActiveTab] = useState<"DETAILS" | "XML">("DETAILS");
  const [copied, setCopied] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingXml, setDownloadingXml] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const modalRef = useModalSafety({ isOpen, onClose });

  if (!isOpen || !invoice) return null;

  const handleDownloadInvoiceExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await fetch("/api/tax/export-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({ invoiceIds: [invoice.id] }),
      });
      if (!res.ok) throw new Error("Gagal mengunduh Excel");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Faktur_${invoice.nomorFaktur.replace(/[/\\?%*:|"<>]/g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadInvoiceXml = async () => {
    setDownloadingXml(true);
    try {
      const res = await fetch("/api/tax/export-xml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({ invoiceIds: [invoice.id] }),
      });
      if (!res.ok) throw new Error("Gagal mengunduh XML");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Faktur_${invoice.nomorFaktur.replace(/[/\\?%*:|"<>]/g, "-")}.xml`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingXml(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaxInvoiceStatus;
    if (onUpdateStatus) {
      setUpdatingStatus(true);
      try {
        await onUpdateStatus(invoice.id, newStatus);
      } finally {
        setUpdatingStatus(false);
      }
    }
  };

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<TaxInvoice>
  <InvoiceType>OUTPUT</InvoiceType>
  <TransactionCode>${invoice.transactionCode || "01"}</TransactionCode>
  <NomorFaktur>${invoice.nomorFaktur}</NomorFaktur>
  <InvoiceDate>${invoice.invoiceDate}</InvoiceDate>
  <TaxPeriod>${invoice.taxPeriod}</TaxPeriod>
  <Buyer>
    <Npwp16>${invoice.buyerNpwp16}</Npwp16>
    <Nitku22>${invoice.buyerNitku22}</Nitku22>
    <Name>${invoice.buyerName}</Name>
    <Address>${invoice.buyerAddress}</Address>
  </Buyer>
  <Summary>
    <Dpp>${invoice.dpp}</Dpp>
    <Ppn>${invoice.ppn}</Ppn>
    <TaxRate>${invoice.taxRate}</TaxRate>
  </Summary>
</TaxInvoice>`;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(sampleXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tax-invoice-detail-title"
        tabIndex={-1}
        className="w-full max-w-xl bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200 focus:outline-none"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:border dark:border-red-800/60 dark:text-red-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 id="tax-invoice-detail-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                {invoice.nomorFaktur}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isId ? "Detail Faktur Pajak Coretax" : "Coretax Tax Invoice Details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isId ? "Tutup detail faktur" : "Close invoice details"}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Details vs XML */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 bg-neutral-100/50 dark:bg-neutral-950/40">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "DETAILS"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {isId ? "Informasi & Rincian" : "Information & Lines"}
          </button>
          <button
            onClick={() => setActiveTab("XML")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "XML"
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {isId ? "Pratinjau XML Coretax" : "Coretax XML Preview"}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "DETAILS" ? (
            <>
              {/* Identitas Pembeli Card */}
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5 space-y-2.5">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  {isId ? "Profil Wajib Pajak Pembeli" : "Buyer Tax Profile"}
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">{isId ? "Nama Pembeli:" : "Buyer Name:"}</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{invoice.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">NPWP 16 Digit:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200">{formatNpwp16(invoice.buyerNpwp16)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">NITKU 22 Digit:</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200">{formatNitku22(invoice.buyerNitku22)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">{isId ? "Alamat PKP:" : "Tax Address:"}</span>
                    <span className="text-neutral-700 dark:text-neutral-300 text-right max-w-xs">{invoice.buyerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Detail Transaksi & Fiskal */}
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-lg p-3.5 space-y-2.5">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  {isId ? "Parameter Dokumen Fiskal" : "Fiscal Parameters"}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Masa Pajak" : "Tax Period"}</span>
                    <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{invoice.taxPeriod}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Tanggal Faktur" : "Date"}</span>
                    <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{invoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Kode Transaksi" : "Trx Code"}</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{invoice.transactionCode} (Penyerahan Umum BKP)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isId ? "Tarif PPN" : "VAT Rate"}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{invoice.taxRate}%</span>
                  </div>
                </div>
              </div>

              {/* Rincian Barang Kena Pajak (BKP) */}
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {isId ? "Rincian Barang Kena Pajak (Insole)" : "Goods & Services Breakdown"}
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800/50">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 text-xs flex justify-between items-start">
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-200">{item.itemName}</div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {item.quantity} pasang @ {formatRupiahTax(item.unitPrice)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">{formatRupiahTax(item.totalPrice)}</div>
                          <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">PPN: {formatRupiahTax(item.ppn)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-neutral-500 text-center">
                      {isId ? "Tidak ada perincian barang spesifik" : "No item breakdown"}
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Totals */}
              <div className="bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                  <span>{isId ? "Dasar Pengenaan Pajak (DPP):" : "Tax Base (DPP):"}</span>
                  <span className="font-mono font-medium">{formatRupiahTax(invoice.dpp)}</span>
                </div>
                <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold text-sm">
                  <span>{isId ? "PPN Terutang:" : "Output VAT Due:"}</span>
                  <span className="font-mono">{formatRupiahTax(invoice.ppn)}</span>
                </div>
                <div className="flex justify-between text-neutral-900 dark:text-neutral-100 font-bold border-t border-neutral-200 dark:border-neutral-800 pt-1.5 mt-1.5">
                  <span>{isId ? "Total Nilai Penyerahan:" : "Grand Total:"}</span>
                  <span className="font-mono">{formatRupiahTax(invoice.dpp + invoice.ppn)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isId ? "Payload XML siap impor Coretax DJP" : "Coretax ready XML payload"}
                </span>
                <button
                  onClick={handleCopyXml}
                  className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isId ? "Tersalin!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isId ? "Salin XML" : "Copy XML"}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-800 dark:text-neutral-300 overflow-x-auto leading-relaxed max-h-[500px]">
                {sampleXml}
              </pre>
            </div>
          )}
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3">
          {/* Status selector */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="drawer-invoice-status" className="text-neutral-600 dark:text-neutral-400 font-medium">
              {isId ? "Status:" : "Status:"}
            </label>
            <select
              id="drawer-invoice-status"
              value={invoice.status}
              disabled={updatingStatus}
              onChange={handleStatusChange}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            >
              <option value="DRAFT">DRAFT (Konsep)</option>
              <option value="READY">READY (Siap Ekspor)</option>
              <option value="EXPORTED_XML">EXPORTED_XML</option>
              <option value="EXPORTED_EXCEL">EXPORTED_EXCEL</option>
              <option value="UPLOADED_CORETAX">UPLOADED_CORETAX</option>
              <option value="APPROVED">APPROVED (Disetujui DJP)</option>
              <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
            </select>
          </div>

          {/* Direct Download Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInvoiceExcel}
              disabled={downloadingExcel}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:border-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isId ? "Unduh Excel (.xlsx)" : "Download Excel"}</span>
            </button>
            <button
              onClick={handleDownloadInvoiceXml}
              disabled={downloadingXml}
              className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border border-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-transparent rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>{isId ? "Unduh XML (.xml)" : "Download XML"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
