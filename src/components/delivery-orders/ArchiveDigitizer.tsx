"use client";

import React, { useState, useRef } from "react";
import { FootwearSize, SizeBreakdown } from "@/types";
import {
  Keyboard,
  Plus,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";

interface ArchiveDigitizerProps {
  onSuccess: () => void;
  language: "id" | "en";
}

const STANDARD_SIZES: FootwearSize[] = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

interface BatchRow {
  id: string;
  orderNumber: string;
  recipientName: string;
  destinationAddress: string;
  deliveryDate: string;
  articleCode: string;
  articleName: string;
  sizes: SizeBreakdown;
  unitPrice: number;
}

export function ArchiveDigitizer({ onSuccess, language }: ArchiveDigitizerProps) {
  const isId = language === "id";
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [rows, setRows] = useState<BatchRow[]>([
    {
      id: "row-1",
      orderNumber: "SJ/EQ/2026/08/0010",
      recipientName: "PT BINTANG SEPATU CEMERLANG",
      destinationAddress: "Jl. Industri Cimahi No. 45, Bandung",
      deliveryDate: globalDate,
      articleCode: "EQ-ARCH-01",
      articleName: "Insole Ortho High Density EVA",
      sizes: { 38: 50, 39: 100, 40: 150, 41: 150, 42: 100 },
      unitPrice: 19500,
    },
    {
      id: "row-2",
      orderNumber: "SJ/EQ/2026/08/0011",
      recipientName: "CV BANDUNG SNEAKER WORKSHOP",
      destinationAddress: "Jl. Soekarno Hatta No. 200, Bandung",
      deliveryDate: globalDate,
      articleCode: "EQ-RUN-02",
      articleName: "Insole Dynamic Cushion Latex",
      sizes: { 39: 30, 40: 60, 41: 60, 42: 40 },
      unitPrice: 24000,
    },
  ]);

  const handleAddRow = () => {
    const nextIndex = rows.length + 10;
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        orderNumber: `SJ/EQ/2026/08/00${nextIndex}`,
        recipientName: "",
        destinationAddress: "Bandung, Jawa Barat",
        deliveryDate: globalDate,
        articleCode: "EQ-EVA-01",
        articleName: "Insole EVA Footbed",
        sizes: {},
        unitPrice: 18000,
      },
    ]);
  };

  const handleApplyGlobalDate = () => {
    setRows(rows.map((r) => ({ ...r, deliveryDate: globalDate })));
  };

  const handleSizeChange = (rowId: string, size: FootwearSize, value: string) => {
    const num = parseInt(value, 10);
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        const newSizes = { ...row.sizes };
        if (isNaN(num) || num <= 0) {
          delete newSizes[size];
        } else {
          newSizes[size] = num;
        }
        return { ...row, sizes: newSizes };
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  // Grand total calculation
  let totalBatchPairs = 0;
  rows.forEach((row) => {
    Object.values(row.sizes).forEach((qty) => {
      if (typeof qty === "number" && qty > 0) totalBatchPairs += qty;
    });
  });

  const handleSaveBatch = async () => {
    const invalid = rows.find((r) => !r.recipientName.trim());
    if (invalid) {
      alert(isId ? "Mohon isi nama customer untuk semua baris." : "Please fill customer name for all rows.");
      return;
    }

    setLoading(true);
    try {
      for (const row of rows) {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: row.orderNumber,
            recipientName: row.recipientName,
            destinationAddress: row.destinationAddress,
            deliveryDate: row.deliveryDate,
            status: "CONFIRMED",
            notes: "Batch digitized via Archive Quick Digitizer",
            items: [
              {
                articleCode: row.articleCode,
                articleName: row.articleName,
                unitPrice: row.unitPrice,
                sizes: row.sizes,
              },
            ],
          }),
        });
      }

      setSuccessMessage(
        isId
          ? `Sukses mendigitasi ${rows.length} surat jalan (${totalBatchPairs} pasang)!`
          : `Successfully imported ${rows.length} delivery orders!`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert(isId ? "Gagal mendigitasi batch surat jalan." : "Failed to import batch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-[#8B0000] dark:text-red-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isId ? "Archive & Paper Quick Digitizer" : "Archive Quick Digitizer"}
              </h2>
              <p className="text-xs text-gray-500">
                {isId
                  ? "Grid entri data cepat keyboard-first untuk memindahkan arsip slip surat jalan fisik ke sistem."
                  : "Keyboard-first batch grid entry to digitize paper delivery records quickly."}
              </p>
            </div>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {isId ? "Tgl Global:" : "Global Date:"}
            </span>
            <input
              type="date"
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
            />
            <button
              onClick={handleApplyGlobalDate}
              className="ml-1 text-[11px] font-bold text-[#8B0000] dark:text-red-400 hover:underline"
            >
              {isId ? "Terapkan" : "Apply"}
            </button>
          </div>

          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{isId ? "+ Tambah Baris" : "+ Add Row"}</span>
          </button>

          <button
            onClick={handleSaveBatch}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B0000] hover:bg-[#A00000] text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span>
              {loading
                ? isId
                  ? "Menyimpan Batch..."
                  : "Saving..."
                : isId
                ? `Simpan ${rows.length} Surat Jalan`
                : `Commit ${rows.length} Orders`}
            </span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Bulk Entry Spreadsheet Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-2.5 text-center w-8">#</th>
                <th className="p-2.5 text-left w-36">{isId ? "No. Surat Jalan" : "Order No."}</th>
                <th className="p-2.5 text-left w-48">{isId ? "Nama Customer / Pabrik *" : "Customer *"}</th>
                <th className="p-2.5 text-left w-32">{isId ? "Tgl Kirim" : "Date"}</th>
                <th className="p-2.5 text-left w-40">{isId ? "Artikel Insole" : "Article"}</th>
                {STANDARD_SIZES.map((size) => (
                  <th key={size} className="p-1.5 text-center w-10 font-mono bg-red-50/50 dark:bg-red-950/20">
                    {size}
                  </th>
                ))}
                <th className="p-2.5 text-right w-20">{isId ? "Total Psg" : "Total Pairs"}</th>
                <th className="p-2.5 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rows.map((row, index) => {
                let rowPairs = 0;
                Object.values(row.sizes).forEach((qty) => {
                  if (typeof qty === "number" && qty > 0) rowPairs += qty;
                });

                return (
                  <tr key={row.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="p-2.5 text-center text-gray-400 font-mono">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.orderNumber}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, orderNumber: e.target.value } : r))
                          )
                        }
                        className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Nama PT / Toko Sepatu"
                        value={row.recipientName}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, recipientName: e.target.value } : r))
                          )
                        }
                        className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs font-semibold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={row.deliveryDate}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, deliveryDate: e.target.value } : r))
                          )
                        }
                        className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.articleName}
                        onChange={(e) =>
                          setRows(
                            rows.map((r) => (r.id === row.id ? { ...r, articleName: e.target.value } : r))
                          )
                        }
                        className="w-full rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs"
                      />
                    </td>
                    {STANDARD_SIZES.map((size) => {
                      const qty = row.sizes[size] || "";
                      return (
                        <td key={size} className="p-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="-"
                            value={qty}
                            onChange={(e) => handleSizeChange(row.id, size, e.target.value)}
                            className={`w-full text-center rounded border px-1 py-1 text-xs font-mono font-bold transition ${
                              qty && Number(qty) > 0
                                ? "bg-red-50 dark:bg-red-950/60 border-[#8B0000] text-[#8B0000] dark:text-red-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-right font-extrabold text-xs text-[#8B0000] dark:text-red-400">
                      {rowPairs} psg
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold border-t border-gray-300 dark:border-gray-700">
              <tr>
                <td colSpan={5} className="p-3 text-gray-700 dark:text-gray-300 uppercase">
                  {isId ? `Total Batch (${rows.length} Surat Jalan)` : `Batch Total (${rows.length} Orders)`}
                </td>
                {STANDARD_SIZES.map((size) => {
                  const sum = rows.reduce((s, r) => s + (r.sizes[size] || 0), 0);
                  return (
                    <td key={size} className="p-1.5 text-center font-mono text-gray-900 dark:text-white">
                      {sum > 0 ? sum : "-"}
                    </td>
                  );
                })}
                <td className="p-3 text-right text-base text-[#8B0000] dark:text-red-400 font-extrabold">
                  {totalBatchPairs.toLocaleString("id-ID")} psg
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
