"use client";

import React, { useState } from "react";
import { TaxInvoice } from "@/types/tax";
import { formatRupiahTax, formatNpwp16, formatNitku22 } from "@/lib/utils/taxFormatters";
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
} from "lucide-react";

interface TaxInvoiceDetailDrawerProps {
  invoice: TaxInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
}

export function TaxInvoiceDetailDrawer({
  invoice,
  isOpen,
  onClose,
  language,
}: TaxInvoiceDetailDrawerProps) {
  const isId = language === "id";
  const [activeTab, setActiveTab] = useState<"DETAILS" | "XML">("DETAILS");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

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
      <div className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100 font-mono">
                {invoice.nomorFaktur}
              </h3>
              <p className="text-xs text-neutral-400">
                {isId ? "Detail Faktur Pajak Coretax" : "Coretax Tax Invoice Details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup detail faktur"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Details vs XML */}
        <div className="flex border-b border-neutral-800 px-4 bg-neutral-950/40">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "DETAILS"
                ? "border-red-600 text-red-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {isId ? "Informasi & Rincian" : "Information & Lines"}
          </button>
          <button
            onClick={() => setActiveTab("XML")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "XML"
                ? "border-red-600 text-red-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
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
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-3.5 space-y-2.5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {isId ? "Profil Wajib Pajak Pembeli" : "Buyer Tax Profile"}
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{isId ? "Nama Pembeli:" : "Buyer Name:"}</span>
                    <span className="font-semibold text-neutral-100">{invoice.buyerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">NPWP 16 Digit:</span>
                    <span className="font-mono text-neutral-200">{formatNpwp16(invoice.buyerNpwp16)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">NITKU 22 Digit:</span>
                    <span className="font-mono text-neutral-200">{formatNitku22(invoice.buyerNitku22)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{isId ? "Alamat PKP:" : "Tax Address:"}</span>
                    <span className="text-neutral-300 text-right max-w-xs">{invoice.buyerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Detail Transaksi & Fiskal */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-3.5 space-y-2.5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {isId ? "Parameter Dokumen Fiskal" : "Fiscal Parameters"}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[11px]">{isId ? "Masa Pajak" : "Tax Period"}</span>
                    <span className="font-mono font-medium text-neutral-200">{invoice.taxPeriod}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">{isId ? "Tanggal Faktur" : "Date"}</span>
                    <span className="font-mono font-medium text-neutral-200">{invoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">{isId ? "Kode Transaksi" : "Trx Code"}</span>
                    <span className="font-medium text-neutral-200">{invoice.transactionCode} (Penyerahan Umum BKP)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[11px]">{isId ? "Tarif PPN" : "VAT Rate"}</span>
                    <span className="font-medium text-red-400">{invoice.taxRate}%</span>
                  </div>
                </div>
              </div>

              {/* Rincian Barang Kena Pajak (BKP) */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg overflow-hidden">
                <div className="p-3 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {isId ? "Rincian Barang Kena Pajak (Insole)" : "Goods & Services Breakdown"}
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 text-xs flex justify-between items-start">
                        <div>
                          <div className="font-medium text-neutral-200">{item.itemName}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {item.quantity} pasang @ {formatRupiahTax(item.unitPrice)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-semibold text-neutral-100">{formatRupiahTax(item.totalPrice)}</div>
                          <div className="text-[10px] text-red-400 mt-0.5">PPN: {formatRupiahTax(item.ppn)}</div>
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
              <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>{isId ? "Dasar Pengenaan Pajak (DPP):" : "Tax Base (DPP):"}</span>
                  <span className="font-mono font-medium">{formatRupiahTax(invoice.dpp)}</span>
                </div>
                <div className="flex justify-between text-red-400 font-semibold text-sm">
                  <span>{isId ? "PPN Terutang:" : "Output VAT Due:"}</span>
                  <span className="font-mono">{formatRupiahTax(invoice.ppn)}</span>
                </div>
                <div className="flex justify-between text-neutral-100 font-bold border-t border-red-900/30 pt-1.5 mt-1.5">
                  <span>{isId ? "Total Nilai Penyerahan:" : "Grand Total:"}</span>
                  <span className="font-mono">{formatRupiahTax(invoice.dpp + invoice.ppn)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {isId ? "Payload XML siap impor Coretax DJP" : "Coretax ready XML payload"}
                </span>
                <button
                  onClick={handleCopyXml}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-300 overflow-x-auto leading-relaxed max-h-[500px]">
                {sampleXml}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
