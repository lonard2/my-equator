import { DeliveryOrderStatus } from "@/types";
import {
  FileText,
  CheckCircle,
  Printer,
  Truck,
  CheckCircle2,
  Ban,
  LucideIcon,
} from "lucide-react";

/**
 * Authoritative Status Color Map derived strictly from DESIGN.md:
 * - status-draft:      #6B7280 (Gray)
 * - status-confirmed:  #1D4ED8 (Blue)
 * - status-printed:    #B45309 (Amber)
 * - status-dispatched: #6D28D9 (Purple / Violet)
 * - status-delivered:  #047857 (Emerald)
 * - status-cancelled:  #B91C1C (Red / Danger)
 *
 * Consumed uniformly by StatusBadge, Stepper, CTAs, and KPI Strips.
 */

export interface StatusVisualToken {
  status: DeliveryOrderStatus;
  hex: string;
  labelId: string;
  labelEn: string;
  icon: LucideIcon;
  badge: {
    classes: string;
    dotClasses: string;
  };
  stepper: {
    activeBg: string;
    activeText: string;
    activeRing: string;
    passedBg: string;
    passedText: string;
    idleBg: string;
    idleText: string;
  };
  cta: {
    buttonClasses: string;
  };
}

export const STATUS_COLOR_MAP: Record<DeliveryOrderStatus, StatusVisualToken> = {
  DRAFT: {
    status: "DRAFT",
    hex: "#6B7280",
    labelId: "Draft",
    labelEn: "Draft",
    icon: FileText,
    badge: {
      classes:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      dotClasses: "bg-gray-400 dark:bg-gray-500",
    },
    stepper: {
      activeBg: "bg-gray-600 text-white",
      activeText: "text-gray-700 dark:text-gray-300 font-bold",
      activeRing: "ring-2 ring-gray-300 dark:ring-gray-700",
      passedBg: "bg-emerald-600 text-white",
      passedText: "text-emerald-700 dark:text-emerald-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-gray-700 hover:bg-gray-800 text-white focus-visible:ring-gray-500 shadow-xs",
    },
  },
  CONFIRMED: {
    status: "CONFIRMED",
    hex: "#1D4ED8",
    labelId: "Terkonfirmasi",
    labelEn: "Confirmed",
    icon: CheckCircle,
    badge: {
      classes:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dotClasses: "bg-blue-500",
    },
    stepper: {
      activeBg: "bg-blue-600 text-white",
      activeText: "text-blue-700 dark:text-blue-300 font-bold",
      activeRing: "ring-2 ring-blue-300 dark:ring-blue-800",
      passedBg: "bg-emerald-600 text-white",
      passedText: "text-emerald-700 dark:text-emerald-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500 shadow-xs",
    },
  },
  PRINTED: {
    status: "PRINTED",
    hex: "#B45309",
    labelId: "Tercetak",
    labelEn: "Printed",
    icon: Printer,
    badge: {
      classes:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dotClasses: "bg-amber-500",
    },
    stepper: {
      activeBg: "bg-amber-600 text-white",
      activeText: "text-amber-700 dark:text-amber-300 font-bold",
      activeRing: "ring-2 ring-amber-300 dark:ring-amber-800",
      passedBg: "bg-emerald-600 text-white",
      passedText: "text-emerald-700 dark:text-emerald-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500 shadow-xs",
    },
  },
  DISPATCHED: {
    status: "DISPATCHED",
    hex: "#6D28D9",
    labelId: "Dikirim",
    labelEn: "Dispatched",
    icon: Truck,
    badge: {
      classes:
        "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dotClasses: "bg-purple-500",
    },
    stepper: {
      activeBg: "bg-purple-600 text-white",
      activeText: "text-purple-700 dark:text-purple-300 font-bold",
      activeRing: "ring-2 ring-purple-300 dark:ring-purple-800",
      passedBg: "bg-emerald-600 text-white",
      passedText: "text-emerald-700 dark:text-emerald-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-500 shadow-xs",
    },
  },
  DELIVERED: {
    status: "DELIVERED",
    hex: "#047857",
    labelId: "Diterima",
    labelEn: "Delivered",
    icon: CheckCircle2,
    badge: {
      classes:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dotClasses: "bg-emerald-500",
    },
    stepper: {
      activeBg: "bg-emerald-600 text-white",
      activeText: "text-emerald-700 dark:text-emerald-400 font-bold",
      activeRing: "ring-2 ring-emerald-300 dark:ring-emerald-800",
      passedBg: "bg-emerald-600 text-white",
      passedText: "text-emerald-700 dark:text-emerald-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500 shadow-xs",
    },
  },
  CANCELLED: {
    status: "CANCELLED",
    hex: "#B91C1C",
    labelId: "Dibatalkan",
    labelEn: "Cancelled",
    icon: Ban,
    badge: {
      classes:
        "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800",
      dotClasses: "bg-red-500",
    },
    stepper: {
      activeBg: "bg-red-600 text-white",
      activeText: "text-red-700 dark:text-red-300 font-bold",
      activeRing: "ring-2 ring-red-300 dark:ring-red-900",
      passedBg: "bg-red-600 text-white",
      passedText: "text-red-700 dark:text-red-400",
      idleBg: "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700",
      idleText: "text-gray-400 dark:text-gray-500",
    },
    cta: {
      buttonClasses:
        "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 shadow-xs",
    },
  },
};

/**
 * Returns the status color token for any status, with fallback to DRAFT.
 */
export function getStatusToken(status: DeliveryOrderStatus): StatusVisualToken {
  return STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.DRAFT;
}
