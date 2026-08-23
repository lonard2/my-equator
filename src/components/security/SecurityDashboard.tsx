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
  UserPlus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  LogOut,
  ShieldAlert,
  Sliders,
  ChevronDown,
} from "lucide-react";
import {
  FACTORY_DEMO_ACCOUNTS,
  FactoryUser,
} from "@/lib/auth/types";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  getRoleBadgeInfo,
  canManageUsers,
  canRestoreDatabase,
  canExportDatabase,
} from "@/lib/auth/rbac";
import { formatIndonesianDate } from "@/lib/utils/formatters";

interface SecurityDashboardProps {
  currentUser: FactoryUser;
  onUserChange: (user: FactoryUser) => void;
  onLogout?: () => void;
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

interface ManagedUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: number;
  lastLoginAt?: string | null;
  createdAt: string;
}

export function SecurityDashboard({
  currentUser,
  onUserChange,
  onLogout,
  language,
}: SecurityDashboardProps) {
  const isId = language === "id";
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [userList, setUserList] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("equator2026!");
  const [newRole, setNewRole] = useState<UserRole>("SALES_OPERATOR");
  const [creatingUser, setCreatingUser] = useState(false);

  // RBAC Flags
  const isAdmin = canManageUsers(currentUser.role);
  const canExport = canExportDatabase(currentUser.role);
  const canRestore = canRestoreDatabase(currentUser.role);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": currentUser.role,
    "x-user-id": currentUser.id,
    "x-user-name": currentUser.name,
  });

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/security/users");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserList(json.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Hanya Super Admin yang dapat menambahkan pengguna baru." : "Access denied: Only Super Admin can add new users.",
      });
      return;
    }

    if (!newUsername.trim() || !newName.trim() || !newEmail.trim() || !newPassword) {
      setActionFeedback({
        type: "error",
        message: isId ? "Mohon lengkapi semua bidang isian pengguna." : "Please fill in all required fields.",
      });
      return;
    }

    setCreatingUser(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/security/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddUserOpen(false);
        setNewUsername("");
        setNewName("");
        setNewEmail("");
        setActionFeedback({
          type: "success",
          message: isId ? `Pengguna @${newUsername} (${newRole}) berhasil ditambahkan.` : `User @${newUsername} (${newRole}) successfully created.`,
        });
        fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal membuat pengguna." });
      }
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Gagal membuat pengguna." });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (user: ManagedUser, newSelectedRole: UserRole) => {
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Hanya Super Admin yang berwenang mengubah peran pengguna." : "Access denied: Only Super Admin can change user roles.",
      });
      return;
    }

    if (user.username === "superadmin" && newSelectedRole !== "SUPER_ADMIN") {
      setActionFeedback({
        type: "error",
        message: isId ? "Peran akun Super Admin utama tidak dapat diubah." : "Primary Super Admin role cannot be demoted.",
      });
      return;
    }

    setActionFeedback(null);
    try {
      const res = await fetch(`/api/security/users/${user.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newSelectedRole }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: isId
            ? `Peran ${user.name} (@${user.username}) berhasil diubah menjadi ${newSelectedRole}.`
            : `Role for ${user.name} (@${user.username}) updated to ${newSelectedRole}.`,
        });
        fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal memperbarui peran pengguna." });
      }
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Hanya Super Admin yang dapat menghapus akun pengguna." : "Access denied: Only Super Admin can delete users.",
      });
      return;
    }

    if (!confirm(isId ? `Apakah Anda yakin ingin menghapus akun pengguna @${username}?` : `Are you sure you want to delete user @${username}?`)) return;

    setActionFeedback(null);
    try {
      const res = await fetch(`/api/security/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: isId ? `Pengguna @${username} berhasil dihapus.` : `User @${username} deleted successfully.`,
        });
        fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal menghapus user." });
      }
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message });
    }
  };

  const handleToggleUserActive = async (user: ManagedUser) => {
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Hanya Super Admin yang dapat mengaktifkan/menonaktifkan akun." : "Access denied: Only Super Admin can toggle user status.",
      });
      return;
    }

    if (user.username === "superadmin" && user.isActive === 1) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akun Super Admin utama tidak dapat dinonaktifkan." : "Primary Super Admin account cannot be deactivated.",
      });
      return;
    }

    setActionFeedback(null);
    try {
      const nextActive = user.isActive === 1 ? 0 : 1;
      const res = await fetch(`/api/security/users/${user.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
        fetchLogs();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal memperbarui status pengguna." });
      }
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message });
    }
  };

  const handleExportSnapshot = async () => {
    if (!canExport) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Izin Super Admin atau Manajer Pabrik diperlukan untuk mengunduh snapshot." : "Access denied: Super Admin or Factory Manager required.",
      });
      return;
    }

    try {
      const res = await fetch("/api/security/snapshot-export", {
        headers: {
          "x-user-role": currentUser.role,
          "x-user-id": currentUser.id,
          "x-user-name": currentUser.name,
        },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Gagal mengunduh snapshot basis data.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Equator_DB_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message });
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canRestore) {
      setActionFeedback({
        type: "error",
        message: isId ? "Akses ditolak: Hanya Super Admin yang berwenang memulihkan snapshot basis data." : "Access denied: Only Super Admin can restore database snapshot.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const confirmRestore = window.confirm(
      isId
        ? "PERINGATAN: Memulihkan snapshot akan memperbarui seluruh data sistem dengan isi file backup. Lanjutkan?"
        : "WARNING: Restoring snapshot will overwrite existing database records. Proceed?"
    );

    if (!confirmRestore) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setRestoring(true);
    setRestoreMessage(null);
    setActionFeedback(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch("/api/security/snapshot-restore", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(jsonData),
      });

      const json = await res.json();
      if (json.success) {
        setRestoreMessage(
          isId
            ? `Berhasil memulihkan ${json.data.restoredCount} rekaman data sistem!`
            : `Successfully restored ${json.data.restoredCount} database records!`
        );
        fetchLogs();
        fetchUsers();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal memulihkan database." });
      }
    } catch (err: any) {
      console.error("Restore failed:", err);
      setActionFeedback({
        type: "error",
        message: isId ? `Format file snapshot tidak valid: ${err.message}` : `Invalid snapshot format: ${err.message}`,
      });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentRoleInfo = getRoleBadgeInfo(currentUser.role, language);
  const activePerms = ROLE_PERMISSIONS[currentUser.role] || [];

  // Filtered Users
  const filteredUsers = userList.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // Filtered Logs
  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide">
              {isId ? "Otorisasi RBAC, Manajemen Akun & Keamanan Data" : "RBAC Security, User Directory & System Backups"}
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Kontrol hak akses 4 peran pabrik, otentikasi PBKDF2, log audit jejak operasional, dan snapshot JSON offline"
                : "Role-based access matrix, PBKDF2 authentication, immutable audit logging, and JSON offline snapshot"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwitchingUser(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:border-[#8B0000] shadow-xs active:scale-95 transition"
          >
            <UserCheck className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Ganti Profil Demo" : "Switch Demo Profile"}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-bold text-[#8B0000] dark:text-red-300 hover:bg-red-100 active:scale-95 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>{isId ? "Keluar" : "Log Out"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Action Feedback Alert */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active User Card & Privileges */}
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop"}
            alt={currentUser.name}
            className="w-13 h-13 rounded-2xl object-cover border-2 border-red-700/20 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                {currentUser.name}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${currentRoleInfo.badgeBg}`}>
                {currentRoleInfo.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">@{currentUser.username} • {currentUser.email}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{currentRoleInfo.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 mr-1 block sm:inline">
            {isId ? "Izin Aktif:" : "Active Permissions:"}
          </span>
          {activePerms.slice(0, 4).map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[9px] font-mono font-bold text-gray-700 dark:text-gray-300"
            >
              {p}
            </span>
          ))}
          {activePerms.length > 4 && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-gray-400">
              +{activePerms.length - 4} {isId ? "lainnya" : "more"}
            </span>
          )}
        </div>
      </div>

      {/* RBAC Role Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"] as UserRole[]).map((role) => {
          const info = getRoleBadgeInfo(role, language);
          const isUserRole = currentUser.role === role;
          const perms = ROLE_PERMISSIONS[role];

          return (
            <div
              key={role}
              className={`p-4 rounded-3xl border transition flex flex-col justify-between space-y-3 ${
                isUserRole
                  ? "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 shadow-xs"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${info.badgeBg}`}>
                    {info.label}
                  </span>
                  {isUserRole && (
                    <span className="text-[9px] font-black uppercase text-[#8B0000] dark:text-red-400 bg-red-100 dark:bg-red-950 px-1.5 py-0.2 rounded">
                      {isId ? "Peran Anda" : "Your Role"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{info.description}</p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider block">
                  {perms.length} {isId ? "Hak Akses Diberikan" : "Granted Permissions"}
                </span>
                <div className="flex flex-wrap gap-1">
                  {perms.slice(0, 3).map((pm) => (
                    <span
                      key={pm}
                      className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-[8px] font-mono text-gray-600 dark:text-gray-400"
                    >
                      {pm}
                    </span>
                  ))}
                  {perms.length > 3 && (
                    <span className="text-[8px] text-gray-400">+{perms.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Factory Users Management CRUD (Scrollable Directory & Role Assignment) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[#8B0000]" />
              <span>{isId ? "Manajemen Akun & Pengguna Pabrik" : "Factory User Management"}</span>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {filteredUsers.length} / {userList.length} {isId ? "Pengguna" : "Users"}
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              {isId
                ? "Daftar pengguna terdaftar di basis data SQLite dengan kata sandi terenkripsi PBKDF2"
                : "Registered factory users stored in SQLite with salted PBKDF2 password hashes"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter for user directory */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder={isId ? "Cari nama, email, username..." : "Search users..."}
                className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:outline-none"
              />
            </div>

            {isAdmin ? (
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#8B0000] text-white text-xs font-bold shadow-xs hover:bg-[#A00000] active:scale-95 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isId ? "+ Tambah Pengguna" : "+ Add User"}</span>
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-[11px] font-semibold border border-gray-200 dark:border-gray-700 cursor-not-allowed"
                title={isId ? "Hanya Super Admin yang berwenang menambah pengguna" : "Super Admin privileges required"}
              >
                <Lock className="h-3 w-3" />
                <span>{isId ? "Izin Super Admin Diperlukan" : "Super Admin Required"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Read-Only Notice for Non-Admins */}
        {!isAdmin && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              {isId
                ? "Anda sedang melihat daftar pengguna dalam mode Baca (Read-Only). Otorisasi penambahan akun, modifikasi status, dan penugasan peran dibatasi khusus untuk Super Admin."
                : "Viewing user directory in Read-Only mode. Adding users, changing status, and assigning roles is restricted to Super Admin."}
            </span>
          </div>
        )}

        {/* User Management Scrollable Table Container */}
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-800 scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="py-2.5 px-3">Pengguna</th>
                <th className="py-2.5 px-3">Username & Email</th>
                <th className="py-2.5 px-3">Peran / Role</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Login Terakhir</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    {isId ? "Tidak ada pengguna yang cocok dengan pencarian." : "No users match your search criteria."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const info = getRoleBadgeInfo(u.role, language);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                            alt={u.name}
                            className="w-7 h-7 rounded-lg object-cover border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white block">{u.name}</span>
                            {u.username === currentUser.username && (
                              <span className="text-[9px] font-bold text-[#8B0000] dark:text-red-400">
                                ({isId ? "Sesi Aktif" : "Current Session"})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-mono text-gray-700 dark:text-gray-300">@{u.username}</p>
                        <p className="text-[10px] text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        {isAdmin && u.username !== "superadmin" ? (
                          <div className="relative inline-block">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                              className={`text-[10px] font-bold uppercase rounded-lg border py-1 pl-2 pr-6 appearance-none bg-white dark:bg-gray-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B0000] ${info.badgeBg}`}
                            >
                              <option value="SUPER_ADMIN">SUPER ADMIN</option>
                              <option value="FACTORY_MANAGER">FACTORY MANAGER</option>
                              <option value="WAREHOUSE_STAFF">WAREHOUSE STAFF</option>
                              <option value="SALES_OPERATOR">SALES OPERATOR</option>
                            </select>
                            <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                          </div>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${info.badgeBg}`}>
                            {info.label}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleUserActive(u)}
                          disabled={!isAdmin || u.username === "superadmin"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition disabled:opacity-50 ${
                            u.isActive === 1
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-500 hover:bg-gray-300"
                          }`}
                          title={!isAdmin ? (isId ? "Izin Super Admin Diperlukan" : "Super Admin Required") : ""}
                        >
                          {u.isActive === 1 ? (isId ? "Aktif" : "Active") : isId ? "Non-Aktif" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-gray-500 font-mono">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isAdmin ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={u.username === "superadmin"}
                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-20 transition"
                            title={u.username === "superadmin" ? (isId ? "Akun Super Admin utama tidak dapat dihapus" : "Primary Super Admin cannot be deleted") : isId ? "Hapus Pengguna" : "Delete User"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-700">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                ? "Simpan seluruh relasi basis data pabrik (Surat Jalan, Stok, CAD, Pengguna, Log Audit) dalam satu file JSON terenkapsulasi"
                : "1-Click complete database bundle export & restore for zero-configuration factory resilience"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSnapshot}
              disabled={!canExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#8B0000] text-white text-xs font-bold shadow-md hover:bg-[#A00000] active:scale-95 transition disabled:opacity-50"
              title={!canExport ? (isId ? "Izin Super Admin / Manajer Diperlukan" : "Admin / Manager Required") : ""}
            >
              <Download className="h-4 w-4" />
              <span>{isId ? "Unduh Backup Snapshot (.json)" : "Download Snapshot (.json)"}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring || !canRestore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs disabled:opacity-50"
              title={!canRestore ? (isId ? "Izin Super Admin Diperlukan" : "Super Admin Required") : ""}
            >
              <Upload className="h-4 w-4 text-[#8B0000]" />
              <span>
                {restoring
                  ? isId ? "Memulihkan..." : "Restoring..."
                  : isId ? "Restore Snapshot (.json)" : "Restore Snapshot"}
              </span>
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
              {isId
                ? "Jejak audit permanen pencatatan login, mutasi inventaris, penerbitan surat jalan, dan perubahan status"
                : "Immutable chronological record of user sessions and critical operational mutations"}
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

        {/* Logs Scrollable Table */}
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-800 scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500">
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
                    <td className="py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">
                      {log.entityType}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Factory User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-bold text-sm">
                  {isId ? "Tambah Pengguna Pabrik Baru" : "Add New Factory User"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    {isId ? "Nama Lengkap *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rian Gunawan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="rian"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-mono font-semibold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rian@equatorinsole.co.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {isId ? "Kata Sandi (Password) *" : "Password *"}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {isId ? "Peran / Role Pabrik *" : "Factory Role *"}
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="SUPER_ADMIN">Super Admin (Owner)</option>
                  <option value="FACTORY_MANAGER">Manajer Pabrik (Production Manager)</option>
                  <option value="WAREHOUSE_STAFF">Staff Gudang (Warehouse Crew)</option>
                  <option value="SALES_OPERATOR">Operator Penjualan (Sales Operator)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {creatingUser ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Pengguna" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Demo User Account Modal */}
      {isSwitchingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {isId ? "Ganti Profil Peran Demo Pabrik" : "Switch Demo Factory Profile"}
                </h3>
                <p className="text-xs text-red-200">
                  {isId
                    ? "Uji coba hak akses otorisasi untuk 4 peran operasional pabrik"
                    : "Test RBAC authorization across 4 distinct factory operational roles"}
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
                      <span>{isId ? "Pilih" : "Select"}</span>
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
