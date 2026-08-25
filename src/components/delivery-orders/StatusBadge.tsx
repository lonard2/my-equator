"use client";

import React from "react";
import { DeliveryOrderStatus } from "@/types";
import {
  FileText,
  CheckCircle,
  Printer,
  Truck,
  CheckCircle2,
  Ban,
} from "lucide-react";

interface StatusBadgeProps {
  status: DeliveryOrderStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  language?: "id" | "en";
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = false,
  language = "id",
  className = "",
}: StatusBadgeProps) {
  const isId = language === "id";

  const config: Record<
    DeliveryOrderStatus,
    {
      labelId: string;
      labelEn: string;
      classes: string;
      dotClasses: string;
      icon: React.ElementType;
    }
  > = {
    DRAFT: {
      labelId: "Draft",
      labelEn: "Draft",
      classes: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      dotClasses: "bg-gray-400 dark:bg-gray-500",
      icon: FileText,
    },
    CONFIRMED: {
      labelId: "Terkonfirmasi",
      labelEn: "Confirmed",
      classes: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dotClasses: "bg-blue-500",
      icon: CheckCircle,
    },
    PRINTED: {
      labelId: "Tercetak",
      labelEn: "Printed",
      classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dotClasses: "bg-amber-500",
      icon: Printer,
    },
    DISPATCHED: {
      labelId: "Dikirim",
      labelEn: "Dispatched",
      classes: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dotClasses: "bg-purple-500",
      icon: Truck,
    },
    DELIVERED: {
      labelId: "Diterima",
      labelEn: "Delivered",
      classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dotClasses: "bg-emerald-500",
      icon: CheckCircle2,
    },
    CANCELLED: {
      labelId: "Dibatalkan",
      labelEn: "Cancelled",
      classes: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800",
      dotClasses: "bg-red-500",
      icon: Ban,
    },
  };

  const item = config[status] || config.DRAFT;
  const Icon = item.icon;
  const label = isId ? item.labelId : item.labelEn;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1 border",
    md: "text-xs px-2.5 py-0.5 gap-1.5 border",
    lg: "text-xs px-3 py-1 gap-2 border font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold transition-all duration-200 ease-out ${item.classes} ${sizeClasses} ${className}`}
    >
      {showIcon ? (
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${item.dotClasses}`} />
      )}
      <span>{label}</span>
    </span>
  );
}
