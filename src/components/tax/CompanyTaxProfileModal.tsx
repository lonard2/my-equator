"use client";

import React, { useState, useEffect } from "react";
import { CompanyTaxProfile } from "@/types/tax";
import { validateNpwp16, validateNitku22 } from "@/services/tax/taxValidator";
import { formatNpwp16, formatNitku22 } from "@/lib/utils/taxFormatters";
import {
  X,
  Building2,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface CompanyTaxProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  profile: CompanyTaxProfile | null;
  onSaved: () => void;
  userRole?: string;
}

export function CompanyTaxProfileModal({
  isOpen,
  onClose,
  language,
  profile,
  onSaved,
  userRole = "SUPER_ADMIN",
}: CompanyTaxProfileModalProps) {
  const isId = language === "id";

  const [companyName, setCompanyName] = useState("");
  const [npwp16, setNpwp16] = useState("");
  const [nitku22, setNitku22] = useState("");
  const [kppCode, setKppCode] = useState("421");
  const [kppName, setKppName] = useState("KPP Pratama Bandung Cibeunying");
  const [taxAddress, setTaxAddress] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryRole, setSignatoryRole] = useState("Direktur Utama");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || "");
      setNpwp16(profile.npwp16 || "");
      setNitku22(profile.nitku22 || "");
      setKppCode(profile.kppCode || "421");
      setKppName(profile.kppName || "KPP Pratama Bandung Cibeunying");
      setTaxAddress(profile.taxAddress || "");
      setSignatoryName(profile.signatoryName || "");
      setSignatoryRole(profile.signatoryRole || "Direktur Utama");
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const npwpValidation = validateNpwp16(npwp16);
  const nitkuValidation = validateNitku22(nitku22);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npwpValidation.isValid || !nitkuValidation.isValid) {
      setError(
        isId
          ? "NPWP 16 digit dan NITKU 22 digit wajib valid sebelum disimpan."
          : "16-digit NPWP and 22-digit NITKU must be valid before saving."
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/tax/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole,
        },
        body: JSON.stringify({
          companyName,
          npwp16: npwpValidation.cleaned,
          nitku22: nitkuValidation.cleaned,
          kppCode,
          kppName,
          taxAddress,
          signatoryName,
          signatoryRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onSaved();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Gagal menyimpan profil pajak");
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                {isId ? "Profil Pengusaha Kena Pajak (PKP)" : "Taxable Enterprise (PKP) Profile"}
              </h3>
              <p className="text-xs text-neutral-400">
                {isId ? "Data identitas resmi pabrik pada sistem Coretax DJP" : "Official factory tax credentials for DJP Coretax"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isId ? "Profil PKP berhasil diperbarui!" : "PKP profile successfully updated!"}</span>
            </div>
          )}

          {/* Nama Perusahaan */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {isId ? "Nama Perusahaan (PKP Penjual)" : "Company Name (Taxable Entity)"}
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* NPWP 16 Digit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-neutral-300">
                NPWP 16 Digit
              </label>
              <span
                className={`text-[11px] font-mono ${
                  npwpValidation.isValid ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {npwpValidation.isValid ? "Valid (16 Digit)" : npwpValidation.error}
              </span>
            </div>
            <input
              type="text"
              required
              value={npwp16}
              onChange={(e) => setNpwp16(e.target.value)}
              placeholder="0123456789012345"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* NITKU 22 Digit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-neutral-300">
                NITKU 22 Digit (Nomor Identitas Tempat Kegiatan Usaha)
              </label>
              <span
                className={`text-[11px] font-mono ${
                  nitkuValidation.isValid ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {nitkuValidation.isValid ? "Valid (22 Digit)" : nitkuValidation.error}
              </span>
            </div>
            <input
              type="text"
              required
              value={nitku22}
              onChange={(e) => setNitku22(e.target.value)}
              placeholder="0123456789012345000000"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* KPP & Alamat */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Kode KPP
              </label>
              <input
                type="text"
                value={kppCode}
                onChange={(e) => setKppCode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-100 focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Nama Kantor Pelayanan Pajak (KPP)
              </label>
              <input
                type="text"
                value={kppName}
                onChange={(e) => setKppName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {isId ? "Alamat Terdaftar PKP" : "Registered Tax Address"}
            </label>
            <textarea
              rows={2}
              required
              value={taxAddress}
              onChange={(e) => setTaxAddress(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Penandatangan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {isId ? "Nama Penandatangan Faktur" : "Authorized Signer Name"}
              </label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {isId ? "Jabatan Penandatangan" : "Signer Role / Title"}
              </label>
              <input
                type="text"
                required
                value={signatoryRole}
                onChange={(e) => setSignatoryRole(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Footer inside form */}
          <div className="pt-2 flex justify-end gap-2.5 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Profil PKP" : "Save PKP Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
