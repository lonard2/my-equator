"use client";

import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft, Search, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 bg-factory-grid relative selection:bg-red-900 selection:text-white">
      {/* Precision Frame Container */}
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-tactile-card relative z-10">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <Compass className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-xs leading-none text-gray-900 dark:text-white">
                MyEquator Factory ERP
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Equator Insole • Bandung, Jawa Barat
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wider bg-red-100 dark:bg-red-950/60 text-brand dark:text-red-300 border border-red-200 dark:border-red-900/60">
            KODE 404
          </span>
        </div>

        {/* Hero Visual & Error Context */}
        <div className="py-6 sm:py-8 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
            <FileQuestion className="h-7 w-7 stroke-[1.75]" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Pola atau Berkas Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
            Halaman, modul kerja, atau nomor dokumen surat jalan yang Anda tuju tidak terdaftar pada direktori operasional pabrik MyEquator.
          </p>

          {/* Industrial Terminal Telemetry Box */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 font-mono text-[11px] text-left text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">STATUS:</span>
              <span className="text-red-700 dark:text-red-400 font-bold">404 NOT FOUND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SUBSYSTEM:</span>
              <span>ROUTER_DISPATCH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">LOCATION:</span>
              <span>BANDUNG_FACTORY_FLOOR</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-brand hover:bg-brand-strong text-white font-bold text-xs transition active:scale-[0.98] shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda Pabrik</span>
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs transition active:scale-[0.98]"
          >
            <Search className="h-4 w-4 text-gray-500" />
            <span>Periksa Modul</span>
          </Link>
        </div>
      </div>

      {/* Footer System Stamp */}
      <p className="mt-6 text-[11px] font-mono text-gray-400 dark:text-gray-500">
        MyEquator Insole System • Precision Footwear Manufacturing • v2.4.0
      </p>
    </div>
  );
}
