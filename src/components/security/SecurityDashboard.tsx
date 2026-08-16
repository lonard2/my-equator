"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserRole } from "@/types";
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  UserCheck,
  KeyRound,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  History,
  HardDrive,
  Users,
  Search,
  ArrowRight,
} from "lucide-react";
import {
  FACTORY_DEMO_ACCOUNTS,
  FactoryUser,
} from "@/lib/auth/types";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  getRoleBadgeInfo,
} from "@/lib/auth/rbac";
import { formatIndonesianDate } from "@/lib/utils/formatters";

interface SecurityDashboardProps {
  currentUser: FactoryUser;
  onUserChange: (user: FactoryUser) => void;
  language: "id" | "en";
}

interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  timestamp: string;
}

export function SecurityDashboard({
  currentUser,
  onUserChange,
  language,
}: SecurityDashboardProps) {
  const isId = language === "id";
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/audit-logs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportSnapshot = () => {
    window.location.href = "/api/security/snapshot-export";
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      isId
        ? "PERINGATAN: Memulihkan snapshot akan menggantikan database saat ini dengan data dari file backup. Lanjutkan?"
        : "WARNING: Restoring snapshot will overwrite existing database records. Proceed?"
    );

    if (!confirmRestore) return;

    setRestoring(true);
    setRestoreMessage(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch("/api/security/snapshot-restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });

      const json = await res.json();
      if (json.success) {
        setRestoreMessage(
          isId
            ? `Berhasil memulihkan ${json.data.restoredCount} rekaman data!`
            : `Successfully restored ${json.data.restoredCount} database records!`
        );
        fetchLogs();
      } else {
        alert(json.error || "Gagal memulihkan database.");
      }
    } catch (err: any) {
      console.error("Restore failed:", err);
      alert(isId ? `Format file snapshot tidak valid: ${err.message}` : `Invalid snapshot: ${err.message}`);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentRoleInfo = getRoleBadgeInfo(currentUser.role, language);
  const activePerms = ROLE_PERMISSIONS[currentUser.role] || [];

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide flex items-center gap-2">
              <span>{isId ? "Keamanan, Hak Akses (RBAC) & Audit Trail" : "Security, RBAC & Audit Trails"}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-[10px] font-bold text-[#8B0000] dark:text-red-300">
                Tier-1 Resiliency
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Manajemen hak akses role pabrik, log aktivitas audit, dan snapshot backup offline 1-klik"
                : "Role-based access control, persistent audit trail logs, and 1-click JSON snapshot backups"}
            </p>
          </div>
        </div>

        {/* User Switcher Quick Trigger */}
        <button
          onClick={() => setIsSwitchingUser(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#8B0000] text-white text-xs font-bold shadow-md hover:bg-[#A00000] active:scale-95 transition"
        >
          <Users className="h-4 w-4" />
          <span>{isId ? "Ganti Akun Demo / Switch User" : "Switch User Role"}</span>
        </button>
      </div>

      {/* Active User Profile & Permissions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
              alt={currentUser.name}
              className="w-13 h-13 rounded-2xl object-cover border-2 border-[#8B0000] shadow-sm"
            />
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-white leading-tight">
                {currentUser.name}
              </h3>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${currentRoleInfo.badgeBg}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
            <p className="text-[11px] text-gray-500 font-semibold">{currentRoleInfo.description}</p>
            <p className="text-[10px] text-gray-400 font-mono">
              User ID: {currentUser.id} • Username: @{currentUser.username}
            </p>
          </div>
        </div>

        {/* Active Permissions Matrix */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Matriks Izin & Otorisasi Aktif" : "Active Role Permissions Matrix"}</span>
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              {activePerms.length} Izin Diberikan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { id: "ORDERS_CREATE", label: "Buat & Edit DO" },
              { id: "ORDERS_DISPATCH", label: "Kirim & Ubah Status DO" },
              { id: "ORDERS_PRINT", label: "Cetak Monospace ESC/P" },
              { id: "INVENTORY_MUTATIONS", label: "Catat Mutasi Stok" },
              { id: "CAD_EDIT", label: "Studio CAD & DXF" },
              { id: "CAD_SAVE_BLUEPRINT", label: "Simpan Blueprint CAD" },
              { id: "ANALYTICS_VIEW_FINANCIAL", label: "Lihat Omzet Finansial" },
              { id: "SYSTEM_SNAPSHOT_BACKUP", label: "Ekspor Backup JSON" },
              { id: "SYSTEM_SNAPSHOT_RESTORE", label: "Restore Snapshot DB" },
            ].map((p) => {
              const allowed = hasPermission(currentUser.role, p.id as any);
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border flex items-center gap-2 ${
                    allowed
                      ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 opacity-60"
                  }`}
                >
                  {allowed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  )}
                  <span className="font-semibold truncate text-[11px]">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1-Click Offline Database Snapshot Export & Restore */}
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Ketahanan Offline & Snapshot Backup JSON" : "Offline Resiliency & JSON Snapshot Backup"}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {isId
                ? "Simpan seluruh relasi database pabrik (Surat Jalan, Stok, CAD, Pengguna) dalam satu file JSON terenkapsulasi"
                : "1-Click complete database bundle export & restore for zero-configuration factory resilience"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Snapshot */}
            <button
              onClick={handleExportSnapshot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#8B0000] text-white text-xs font-bold shadow-md hover:bg-[#A00000] active:scale-95 transition"
            >
              <Download className="h-4 w-4" />
              <span>{isId ? "Unduh Backup Snapshot (.json)" : "Download Snapshot (.json)"}</span>
            </button>

            {/* Restore Snapshot */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs disabled:opacity-50"
            >
              <Upload className="h-4 w-4 text-[#8B0000]" />
              <span>{restoring ? (isId ? "Memulihkan..." : "Restoring...") : isId ? "Restore Snapshot (.json)" : "Restore Snapshot"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </div>
        </div>

        {restoreMessage && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{restoreMessage}</span>
          </div>
        )}
      </div>

      {/* Real-Time Factory Security Audit Trail Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <History className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Log Audit Aktivitas & Jejak Operasional" : "Factory Audit Trail & Security Logs"}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {isId ? "Jejak audit permanen pencatatan login, mutasi, pembuatan DO, dan perubahan status" : "Immutable chronological record of user sessions and critical operational mutations"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder={isId ? "Cari log audit..." : "Search logs..."}
                className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#8B0000] active:scale-95 transition shadow-xs"
              title="Refresh Logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Pengguna</th>
                <th className="py-2.5 px-3">Aksi</th>
                <th className="py-2.5 px-3">Modul</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    {isId ? "Belum ada catatan aktivitas audit." : "No audit trail records found."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="py-2 px-3 font-mono text-[11px] text-gray-500">
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-gray-900 dark:text-white block">
                        {log.userName}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">
                      {log.entityType}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Switch Demo User Account Modal */}
      {isSwitchingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ganti Akun Demo Pabrik</h3>
                <p className="text-xs text-red-200">
                  Uji coba hak akses otorisasi untuk 4 peran operasional pabrik
                </p>
              </div>
              <button
                onClick={() => setIsSwitchingUser(false)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
              {FACTORY_DEMO_ACCOUNTS.map((acc) => {
                const info = getRoleBadgeInfo(acc.role, language);
                const isSelected = currentUser.id === acc.id;

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onUserChange({
                        id: acc.id,
                        username: acc.username,
                        name: acc.name,
                        email: acc.email,
                        role: acc.role,
                        avatarUrl: acc.avatarUrl,
                        isActive: 1,
                      });
                      setIsSwitchingUser(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition active:scale-[0.98] ${
                      isSelected
                        ? "border-[#8B0000] bg-red-50/50 dark:bg-red-950/30 shadow-xs"
                        : "border-gray-200 dark:border-gray-800 hover:border-red-200 bg-white dark:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-11 h-11 rounded-xl object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {acc.name}
                          </p>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${info.badgeBg}`}>
                            {info.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">@{acc.username} • {acc.email}</p>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs flex items-center gap-1">
                      <span>Pilih</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
