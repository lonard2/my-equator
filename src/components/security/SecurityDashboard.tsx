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
  Info,
  Sparkles,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  FACTORY_DEMO_ACCOUNTS,
  FactoryUser,
} from "@/lib/auth/types";
import {
  ALL_PERMISSIONS,
  PERMISSION_METADATA,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  getRoleBadgeInfo,
  canManageUsers,
  canRestoreDatabase,
  canExportDatabase,
  getEffectiveRolePermissions,
  setCustomRolePermissions,
  resetRolePermissions,
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

const PERMISSION_GROUPS: {
  category: string;
  label: { id: string; en: string };
  perms: Permission[];
}[] = [
  {
    category: "DELIVERY_ORDERS",
    label: { id: "Surat Jalan & Logistik", en: "Delivery Orders & Logistics" },
    perms: ["ORDERS_VIEW", "ORDERS_CREATE", "ORDERS_EDIT", "ORDERS_DELETE", "ORDERS_DISPATCH", "ORDERS_PRINT"],
  },
  {
    category: "INVENTORY",
    label: { id: "Inventori & Bahan Baku", en: "Materials & Stock Inventory" },
    perms: ["INVENTORY_VIEW", "INVENTORY_MANAGE_STOCK", "INVENTORY_MUTATIONS"],
  },
  {
    category: "CAD_STUDIO",
    label: { id: "CAD Insole & Desain Vektor", en: "Insole CAD & Vector Studio" },
    perms: ["CAD_VIEW", "CAD_EDIT", "CAD_EXPORT", "CAD_SAVE_BLUEPRINT"],
  },
  {
    category: "ANALYTICS",
    label: { id: "Analisis Bisnis & Finansial", en: "Business & Financial Analytics" },
    perms: ["ANALYTICS_VIEW_FINANCIAL", "ANALYTICS_VIEW_OPERATIONAL", "ANALYTICS_EXPORT"],
  },
  {
    category: "SECURITY",
    label: { id: "Keamanan Sistem & Basis Data", en: "System Security & Database" },
    perms: ["SYSTEM_SNAPSHOT_BACKUP", "SYSTEM_SNAPSHOT_RESTORE", "SYSTEM_USER_MANAGEMENT", "SYSTEM_AUDIT_LOGS"],
  },
];

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
  const [logEntityTypeFilter, setLogEntityTypeFilter] = useState<"ALL" | "DELIVERY_ORDER" | "INVENTORY" | "USER" | "SECURITY" | "CAD">("ALL");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exportingSnapshot, setExportingSnapshot] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  // Snapshot Pre-Flight Inspection Modal State
  const [snapshotPreFlight, setSnapshotPreFlight] = useState<{
    isOpen: boolean;
    fileData: any;
    summary: {
      exportDate: string;
      schemaVersion: string;
      ordersCount: number;
      itemsCount: number;
      materialsCount: number;
      movementsCount: number;
      usersCount: number;
      blueprintsCount: number;
      totalRecords: number;
    };
  } | null>(null);

  // Helper for SVG Initials Avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("equator2026!");
  const [newRole, setNewRole] = useState<UserRole>("SALES_OPERATOR");
  const [creatingUser, setCreatingUser] = useState(false);

  // Dynamic Role Permissions & Permission Inspector
  const [inspectedPermission, setInspectedPermission] = useState<Permission | null>(null);
  const [selectedCustomRole, setSelectedCustomRole] = useState<UserRole>("FACTORY_MANAGER");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [rolePermsState, setRolePermsState] = useState<Record<UserRole, Permission[]>>({
    SUPER_ADMIN: getEffectiveRolePermissions("SUPER_ADMIN"),
    FACTORY_MANAGER: getEffectiveRolePermissions("FACTORY_MANAGER"),
    WAREHOUSE_STAFF: getEffectiveRolePermissions("WAREHOUSE_STAFF"),
    SALES_OPERATOR: getEffectiveRolePermissions("SALES_OPERATOR"),
  });

  const handleTogglePermission = (role: UserRole, perm: Permission) => {
    const current = rolePermsState[role] || [];
    const hasIt = current.includes(perm);
    const updated = hasIt ? current.filter((p) => p !== perm) : [...current, perm];
    setRolePermsState((prev) => ({
      ...prev,
      [role]: updated,
    }));
  };

  const handleSaveCustomRolePermissions = () => {
    const updatedPerms = rolePermsState[selectedCustomRole] || [];
    setCustomRolePermissions(selectedCustomRole, updatedPerms);
    setActionFeedback({
      type: "success",
      message: isId
        ? `Hak akses untuk peran ${getRoleBadgeInfo(selectedCustomRole, language).label} berhasil diperbarui.`
        : `Permissions for role ${getRoleBadgeInfo(selectedCustomRole, language).label} updated successfully.`,
    });
  };

  const handleResetCustomRolePermissions = () => {
    resetRolePermissions(selectedCustomRole);
    setRolePermsState((prev) => ({
      ...prev,
      [selectedCustomRole]: getEffectiveRolePermissions(selectedCustomRole),
    }));
    setActionFeedback({
      type: "success",
      message: isId
        ? `Hak akses untuk peran ${getRoleBadgeInfo(selectedCustomRole, language).label} dikembalikan ke pengaturan default pabrik.`
        : `Permissions for role ${getRoleBadgeInfo(selectedCustomRole, language).label} reset to factory defaults.`,
    });
  };

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

    setConfirmModal({
      isOpen: true,
      title: isId ? "Hapus Akun Pengguna" : "Delete User Account",
      message: isId
        ? `Apakah Anda yakin ingin menghapus akun pengguna @${username}? Akun dan riwayat sesi pengguna ini akan dihapus secara permanen.`
        : `Are you sure you want to delete user @${username}? This account and its session history will be permanently deleted.`,
      confirmLabel: isId ? "Hapus Pengguna" : "Delete User",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(null);
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
      },
    });
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
      setExportingSnapshot(true);
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
      setActionFeedback({
        type: "success",
        message: isId ? "Snapshot basis data pabrik berhasil diunduh." : "Database snapshot downloaded successfully.",
      });
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message });
    } finally {
      setExportingSnapshot(false);
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

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const tables = jsonData.tables || jsonData;
      const ordersCount = Array.isArray(tables.deliveryOrders) ? tables.deliveryOrders.length : 0;
      const itemsCount = Array.isArray(tables.deliveryOrderItems) ? tables.deliveryOrderItems.length : 0;
      const materialsCount = Array.isArray(tables.materials) ? tables.materials.length : 0;
      const movementsCount = Array.isArray(tables.inventoryMovements) ? tables.inventoryMovements.length : 0;
      const usersCount = Array.isArray(tables.users) ? tables.users.length : 0;
      const blueprintsCount = Array.isArray(tables.cadBlueprints) ? tables.cadBlueprints.length : 0;
      const totalRecords = ordersCount + itemsCount + materialsCount + movementsCount + usersCount + blueprintsCount;

      setSnapshotPreFlight({
        isOpen: true,
        fileData: jsonData,
        summary: {
          exportDate: jsonData.exportedAt || jsonData.timestamp || new Date().toISOString(),
          schemaVersion: jsonData.version || "1.0",
          ordersCount,
          itemsCount,
          materialsCount,
          movementsCount,
          usersCount,
          blueprintsCount,
          totalRecords,
        },
      });
    } catch (err: any) {
      console.error("Failed to parse snapshot file:", err);
      setActionFeedback({
        type: "error",
        message: isId ? `Format file snapshot tidak valid: ${err.message}` : `Invalid snapshot format: ${err.message}`,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExecuteRestore = async () => {
    if (!snapshotPreFlight?.fileData) return;

    setRestoring(true);
    setRestoreMessage(null);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/security/snapshot-restore", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(snapshotPreFlight.fileData),
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
        setSnapshotPreFlight(null);
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal memulihkan database." });
      }
    } catch (err: any) {
      console.error("Restore failed:", err);
      setActionFeedback({
        type: "error",
        message: isId ? `Gagal memulihkan database: ${err.message}` : `Failed to restore database: ${err.message}`,
      });
    } finally {
      setRestoring(false);
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
  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.userName.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(logFilter.toLowerCase()));

    const matchesEntity =
      logEntityTypeFilter === "ALL" ||
      l.entityType === logEntityTypeFilter ||
      (logEntityTypeFilter === "DELIVERY_ORDER" && l.entityType === "DELIVERY_ORDERS") ||
      (logEntityTypeFilter === "CAD" && l.entityType === "CAD_STUDIO");

    return matchesSearch && matchesEntity;
  });

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
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-13 h-13 rounded-2xl object-cover border-2 border-red-700/20 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-13 h-13 rounded-2xl bg-[#8B0000] text-white flex items-center justify-center font-bold font-mono text-base border-2 border-red-700/20 shadow-xs shrink-0">
              {getInitials(currentUser.name)}
            </div>
          )}
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
            {isId ? "Izin Aktif (Klik untuk detail):" : "Active Permissions (Click for info):"}
          </span>
          {activePerms.slice(0, 5).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInspectedPermission(p as Permission)}
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[9px] font-mono font-bold text-gray-700 dark:text-gray-300 hover:border-[#8B0000] hover:text-[#8B0000] transition flex items-center gap-1 shadow-2xs cursor-pointer"
              title={isId ? "Klik untuk melihat detail hak akses" : "Click to view permission details"}
            >
              <span>{p}</span>
              <Info className="h-2.5 w-2.5 opacity-60" />
            </button>
          ))}
          {activePerms.length > 5 && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-gray-400">
              +{activePerms.length - 5} {isId ? "lainnya" : "more"}
            </span>
          )}
        </div>
      </div>

      {/* RBAC Header & Customizer Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div>
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#8B0000]" />
            <span>{isId ? "Matriks Hak Akses Peran Pabrik" : "Factory Role Permission Matrix"}</span>
          </h3>
          <p className="text-xs text-gray-500">
            {isId
              ? "Klik tag izin manapun untuk melihat detail (apa, siapa, dampak operasional, tingkat risiko)"
              : "Click any permission tag to view its details (what, who, operational impact, risk tier)"}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isCustomizerOpen
                ? "bg-[#8B0000] text-white"
                : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isId ? "Kustomisasi Hak Akses Peran" : "Customize Role Permissions"}</span>
          </button>
        )}
      </div>

      {/* RBAC Role Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"] as UserRole[]).map((role) => {
          const info = getRoleBadgeInfo(role, language);
          const isUserRole = currentUser.role === role;
          const perms = rolePermsState[role] || [];

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

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider block">
                    {perms.length} {isId ? "Hak Akses Aktif" : "Active Permissions"}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomRole(role);
                        setIsCustomizerOpen(true);
                      }}
                      className="text-[9px] font-bold text-[#8B0000] dark:text-red-400 hover:underline"
                    >
                      {isId ? "Ubah" : "Edit"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {perms.slice(0, 4).map((pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setInspectedPermission(pm as Permission)}
                      className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[9px] font-mono text-gray-700 dark:text-gray-300 hover:text-[#8B0000] dark:hover:text-red-300 transition cursor-pointer"
                      title={isId ? "Klik untuk melihat detail hak akses" : "Click to inspect permission"}
                    >
                      {pm}
                    </button>
                  ))}
                  {perms.length > 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomRole(role);
                        setIsCustomizerOpen(true);
                      }}
                      className="text-[9px] font-bold text-gray-400 hover:text-gray-600"
                    >
                      +{perms.length - 4}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permission Customizer Panel (Super Admin Exclusive) */}
      {isCustomizerOpen && isAdmin && (
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border-2 border-[#8B0000]/30 shadow-md space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#8B0000] dark:text-red-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {isId ? "Kustomisasi Hak Akses & Wewenang Peran" : "Customize Role Permissions & Authority"}
                </h4>
                <p className="text-xs text-gray-500">
                  {isId
                    ? "Pilih peran dan centang hak akses yang diizinkan untuk operasional pabrik"
                    : "Select a role and toggle granted actions for factory operations"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCustomRolePermissions}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
                <span>{isId ? "Reset ke Standar" : "Reset to Default"}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCustomRolePermissions}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs hover:bg-[#A00000]"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isId ? "Simpan Hak Akses" : "Save Permissions"}</span>
              </button>
            </div>
          </div>

          {/* Role Tab Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {(["SUPER_ADMIN", "FACTORY_MANAGER", "WAREHOUSE_STAFF", "SALES_OPERATOR"] as UserRole[]).map((role) => {
              const info = getRoleBadgeInfo(role, language);
              const isSelected = selectedCustomRole === role;
              const permsCount = (rolePermsState[role] || []).length;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedCustomRole(role)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#8B0000] text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{info.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}>
                    {permsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Categorized Permission Checkbox Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {PERMISSION_GROUPS.map((group) => {
              const activeCountInGroup = group.perms.filter((p) =>
                (rolePermsState[selectedCustomRole] || []).includes(p)
              ).length;

              return (
                <div
                  key={group.category}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <h5 className="font-extrabold text-xs text-gray-900 dark:text-white">
                      {isId ? group.label.id : group.label.en}
                    </h5>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {activeCountInGroup}/{group.perms.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.perms.map((perm) => {
                      const meta = PERMISSION_METADATA[perm];
                      const isChecked = (rolePermsState[selectedCustomRole] || []).includes(perm);

                      return (
                        <div
                          key={perm}
                          className={`p-2 rounded-xl border transition flex items-start justify-between gap-2 ${
                            isChecked
                              ? "bg-white dark:bg-gray-900 border-red-200 dark:border-red-950"
                              : "bg-gray-100/60 dark:bg-gray-800/40 border-transparent opacity-60"
                          }`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(selectedCustomRole, perm)}
                              className="mt-0.5 h-3.5 w-3.5 rounded text-[#8B0000] focus:ring-[#8B0000]"
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                {isId ? meta.nameId : meta.nameEn}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">{perm}</p>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={() => setInspectedPermission(perm)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#8B0000] transition shrink-0"
                            title={isId ? "Lihat detail izin" : "Inspect permission"}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-7 h-7 rounded-lg object-cover border shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/80 text-[#8B0000] dark:text-red-300 flex items-center justify-center font-bold font-mono text-[10px] shrink-0 border border-red-200 dark:border-red-900/60">
                              {getInitials(u.name)}
                            </div>
                          )}
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
              disabled={!canExport || exportingSnapshot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#8B0000] text-white text-xs font-bold shadow-md hover:bg-[#A00000] active:scale-95 transition disabled:opacity-50"
              title={!canExport ? (isId ? "Izin Super Admin / Manajer Diperlukan" : "Admin / Manager Required") : ""}
            >
              {exportingSnapshot ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>
                {exportingSnapshot
                  ? isId ? "Mengunduh Snapshot..." : "Downloading..."
                  : isId ? "Unduh Backup Snapshot (.json)" : "Download Snapshot (.json)"}
              </span>
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

        {/* Entity Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { key: "ALL", label: isId ? "Semua Entitas" : "All Entities" },
            { key: "DELIVERY_ORDER", label: isId ? "Surat Jalan" : "Delivery Orders" },
            { key: "INVENTORY", label: isId ? "Inventori" : "Inventory" },
            { key: "USER", label: isId ? "Pengguna" : "Users" },
            { key: "CAD", label: isId ? "CAD Insole" : "CAD Studio" },
            { key: "SECURITY", label: isId ? "Sistem & Keamanan" : "Security" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setLogEntityTypeFilter(f.key as any)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                logEntityTypeFilter === f.key
                  ? "bg-[#8B0000] text-white shadow-xs"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
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
                  <label htmlFor="new-user-fullname" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    {isId ? "Nama Lengkap *" : "Full Name *"}
                  </label>
                  <input
                    id="new-user-fullname"
                    type="text"
                    required
                    placeholder="Rian Gunawan"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-user-username" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Username *</label>
                  <input
                    id="new-user-username"
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
                <label htmlFor="new-user-email" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Email *</label>
                <input
                  id="new-user-email"
                  type="email"
                  required
                  placeholder="rian@equatorinsole.co.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-user-password" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {isId ? "Kata Sandi (Password) *" : "Password *"}
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-user-role" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  {isId ? "Peran / Role Pabrik *" : "Factory Role *"}
                </label>
                <select
                  id="new-user-role"
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

      {/* Permission Detail Inspector Pop-up Modal */}
      {inspectedPermission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    {isId
                      ? PERMISSION_METADATA[inspectedPermission].nameId
                      : PERMISSION_METADATA[inspectedPermission].nameEn}
                  </h3>
                  <p className="text-[10px] font-mono text-red-200">{inspectedPermission}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedPermission(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  PERMISSION_METADATA[inspectedPermission].securityTier === "CRITICAL"
                    ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300"
                    : PERMISSION_METADATA[inspectedPermission].securityTier === "RESTRICTED"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300"
                }`}>
                  {isId ? "Tingkat Keamanan: " : "Security Tier: "}
                  {PERMISSION_METADATA[inspectedPermission].securityTier}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {isId
                    ? PERMISSION_METADATA[inspectedPermission].categoryLabelId
                    : PERMISSION_METADATA[inspectedPermission].categoryLabelEn}
                </span>
              </div>

              {/* Detail 1: What it does */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B0000] dark:text-red-400">
                  {isId ? "1. Apa yang Dilakukan (Fungsi & Hak Akses)" : "1. What It Does (Function & Scope)"}
                </p>
                <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {isId
                    ? PERMISSION_METADATA[inspectedPermission].descriptionId
                    : PERMISSION_METADATA[inspectedPermission].descriptionEn}
                </p>
              </div>

              {/* Detail 2: Who can do it */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B0000] dark:text-red-400">
                  {isId ? "2. Peran Standar Berwenang (Default Roles)" : "2. Authorized Roles (Default Configuration)"}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PERMISSION_METADATA[inspectedPermission].defaultRoles.map((r) => {
                    const badge = getRoleBadgeInfo(r, language);
                    return (
                      <span
                        key={r}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badge.badgeBg}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Detail 3: Operational Effect */}
              <div className="p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-900 dark:text-red-300">
                  {isId ? "3. Dampak Operasional Pabrik" : "3. Factory Operational Impact"}
                </p>
                <p className="text-xs text-red-950 dark:text-red-200 leading-relaxed">
                  {isId
                    ? PERMISSION_METADATA[inspectedPermission].effectId
                    : PERMISSION_METADATA[inspectedPermission].effectEn}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedPermission(null)}
                className="px-4 py-1.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold shadow-xs hover:bg-[#A00000] transition"
              >
                {isId ? "Tutup Inspector" : "Close Inspector"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-bold text-sm">{confirmModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-xs transition ${
                    confirmModal.isDestructive
                      ? "bg-[#8B0000] hover:bg-[#A00000]"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Pre-Flight Inspection & Verification Modal */}
      {snapshotPreFlight && snapshotPreFlight.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#8B0000] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="h-5 w-5" />
                <div>
                  <h3 className="font-bold text-sm">
                    {isId ? "Verifikasi Pra-Pemulihan Snapshot Basis Data" : "Database Snapshot Pre-Flight Verification"}
                  </h3>
                  <p className="text-[10px] text-red-200 font-mono">
                    Schema v{snapshotPreFlight.summary.schemaVersion} • {new Date(snapshotPreFlight.summary.exportDate).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSnapshotPreFlight(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{isId ? "Peringatan Tindakan Kritis" : "Critical Action Warning"}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isId
                    ? "Memulihkan snapshot akan menimpa seluruh rekaman database pabrik saat ini dengan isi file backup ini. Pastikan Anda telah membuat cadangan snapshot terbaru sebelum melanjutkan."
                    : "Restoring this snapshot will overwrite all existing factory database records with the contents of this backup file. Ensure you have exported a current snapshot before proceeding."}
                </p>
              </div>

              {/* Table Breakdown Grid */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  {isId ? "Ringkasan Rekaman Data dalam Snapshot" : "Snapshot Data Records Breakdown"}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Surat Jalan" : "Delivery Orders"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.ordersCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Item Baris DO" : "Order Items"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.itemsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Bahan Baku" : "Materials"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.materialsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Mutasi Stok" : "Movements"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.movementsCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Pengguna" : "Users"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.usersCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Blueprint CAD" : "Blueprints"}</span>
                    <span className="text-base font-black font-mono text-gray-900 dark:text-white">{snapshotPreFlight.summary.blueprintsCount}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-300">{isId ? "Total Keseluruhan Rekaman:" : "Total Records:"}</span>
                  <span className="font-mono text-[#8B0000] dark:text-red-400 text-sm">{snapshotPreFlight.summary.totalRecords} entitas</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSnapshotPreFlight(null)}
                disabled={restoring}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring}
                className="px-4 py-1.5 rounded-xl bg-[#8B0000] hover:bg-[#A00000] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {restoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                <span>{restoring ? (isId ? "Memulihkan Data..." : "Restoring Data...") : isId ? "Pulihkan Basis Data Sekarang" : "Restore Database Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
