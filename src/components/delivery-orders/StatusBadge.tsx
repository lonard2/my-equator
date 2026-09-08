"use client";

import React from "react";
import { DeliveryOrderStatus } from "@/types";
import { getStatusToken } from "@/lib/utils/statusColors";

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
  const item = getStatusToken(status);
  const Icon = item.icon;
  const label = isId ? item.labelId : item.labelEn;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1 border",
    md: "text-xs px-2.5 py-0.5 gap-1.5 border",
    lg: "text-xs px-3 py-1 gap-2 border font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold transition-all duration-200 ease-out ${item.badge.classes} ${sizeClasses} ${className}`}
    >
      {showIcon ? (
        <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${item.badge.dotClasses}`} />
      )}
      <span>{label}</span>
    </span>
  );
}
