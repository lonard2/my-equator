"use client";

import React, { useState } from "react";
import { TaxInvoice, TaxTransactionCode } from "@/types/tax";
import {
  cleanTaxDigits,
  formatNpwp16,
  formatNitku22,
  formatRupiahTax,
} from "@/lib/utils/taxFormatters";
import { calculateItemTax } from "@/services/tax/taxCalculationService";
import { useModalSafety } from "@/lib/utils/useModalSafety";
import {
  X,
  Plus,
  Trash2,
  FilePlus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building,
} from "lucide-react";

interface TaxManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  period: string;
  onCreated: () => void;
  userRole?: string;
}

interface ItemRow {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export function TaxManualInvoiceModal({
  isOpen,
  onClose,
  language,
  period,
  onCreated,
  userRole = "SUPER_ADMIN",
}: TaxManualInvoiceModalProps) {
  const isId = language === "id";
  const modalRef = useModalSafety({ isOpen, onClose });

  const today = new Date().toISOString().split("T")[0];
  const [transactionCode, setTransactionCode] = useState<TaxTransactionCode>("01");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [taxPeriod, setTaxPeriod] = useState(period);
  const [nomorFaktur, setNomorFaktur] = useState(
    `010.001-${today.slice(2, 4)}.${Math.floor(10000000 + Math.random() * 90000000)}`
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerNpwp16, setBuyerNpwp16] = useState("");
  const [buyerNitku22, setBuyerNitku22] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [taxRate, setTaxRate] = useState<number>(11);
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "item-1",
      itemCode: "INS-EVA-CUSTOM",
      itemName: "Insole EVA Foam Custom",
      quantity: 1000,
      unitPrice: 25000,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNpwpChange = (val: string) => {
    const clean = cleanTaxDigits(val);
    setBuyerNpwp16(clean);
    if (!buyerNitku22 || buyerNitku22.startsWith(clean.slice(0, 10))) {
      setBuyerNitku22(clean + "000000".slice(0, Math.max(0, 22 - clean.length)));
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        itemCode: `ITEM-${prev.length + 1}`,
        itemName: "Insole Footwear BKP",
        quantity: 100,
        unitPrice: 20000,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ItemRow, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Compute calculated line items and totals
  const calculatedItems = items.map((it) => {
    const calc = calculateItemTax({
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      taxRate,
      isTaxIncluded,
    });
    return {
      ...it,
      totalPrice: calc.totalPrice,
      dpp: calc.dpp,
      ppn: calc.ppn,
    };
  });

  const totalDpp = calculatedItems.reduce((sum, it) => sum + it.dpp, 0);
  const totalPpn = calculatedItems.reduce((sum, it) => sum + it.ppn, 0);
  const grandTotal = isTaxIncluded ? totalDpp : totalDpp + totalPpn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buyerName.trim()) {
      setFormError(isId ? "Nama Pembeli wajib diisi" : "Buyer Name is required");
      return;
    }

    const cleanNpwp = cleanTaxDigits(buyerNpwp16);
    if (cleanNpwp.length !== 16) {
      setFormError(
        isId
          ? "NPWP Pembeli harus terdiri dari tepat 16 digit angka (atau 16 digit NIK)"
          : "Buyer NPWP must be exactly 16 digits (or 16-digit NIK)"
      );
      return;
    }

    const cleanNitku = cleanTaxDigits(buyerNitku22) || cleanNpwp + "000000";

    setLoading(true);
    try {
      const payload: Partial<TaxInvoice> = {
        invoiceType: "OUTPUT_FPK",
        transactionCode,
        nomorFaktur,
        referenceNumber: referenceNumber.trim() || undefined,
        taxPeriod,
        invoiceDate,
        buyerName: buyerName.trim(),
        buyerNpwp16: cleanNpwp,
        buyerNitku22: cleanNitku,
        buyerAddress: buyerAddress.trim() || "Indonesia",
        dpp: totalDpp,
        ppn: totalPpn,
        taxRate,
        isTaxIncluded,
        status: "READY",
        notes: notes.trim() || undefined,
        items: calculatedItems as any,
      };

      const res = await fetch("/api/tax/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isId ? "Gagal membuat faktur pajak" : "Failed to create tax invoice"));
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan faktur pajak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-invoice-modal-title"
        tabIndex={-1}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/50 dark:border dark:border-red-800/60 dark:text-red-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="manual-invoice-modal-title" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {isId ? "Buat Faktur Pajak Baru (Manual)" : "Create Tax Invoice (Manual)"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isId
                  ? "Input faktur pajak keluaran Coretax tanpa Surat Jalan"
                  : "Input manual Coretax sales invoice without delivery order"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isId ? "Tutup form faktur manual" : "Close manual invoice form"}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Dokumen Faktur */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              {isId ? "1. Parameter Dokumen Faktur" : "1. Invoice Document Parameters"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label htmlFor="manual-trx-code" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Kode Transaksi" : "Transaction Code"}
                </label>
                <select
                  id="manual-trx-code"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value as TaxTransactionCode)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                >
                  <option value="01">01 - Penyerahan BKP Umum</option>
                  <option value="02">02 - Pemungut Bendahara</option>
                  <option value="03">03 - Pemungut BUMN</option>
                  <option value="04">04 - DPP Nilai Lain</option>
                  <option value="07">07 - Kawasan Berikat (Tidak Dipungut)</option>
                  <option value="08">08 - Dibebaskan PPN</option>
                </select>
              </div>

              <div>
                <label htmlFor="manual-faktur-num" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Nomor Seri / Draf" : "Invoice Number"}
                </label>
                <input
                  id="manual-faktur-num"
                  type="text"
                  value={nomorFaktur}
                  onChange={(e) => setNomorFaktur(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-ref-num" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Nomor Ref / DO / PO" : "Reference No."}
                </label>
                <input
                  id="manual-ref-num"
                  type="text"
                  placeholder="SJ/EQ/..."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>

              <div>
                <label htmlFor="manual-invoice-date" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Tanggal Faktur" : "Invoice Date"}
                </label>
                <input
                  id="manual-invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => {
                    setInvoiceDate(e.target.value);
                    if (e.target.value) setTaxPeriod(e.target.value.slice(0, 7));
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-tax-period" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Masa Pajak (YYYY-MM)" : "Tax Period"}
                </label>
                <input
                  id="manual-tax-period"
                  type="text"
                  value={taxPeriod}
                  onChange={(e) => setTaxPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-tax-rate" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Tarif PPN" : "VAT Rate"}
                </label>
                <select
                  id="manual-tax-rate"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                >
                  <option value={11}>11% (Standar UU HPP)</option>
                  <option value={12}>12% (Kenaikan Tarif)</option>
                  <option value={0}>0% (Bebas / Ekspor)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Identitas Pembeli */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              {isId ? "2. Identitas Wajib Pajak Pembeli" : "2. Buyer Tax Identity"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label htmlFor="manual-buyer-name" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Nama Pembeli / Perusahaan" : "Buyer Name"}
                </label>
                <input
                  id="manual-buyer-name"
                  type="text"
                  placeholder="PT Bintang Footwear / Bpk. Hendra"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-buyer-npwp" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  NPWP 16 Digit / NIK
                  <span className="text-[10px] text-neutral-500 ml-1">
                    ({cleanTaxDigits(buyerNpwp16).length}/16)
                  </span>
                </label>
                <input
                  id="manual-buyer-npwp"
                  type="text"
                  placeholder="0123456789012345"
                  maxLength={20}
                  value={buyerNpwp16}
                  onChange={(e) => handleNpwpChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-buyer-nitku" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  NITKU 22 Digit
                  <span className="text-[10px] text-neutral-500 ml-1">
                    ({cleanTaxDigits(buyerNitku22).length}/22)
                  </span>
                </label>
                <input
                  id="manual-buyer-nitku"
                  type="text"
                  placeholder="0123456789012345000000"
                  maxLength={26}
                  value={buyerNitku22}
                  onChange={(e) => setBuyerNitku22(cleanTaxDigits(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="manual-buyer-address" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">
                  {isId ? "Alamat Wajib Pajak" : "Tax Address"}
                </label>
                <input
                  id="manual-buyer-address"
                  type="text"
                  placeholder="Jl. Raya Cibaduyut No. 88, Bandung"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rincian BKP (Insole) */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {isId ? "3. Rincian Barang Kena Pajak (BKP)" : "3. Line Items Breakdown"}
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isId ? "Tambah Baris" : "Add Row"}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-lg grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Kode BKP"
                      aria-label={isId ? `Kode BKP baris ${idx + 1}` : `Item code row ${idx + 1}`}
                      value={item.itemCode}
                      onChange={(e) => handleItemChange(item.id, "itemCode", e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Nama Barang (Insole)"
                      aria-label={isId ? `Nama barang baris ${idx + 1}` : `Item name row ${idx + 1}`}
                      value={item.itemName}
                      onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      aria-label={isId ? `Kuantitas baris ${idx + 1}` : `Quantity row ${idx + 1}`}
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs text-right font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Harga"
                      aria-label={isId ? `Harga satuan baris ${idx + 1}` : `Unit price row ${idx + 1}`}
                      min={0}
                      step={500}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded text-neutral-800 dark:text-neutral-200 text-xs text-right font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      aria-label={isId ? `Hapus baris barang ${idx + 1}` : `Delete item row ${idx + 1}`}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Summary */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-600 dark:text-neutral-400">
                {isId ? "Total DPP & PPN Terutang:" : "Total Tax Base & VAT:"}
              </span>
              <div className="flex gap-4">
                <span className="text-neutral-800 dark:text-neutral-300 font-medium">DPP: {formatRupiahTax(totalDpp)}</span>
                <span className="text-red-600 dark:text-red-400 font-bold">PPN: {formatRupiahTax(totalPpn)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs">
            <label htmlFor="manual-notes" className="block text-neutral-700 dark:text-neutral-400 mb-1 font-medium">{isId ? "Catatan / Keterangan" : "Notes"}</label>
            <input
              id="manual-notes"
              type="text"
              placeholder={isId ? "Keterangan opsional faktur..." : "Optional invoice notes..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Faktur" : "Save Invoice"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
