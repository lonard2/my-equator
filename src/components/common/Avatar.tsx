"use client";

import React from "react";

/* Initials monogram avatar. Deterministic tone per name, darkred family only
   (one accent discipline). No external photos. */
const TONES = ["bg-brand", "bg-brand-ink", "bg-gray-600 dark:bg-gray-700"];

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const tone = TONES[hash % TONES.length];

  return (
    <div
      aria-hidden
      className={`shrink-0 rounded-full flex items-center justify-center text-white font-bold select-none overflow-hidden border border-white/20 ${tone} ${className}`}
    >
      {initials}
    </div>
  );
}
