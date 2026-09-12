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
  LogOut,
  ShieldAlert,
  Sliders,
  ChevronDown,
  Info,
  Check,
  RotateCcw,
  X,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Shield,
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
import { Avatar } from "@/components/common/Avatar";
import { useModalSafety } from "@/lib/utils/useModalSafety";

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

export type SecurityTab = "USERS" | "ROLES" | "AUDIT" | "BACKUP";

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
  const [activeTab, setActiveTab] = useState<SecurityTab>("USERS");

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

  // Reset Password Modal State
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    user: ManagedUser | null;
  } | null>(null);

  // Role Change Confirmation Modal State (Truth Gate)
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{
    isOpen: boolean;
    user: ManagedUser;
    newRole: UserRole;
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

  // Truth-Gate Role Change Initiation
  const handlePromptRoleChange = (user: ManagedUser, newSelectedRole: UserRole) => {
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId
          ? "Akses ditolak: Hanya Super Admin yang berwenang mengubah peran pengguna."
          : "Access denied: Only Super Admin can change user roles.",
      });
      return;
    }

    if (user.username === "superadmin" && newSelectedRole !== "SUPER_ADMIN") {
      setActionFeedback({
        type: "error",
        message: isId
          ? "Peran akun Super Admin utama tidak dapat diubah."
          : "Primary Super Admin role cannot be demoted.",
      });
      return;
    }

    // Self-demotion guard
    if (user.username === currentUser.username && newSelectedRole !== "SUPER_ADMIN") {
      setActionFeedback({
        type: "error",
        message: isId
          ? "Anda tidak dapat mendemosikan peran akun Anda sendiri yang sedang aktif."
          : "You cannot demote your own active account role.",
      });
      return;
    }

    if (user.role === newSelectedRole) return;

    setRoleChangeConfirm({
      isOpen: true,
      user,
      newRole: newSelectedRole,
    });
  };

  // Truth-Gate Role Change Execution
  const handleExecuteRoleChange = async () => {
    if (!roleChangeConfirm) return;
    const { user, newRole } = roleChangeConfirm;
    setRoleChangeConfirm(null);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/security/users/${user.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: isId
            ? `Peran ${user.name} (@${user.username}) berhasil diubah menjadi ${newRole}.`
            : `Role for ${user.name} (@${user.username}) updated to ${newRole}.`,
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

  // Password Reset Initiation
  const handleOpenResetPassword = (user: ManagedUser) => {
    if (!isAdmin) {
      setActionFeedback({
        type: "error",
        message: isId
          ? "Akses ditolak: Hanya Super Admin yang dapat mereset kata sandi."
          : "Access denied: Only Super Admin can reset user passwords.",
      });
      return;
    }
    setResetPasswordModal({ isOpen: true, user });
  };

  // Password Reset Execution
  const handleExecuteResetPassword = async (newPass: string) => {
    if (!resetPasswordModal?.user) return;
    const user = resetPasswordModal.user;
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/security/users/${user.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPass }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: isId
            ? `Kata sandi untuk pengguna @${user.username} (${user.name}) berhasil diperbarui.`
            : `Password for user @${user.username} (${user.name}) updated successfully.`,
        });
        setResetPasswordModal(null);
        fetchLogs();
      } else {
        setActionFeedback({ type: "error", message: json.error || "Gagal mereset kata sandi." });
      }
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Gagal mereset kata sandi." });
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

    if (username === currentUser.username) {
      setActionFeedback({
        type: "error",
        message: isId ? "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." : "You cannot delete your own active session account.",
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

    // Self-deactivation guard
    if (user.username === currentUser.username && user.isActive === 1) {
      setActionFeedback({
        type: "error",
        message: isId ? "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif." : "You cannot deactivate your own active session account.",
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
        setActionFeedback({
          type: "success",
          message: isId
            ? `Status pengguna @${user.username} (${user.name}) berhasil diubah menjadi ${nextActive === 1 ? "Aktif" : "Nonaktif"}.`
            : `User @${user.username} (${user.name}) status updated to ${nextActive === 1 ? "Active" : "Inactive"}.`,
        });
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

  // Auto-backup safeguard before executing restore
  const handleExecuteRestore = async () => {
    if (!snapshotPreFlight?.fileData) return;

    setRestoring(true);
    setRestoreMessage(null);
    setActionFeedback(null);

    try {
      // 1. Trigger automatic safety backup export prior to destructive restore
      try {
        const backupRes = await fetch("/api/security/snapshot-export", {
          headers: {
            "x-user-role": currentUser.role,
            "x-user-id": currentUser.id,
            "x-user-name": currentUser.name,
          },
        });
        if (backupRes.ok) {
          const backupBlob = await backupRes.blob();
          const backupUrl = window.URL.createObjectURL(backupBlob);
          const backupA = document.createElement("a");
          backupA.href = backupUrl;
          backupA.download = `Equator_AutoBackup_Before_Restore_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.json`;
          backupA.click();
          window.URL.revokeObjectURL(backupUrl);
        }
      } catch (backupErr) {
        console.warn("Pre-restore auto-backup export failed:", backupErr);
      }

      // 2. Perform restore
      const res = await fetch("/api/security/snapshot-restore", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(snapshotPreFlight.fileData),
      });

      const json = await res.json();
      if (json.success) {
        setRestoreMessage(
          isId
            ? `Berhasil memulihkan ${json.data.restoredCount} rekaman data sistem! (Cadangan darurat otomatis telah diunduh)`
            : `Successfully restored ${json.data.restoredCount} database records! (Pre-restore safety backup was auto-downloaded)`
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

  // Export Audit Logs as RFC-4180 CSV
  const handleExportAuditLogsCSV = () => {
    if (!filteredLogs.length) return;
    const headers = [
      isId ? "ID" : "ID",
      isId ? "Waktu" : "Timestamp",
      isId ? "Pengguna" : "User",
      isId ? "Peran" : "Role",
      isId ? "Aksi" : "Action",
      isId ? "Modul" : "Module",
      isId ? "Keterangan" : "Details",
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.id.replace(/"/g, '""')}"`,
      `"${l.timestamp.replace(/"/g, '""')}"`,
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      `"${(l.userRole || "").replace(/"/g, '""')}"`,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${(l.entityType || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Equator_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setActionFeedback({
      type: "success",
      message: isId
        ? `Berhasil mengekspor ${filteredLogs.length} baris log audit (.csv).`
        : `Successfully exported ${filteredLogs.length} audit trail records (.csv).`,
    });
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
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white tracking-wide">
              {isId ? "Keamanan & Pengguna" : "Security & Users"}
            </h2>
            <p className="text-xs text-gray-500">
              {isId
                ? "Hak akses peran pabrik, otentikasi, log audit, dan snapshot JSON"
                : "Role access, authentication, audit log, and JSON snapshots"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwitchingUser(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:border-brand shadow-xs active:scale-95 transition cursor-pointer"
          >
            <UserCheck className="h-4 w-4 text-brand" />
            <span>{isId ? "Ganti Profil Demo" : "Switch Demo Profile"}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-bold text-brand dark:text-red-300 hover:bg-red-100 active:scale-95 transition cursor-pointer"
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
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
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
            className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer"
            aria-label={isId ? "Tutup notifikasi" : "Close notification"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Active User Card & Privileges (Always visible contextual anchor) */}
      <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={currentUser.name} className="w-13 h-13 text-base" />
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

        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-extrabold uppercase text-gray-400 mr-1 block sm:inline">
            {isId ? "Izin Aktif (Klik untuk detail):" : "Active Permissions (Click for info):"}
          </span>
          {activePerms.slice(0, 5).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInspectedPermission(p as Permission)}
              className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition flex items-center gap-1 shadow-2xs cursor-pointer"
              title={isId ? "Klik untuk melihat detail hak akses" : "Click to view permission details"}
            >
              <span>{p}</span>
              <Info className="h-2.5 w-2.5 opacity-60" />
            </button>
          ))}
          {activePerms.length > 5 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
              +{activePerms.length - 5} {isId ? "lainnya" : "more"}
            </span>
          )}
        </div>
      </div>

      {/* 4-Tab Segmented Navigation Bar */}
      <div
        role="tablist"
        aria-label={isId ? "Navigasi modul keamanan" : "Security module navigation"}
        className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto"
      >
        <button
          id="tab-users"
          role="tab"
          aria-selected={activeTab === "USERS"}
          aria-controls="panel-users"
          tabIndex={activeTab === "USERS" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("USERS")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === "USERS"
              ? "bg-brand text-white shadow-xs"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{isId ? "Pengguna & Akses" : "Users & Access"}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
            activeTab === "USERS" ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}>
            {userList.length}
          </span>
        </button>

        <button
          id="tab-roles"
          role="tab"
          aria-selected={activeTab === "ROLES"}
          aria-controls="panel-roles"
          tabIndex={activeTab === "ROLES" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("ROLES")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === "ROLES"
              ? "bg-brand text-white shadow-xs"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{isId ? "Matriks Hak Akses" : "Role Matrix"}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
            activeTab === "ROLES" ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}>
            4
          </span>
        </button>

        <button
          id="tab-audit"
          role="tab"
          aria-selected={activeTab === "AUDIT"}
          aria-controls="panel-audit"
          tabIndex={activeTab === "AUDIT" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("AUDIT")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === "AUDIT"
              ? "bg-brand text-white shadow-xs"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <History className="h-4 w-4" />
          <span>{isId ? "Jejak Audit" : "Audit Trail"}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
            activeTab === "AUDIT" ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}>
            {logs.length}
          </span>
        </button>

        <button
          id="tab-backup"
          role="tab"
          aria-selected={activeTab === "BACKUP"}
          aria-controls="panel-backup"
          tabIndex={activeTab === "BACKUP" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("BACKUP")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === "BACKUP"
              ? "bg-brand text-white shadow-xs"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>{isId ? "Cadangan & Resiliensi" : "Backup & Resiliency"}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
            activeTab === "BACKUP" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
          }`}>
            JSON
          </span>
        </button>
      </div>

      {/* TAB 1: USERS & ACCESS */}
      {activeTab === "USERS" && (
        <div
          id="panel-users"
          role="tabpanel"
          aria-labelledby="tab-users"
          tabIndex={0}
          className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4 focus:outline-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" />
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
                  className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand focus:outline-none"
                  aria-label={isId ? "Cari pengguna pabrik" : "Search factory users"}
                />
              </div>

              {isAdmin ? (
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-strong active:scale-95 transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>{isId ? "+ Tambah Pengguna" : "+ Add User"}</span>
                </button>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-[11px] font-semibold border border-gray-200 dark:border-gray-700 cursor-not-allowed"
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
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                {isId
                  ? "Anda sedang melihat daftar pengguna dalam mode Baca (Read-Only). Otorisasi penambahan akun, modifikasi status, dan penugasan peran dibatasi khusus untuk Super Admin."
                  : "Viewing user directory in Read-Only mode. Adding users, changing status, and assigning roles is restricted to Super Admin."}
              </span>
            </div>
          )}

          {/* User Management Scrollable Table Container */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="py-2.5 px-3">{isId ? "Pengguna" : "User"}</th>
                  <th className="py-2.5 px-3">{isId ? "Username & Email" : "Username & Email"}</th>
                  <th className="py-2.5 px-3">{isId ? "Peran / Role" : "Role"}</th>
                  <th className="py-2.5 px-3 text-center">{isId ? "Status" : "Status"}</th>
                  <th className="py-2.5 px-3">{isId ? "Login Terakhir" : "Last Login"}</th>
                  <th className="py-2.5 px-3 text-center">{isId ? "Aksi" : "Actions"}</th>
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
                    const isSelf = u.username === currentUser.username;
                    const isPrimaryAdmin = u.username === "superadmin";

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={u.name} className="w-7 h-7 text-[10px]" />
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-brand dark:text-red-400">
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
                          {isAdmin && !isPrimaryAdmin ? (
                            <div className="relative inline-block">
                              <select
                                value={u.role}
                                onChange={(e) => handlePromptRoleChange(u, e.target.value as UserRole)}
                                className={`text-[10px] font-bold uppercase rounded-lg border py-1 pl-2 pr-6 appearance-none bg-white dark:bg-gray-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand ${info.badgeBg}`}
                                aria-label={isId ? `Ubah peran ${u.name}` : `Change role for ${u.name}`}
                              >
                                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                <option value="FACTORY_MANAGER">FACTORY MANAGER</option>
                                <option value="WAREHOUSE_STAFF">WAREHOUSE STAFF</option>
                                <option value="SALES_OPERATOR">SALES OPERATOR</option>
                              </select>
                              <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                            </div>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${info.badgeBg}`}>
                              {info.label}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            disabled={!isAdmin || isPrimaryAdmin || isSelf}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                              u.isActive === 1
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                                : "bg-gray-200 dark:bg-gray-800 text-gray-500 hover:bg-gray-300"
                            }`}
                            title={
                              isPrimaryAdmin
                                ? (isId ? "Akun Super Admin utama tidak dapat dinonaktifkan" : "Primary Super Admin cannot be deactivated")
                                : isSelf
                                ? (isId ? "Anda tidak dapat menonaktifkan akun sendiri" : "Cannot deactivate your own active session")
                                : !isAdmin
                                ? (isId ? "Izin Super Admin Diperlukan" : "Super Admin Required")
                                : ""
                            }
                          >
                            {u.isActive === 1 ? (isId ? "Aktif" : "Active") : isId ? "Non-Aktif" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-gray-500 font-mono">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAdmin ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Password Reset Action */}
                              <button
                                onClick={() => handleOpenResetPassword(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                                title={isId ? "Reset Kata Sandi" : "Reset Password"}
                                aria-label={isId ? `Reset kata sandi ${u.name}` : `Reset password for ${u.name}`}
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete User Action */}
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                disabled={isPrimaryAdmin || isSelf}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 transition cursor-pointer disabled:cursor-not-allowed"
                                title={
                                  isPrimaryAdmin
                                    ? (isId ? "Akun Super Admin utama tidak dapat dihapus" : "Primary Super Admin cannot be deleted")
                                    : isSelf
                                    ? (isId ? "Tidak dapat menghapus sesi sendiri" : "Cannot delete current session")
                                    : isId ? "Hapus Pengguna" : "Delete User"
                                }
                                aria-label={isId ? `Hapus pengguna ${u.name}` : `Delete user ${u.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
      )}

      {/* TAB 2: ROLE MATRIX */}
      {activeTab === "ROLES" && (
        <div
          id="panel-roles"
          role="tabpanel"
          aria-labelledby="tab-roles"
          tabIndex={0}
          className="space-y-4 focus:outline-none"
        >
          {/* RBAC Header & Customizer Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand" />
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isCustomizerOpen
                    ? "bg-brand text-white"
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
                  className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                    isUserRole
                      ? "bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 shadow-xs"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${info.badgeBg}`}>
                        {info.label}
                      </span>
                      {isUserRole && (
                        <span className="text-[10px] font-black uppercase text-brand dark:text-red-400 bg-red-100 dark:bg-red-950 px-1.5 py-0.2 rounded">
                          {isId ? "Peran Anda" : "Your Role"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{info.description}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block">
                        {perms.length} {isId ? "Hak Akses Aktif" : "Active Permissions"}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomRole(role);
                            setIsCustomizerOpen(true);
                          }}
                          className="text-[10px] font-bold text-brand dark:text-red-400 hover:underline cursor-pointer"
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
                          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[10px] font-mono text-gray-700 dark:text-gray-300 hover:text-brand dark:hover:text-red-300 transition cursor-pointer"
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
                          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
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
            <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border-2 border-brand/30 shadow-md space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-brand dark:text-red-400">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{isId ? "Reset ke Standar" : "Reset to Default"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomRolePermissions}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-strong cursor-pointer"
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-brand text-white shadow-xs"
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
                      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-3.5 space-y-2.5"
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
                                  className="mt-0.5 h-3.5 w-3.5 rounded text-brand focus:ring-brand"
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
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-brand transition shrink-0 cursor-pointer"
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
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === "AUDIT" && (
        <div
          id="panel-audit"
          role="tabpanel"
          aria-labelledby="tab-audit"
          tabIndex={0}
          className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4 focus:outline-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-brand" />
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
                  aria-label={isId ? "Cari catatan log audit" : "Search audit trail logs"}
                />
              </div>

              {/* Export Audit Log CSV Button */}
              <button
                type="button"
                onClick={handleExportAuditLogsCSV}
                disabled={filteredLogs.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition shadow-xs disabled:opacity-50 cursor-pointer"
                title={isId ? "Ekspor log audit ke format CSV" : "Export audit logs to CSV"}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isId ? "Ekspor CSV" : "Export CSV"}</span>
              </button>

              <button
                onClick={fetchLogs}
                className="p-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-brand active:scale-95 transition shadow-xs cursor-pointer"
                title="Refresh Logs"
                aria-label={isId ? "Segarkan log audit" : "Refresh audit logs"}
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
                    ? "bg-brand text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Logs Scrollable Table */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="py-2.5 px-3">{isId ? "Waktu" : "Time"}</th>
                  <th className="py-2.5 px-3">{isId ? "Pengguna" : "User"}</th>
                  <th className="py-2.5 px-3">{isId ? "Aksi" : "Action"}</th>
                  <th className="py-2.5 px-3">{isId ? "Modul" : "Module"}</th>
                  <th className="py-2.5 px-3">{isId ? "Keterangan" : "Details"}</th>
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
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
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
      )}

      {/* TAB 4: BACKUP & RESILIENCY */}
      {activeTab === "BACKUP" && (
        <div
          id="panel-backup"
          role="tabpanel"
          aria-labelledby="tab-backup"
          tabIndex={0}
          className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5 focus:outline-none"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-brand" />
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-md hover:bg-brand-strong active:scale-95 transition disabled:opacity-50 cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 active:scale-95 transition shadow-xs disabled:opacity-50 cursor-pointer"
                title={!canRestore ? (isId ? "Izin Super Admin Diperlukan" : "Super Admin Required") : ""}
              >
                <Upload className="h-4 w-4 text-brand" />
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

          {/* Safety Protocols Notice */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <Shield className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{isId ? "Protokol Keamanan Cadangan Otomatis (Truth-Gate Safeguard)" : "Automated Safety Backup Protocol (Truth-Gate Safeguard)"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isId
                ? "Sistem secara otomatis mengunduh cadangan snapshot darurat (Equator_AutoBackup_Before_Restore_*.json) ke komputer Anda sesaat sebelum memproses restore. Fitur ini melindungi pabrik dari hilangnya data operasional apabila snapshot yang diunggah tidak sengaja tertukar atau rusak."
                : "The system automatically downloads an emergency snapshot backup (Equator_AutoBackup_Before_Restore_*.json) to your machine immediately before processing a restore. This safeguards factory operations against accidental data loss."}
            </p>
          </div>

          {restoreMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{restoreMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add New Factory User Modal */}
      {isAddUserOpen && (
        <AddUserModal
          isOpen={isAddUserOpen}
          isId={isId}
          onClose={() => setIsAddUserOpen(false)}
          onSuccess={(msg) => {
            setIsAddUserOpen(false);
            setActionFeedback({ type: "success", message: msg });
            fetchUsers();
            fetchLogs();
          }}
          onError={(msg) => setActionFeedback({ type: "error", message: msg })}
          getAuthHeaders={getAuthHeaders}
          isAdmin={isAdmin}
        />
      )}

      {/* MODAL 2: Switch Demo User Account Modal */}
      {isSwitchingUser && (
        <SwitchDemoModal
          isOpen={isSwitchingUser}
          isId={isId}
          language={language}
          currentUser={currentUser}
          onClose={() => setIsSwitchingUser(false)}
          onSelectUser={(u) => {
            onUserChange(u);
            setIsSwitchingUser(false);
          }}
        />
      )}

      {/* MODAL 3: Permission Detail Inspector Pop-up Modal */}
      {inspectedPermission && (
        <InspectedPermissionModal
          isOpen={Boolean(inspectedPermission)}
          permission={inspectedPermission}
          isId={isId}
          language={language}
          onClose={() => setInspectedPermission(null)}
        />
      )}

      {/* MODAL 4: In-App Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <InAppConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          isDestructive={confirmModal.isDestructive}
          isId={isId}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}

      {/* MODAL 5: Snapshot Pre-Flight Inspection & Verification Modal */}
      {snapshotPreFlight && snapshotPreFlight.isOpen && (
        <SnapshotPreFlightModal
          isOpen={snapshotPreFlight.isOpen}
          summary={snapshotPreFlight.summary}
          restoring={restoring}
          isId={isId}
          onClose={() => setSnapshotPreFlight(null)}
          onExecuteRestore={handleExecuteRestore}
        />
      )}

      {/* MODAL 6: Reset Password Modal */}
      {resetPasswordModal && resetPasswordModal.isOpen && resetPasswordModal.user && (
        <ResetPasswordModal
          isOpen={resetPasswordModal.isOpen}
          user={resetPasswordModal.user}
          isId={isId}
          onClose={() => setResetPasswordModal(null)}
          onSubmit={handleExecuteResetPassword}
        />
      )}

      {/* MODAL 7: Truth-Gate Role Change Confirmation Modal */}
      {roleChangeConfirm && roleChangeConfirm.isOpen && (
        <RoleChangeConfirmModal
          isOpen={roleChangeConfirm.isOpen}
          user={roleChangeConfirm.user}
          newRole={roleChangeConfirm.newRole}
          isId={isId}
          language={language}
          rolePermsState={rolePermsState}
          onClose={() => setRoleChangeConfirm(null)}
          onConfirm={handleExecuteRoleChange}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODAL SUBCOMPONENTS (Clean encapsulation with useModalSafety)
// ----------------------------------------------------------------------

interface AddUserModalProps {
  isOpen: boolean;
  isId: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  getAuthHeaders: () => Record<string, string>;
}

function AddUserModal({
  isOpen,
  isId,
  isAdmin,
  onClose,
  onSuccess,
  onError,
  getAuthHeaders,
}: AddUserModalProps) {
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalSafety({ isOpen, onClose, initialFocusRef });

  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("equator2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>("SALES_OPERATOR");
  const [creatingUser, setCreatingUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onError(isId ? "Akses ditolak: Hanya Super Admin yang dapat menambahkan pengguna baru." : "Access denied: Only Super Admin can add new users.");
      return;
    }

    if (!newUsername.trim() || !newName.trim() || !newEmail.trim() || !newPassword) {
      onError(isId ? "Mohon lengkapi semua bidang isian pengguna." : "Please fill in all required fields.");
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch("/api/security/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newUsername.trim().toLowerCase(),
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess(isId ? `Pengguna @${newUsername} (${newRole}) berhasil ditambahkan.` : `User @${newUsername} (${newRole}) successfully created.`);
      } else {
        onError(json.error || "Gagal membuat pengguna.");
      }
    } catch (err: any) {
      onError(err.message || "Gagal membuat pengguna.");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-modal-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <h3 id="add-user-modal-title" className="font-bold text-sm">
              {isId ? "Tambah Pengguna Pabrik Baru" : "Add New Factory User"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="new-user-fullname" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                {isId ? "Nama Lengkap *" : "Full Name *"}
              </label>
              <input
                ref={initialFocusRef}
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
              <label htmlFor="new-user-username" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                Username *
              </label>
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
            <label htmlFor="new-user-email" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
              Email *
            </label>
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
            <div className="relative">
              <input
                id="new-user-password"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 pr-9 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
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
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={creatingUser}
              className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {creatingUser ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Pengguna" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SwitchDemoModalProps {
  isOpen: boolean;
  isId: boolean;
  language: "id" | "en";
  currentUser: FactoryUser;
  onClose: () => void;
  onSelectUser: (user: FactoryUser) => void;
}

function SwitchDemoModal({
  isOpen,
  isId,
  language,
  currentUser,
  onClose,
  onSelectUser,
}: SwitchDemoModalProps) {
  const modalRef = useModalSafety({ isOpen, onClose });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-demo-modal-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div>
            <h3 id="switch-demo-modal-title" className="font-bold text-base">
              {isId ? "Ganti Profil Peran Demo Pabrik" : "Switch Demo Factory Profile"}
            </h3>
            <p className="text-xs text-red-200">
              {isId
                ? "Uji coba hak akses otorisasi untuk 4 peran operasional pabrik"
                : "Test RBAC authorization across 4 distinct factory operational roles"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {FACTORY_DEMO_ACCOUNTS.map((acc) => {
            const info = getRoleBadgeInfo(acc.role, language);
            const isSelected = currentUser.id === acc.id;

            return (
              <div
                key={acc.id}
                onClick={() =>
                  onSelectUser({
                    id: acc.id,
                    username: acc.username,
                    name: acc.name,
                    email: acc.email,
                    role: acc.role,
                    isActive: 1,
                  })
                }
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition active:scale-[0.98] ${
                  isSelected
                    ? "border-brand bg-red-50/50 dark:bg-red-950/30 shadow-xs"
                    : "border-gray-200 dark:border-gray-800 hover:border-red-200 bg-white dark:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={acc.name} className="w-11 h-11 text-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {acc.name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${info.badgeBg}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">@{acc.username} • {acc.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{isId ? "Pilih" : "Select"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface InspectedPermissionModalProps {
  isOpen: boolean;
  permission: Permission;
  isId: boolean;
  language: "id" | "en";
  onClose: () => void;
}

function InspectedPermissionModal({
  isOpen,
  permission,
  isId,
  language,
  onClose,
}: InspectedPermissionModalProps) {
  const modalRef = useModalSafety({ isOpen, onClose });
  const meta = PERMISSION_METADATA[permission];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspect-perm-modal-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 id="inspect-perm-modal-title" className="font-bold text-sm leading-tight">
                {isId ? meta.nameId : meta.nameEn}
              </h3>
              <p className="text-[10px] font-mono text-red-200">{permission}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white transition cursor-pointer"
            aria-label={isId ? "Tutup modal" : "Close modal"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                meta.securityTier === "CRITICAL"
                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300"
                  : meta.securityTier === "RESTRICTED"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300"
              }`}
            >
              {isId ? "Tingkat Keamanan: " : "Security Tier: "}
              {meta.securityTier}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {isId ? meta.categoryLabelId : meta.categoryLabelEn}
            </span>
          </div>

          {/* Detail 1: What it does */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand dark:text-red-400">
              {isId ? "1. Apa yang Dilakukan (Fungsi & Hak Akses)" : "1. What It Does (Function & Scope)"}
            </p>
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              {isId ? meta.descriptionId : meta.descriptionEn}
            </p>
          </div>

          {/* Detail 2: Who can do it */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand dark:text-red-400">
              {isId ? "2. Peran Standar Berwenang (Default Roles)" : "2. Authorized Roles (Default Configuration)"}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {meta.defaultRoles.map((r) => {
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
          <div className="p-3.5 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-900 dark:text-red-300">
              {isId ? "3. Dampak Operasional Pabrik" : "3. Factory Operational Impact"}
            </p>
            <p className="text-xs text-red-950 dark:text-red-200 leading-relaxed">
              {isId ? meta.effectId : meta.effectEn}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-strong transition cursor-pointer"
          >
            {isId ? "Tutup Inspector" : "Close Inspector"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface InAppConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isId: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function InAppConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  isDestructive,
  isId,
  onClose,
  onConfirm,
}: InAppConfirmModalProps) {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const modalRef = useModalSafety({ isOpen, onClose, initialFocusRef });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <h3 id="confirm-dialog-title" className="font-bold text-sm">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {message}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              ref={initialFocusRef}
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition cursor-pointer ${
                isDestructive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-brand hover:bg-brand-strong"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SnapshotPreFlightModalProps {
  isOpen: boolean;
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
  restoring: boolean;
  isId: boolean;
  onClose: () => void;
  onExecuteRestore: () => void;
}

function SnapshotPreFlightModal({
  isOpen,
  summary,
  restoring,
  isId,
  onClose,
  onExecuteRestore,
}: SnapshotPreFlightModalProps) {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const modalRef = useModalSafety({ isOpen, onClose, initialFocusRef });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-preflight-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-5 w-5" />
            <div>
              <h3 id="snapshot-preflight-title" className="font-bold text-sm">
                {isId ? "Verifikasi Pra-Pemulihan Snapshot Basis Data" : "Database Snapshot Pre-Flight Verification"}
              </h3>
              <p className="text-[10px] text-red-200 font-mono">
                Schema v{summary.schemaVersion} • {new Date(summary.exportDate).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{isId ? "Peringatan Tindakan Kritis & Safeguard Otomatis" : "Critical Action Warning & Auto-Safeguard"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isId
                ? "Memulihkan snapshot akan menimpa seluruh rekaman database pabrik saat ini dengan isi file backup ini. Sistem akan secara otomatis mengunduh cadangan snapshot darurat sebelum proses restore dieksekusi."
                : "Restoring this snapshot will overwrite all existing factory database records. An automated safety backup will be exported and downloaded prior to executing the restore."}
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
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.ordersCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Item Baris DO" : "Order Items"}</span>
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.itemsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Bahan Baku" : "Materials"}</span>
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.materialsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Mutasi Stok" : "Movements"}</span>
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.movementsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Pengguna" : "Users"}</span>
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.usersCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">{isId ? "Blueprint CAD" : "Blueprints"}</span>
                <span className="text-base font-black font-mono text-gray-900 dark:text-white">{summary.blueprintsCount}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-center justify-between text-xs font-bold">
              <span className="text-gray-700 dark:text-gray-300">{isId ? "Total Keseluruhan Rekaman:" : "Total Records:"}</span>
              <span className="font-mono text-brand dark:text-red-400 text-sm">{summary.totalRecords} entitas</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            disabled={restoring}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onExecuteRestore}
            disabled={restoring}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {restoring ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
            <span>{restoring ? (isId ? "Memulihkan Data..." : "Restoring Data...") : isId ? "Pulihkan Basis Data Sekarang" : "Restore Database Now"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: ManagedUser;
  isId: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}

function ResetPasswordModal({
  isOpen,
  user,
  isId,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalSafety({ isOpen, onClose, initialFocusRef });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setValidationError(
        isId
          ? "Kata sandi minimal harus terdiri dari 6 karakter."
          : "Password must be at least 6 characters long."
      );
      return;
    }
    if (password !== confirmPassword) {
      setValidationError(
        isId
          ? "Konfirmasi kata sandi tidak sesuai dengan kata sandi baru."
          : "Password confirmation does not match new password."
      );
      return;
    }

    setValidationError(null);
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-modal-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            <h3 id="reset-password-modal-title" className="font-bold text-sm">
              {isId ? "Reset Kata Sandi Pengguna" : "Reset User Password"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Avatar name={user.name} className="w-9 h-9 text-xs" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">@{user.username} • {user.email}</p>
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label htmlFor="reset-new-password" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
              {isId ? "Kata Sandi Baru *" : "New Password *"}
            </label>
            <div className="relative">
              <input
                ref={initialFocusRef}
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder={isId ? "Minimal 6 karakter" : "At least 6 characters"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 pr-9 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
              {isId ? "Konfirmasi Kata Sandi Baru *" : "Confirm New Password *"}
            </label>
            <input
              id="reset-confirm-password"
              type={showPassword ? "text" : "password"}
              required
              placeholder={isId ? "Ketik ulang kata sandi baru" : "Re-enter new password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationError(null);
              }}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-strong transition cursor-pointer"
            >
              {isId ? "Simpan Kata Sandi" : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RoleChangeConfirmModalProps {
  isOpen: boolean;
  user: ManagedUser;
  newRole: UserRole;
  isId: boolean;
  language: "id" | "en";
  rolePermsState?: Record<UserRole, Permission[]>;
  onClose: () => void;
  onConfirm: () => void;
}

function RoleChangeConfirmModal({
  isOpen,
  user,
  newRole,
  isId,
  language,
  rolePermsState,
  onClose,
  onConfirm,
}: RoleChangeConfirmModalProps) {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const modalRef = useModalSafety({ isOpen, onClose, initialFocusRef });

  const currentInfo = getRoleBadgeInfo(user.role, language);
  const newInfo = getRoleBadgeInfo(newRole, language);

  const currentPerms = rolePermsState?.[user.role] || getEffectiveRolePermissions(user.role) || ROLE_PERMISSIONS[user.role] || [];
  const targetPerms = rolePermsState?.[newRole] || getEffectiveRolePermissions(newRole) || ROLE_PERMISSIONS[newRole] || [];

  const gainedPerms = targetPerms.filter((p) => !currentPerms.includes(p));
  const revokedPerms = currentPerms.filter((p) => !targetPerms.includes(p));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-change-confirm-title"
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-brand text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <h3 id="role-change-confirm-title" className="font-bold text-sm">
              {isId ? "Konfirmasi Perubahan Peran Pengguna (Truth Gate)" : "Confirm User Role Change (Truth Gate)"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
            aria-label={isId ? "Tutup dialog" : "Close dialog"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <Avatar name={user.name} className="w-10 h-10 text-sm" />
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500 font-mono">@{user.username} • {user.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
            <p className="text-[10px] font-extrabold uppercase text-gray-400">
              {isId ? "Transisi Peran & Hak Akses" : "Role Transition & Authority"}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Peran Semula" : "Current Role"}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${currentInfo.badgeBg}`}>
                  {currentInfo.label}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 shrink-0" />
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-gray-400 uppercase block">{isId ? "Peran Baru" : "New Role"}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${newInfo.badgeBg}`}>
                  {newInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Differences breakdown */}
          <div className="space-y-2.5">
            {gainedPerms.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">
                  {isId ? `+ ${gainedPerms.length} Hak Akses Ditambahkan:` : `+ ${gainedPerms.length} Permissions Granted:`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {gainedPerms.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {revokedPerms.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-300">
                  {isId ? `- ${revokedPerms.length} Hak Akses Ditarik:` : `- ${revokedPerms.length} Permissions Revoked:`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {revokedPerms.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {isId ? "Konfirmasi Perubahan Peran" : "Confirm Role Change"}
          </button>
        </div>
      </div>
    </div>
  );
}
