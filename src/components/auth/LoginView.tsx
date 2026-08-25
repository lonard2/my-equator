"use client";

import React, { useState } from "react";
import { Compass, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { FACTORY_DEMO_ACCOUNTS, FactoryUser } from "@/lib/auth/types";
import { getRoleBadgeInfo } from "@/lib/auth/rbac";

interface LoginViewProps {
  onLoginSuccess: (user: FactoryUser) => void;
  language: "id" | "en";
}

export function LoginView({ onLoginSuccess, language }: LoginViewProps) {
  const isId = language === "id";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(isId ? "Username dan kata sandi wajib diisi." : "Username and password required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onLoginSuccess(json.data);
      } else {
        setError(json.error || (isId ? "Kredensial tidak valid." : "Invalid credentials."));
      }
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc: typeof FACTORY_DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.plainPassword);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: acc.username, password: acc.plainPassword }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onLoginSuccess(json.data);
      } else {
        setError(json.error || "Login demo gagal.");
      }
    } catch (err: any) {
      setError(err?.message || "Login demo gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-[#4A0000] to-black flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Left Side: Brand Narrative */}
        <div className="lg:col-span-5 bg-[#8B0000] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-md">
                <Compass className="h-6 w-6 text-[#8B0000] stroke-[2.5] animate-pulse-slow" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wide">MyEquator</h1>
                <p className="text-xs text-red-200">Factory ERP & CAD Platform</p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-950/60 border border-red-800 text-red-200">
                PT Equator Insole Bandung
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight">
                {isId
                  ? "Sistem Operasional Pabrik & Desain Insole Terpadu"
                  : "Integrated Footwear Manufacturing & CAD Operations"}
              </h2>
              <p className="text-xs text-red-200 leading-relaxed">
                {isId
                  ? "Otomasi surat jalan dot-matrix, manajemen inventori EVA/Latex/PU, kalkulasi kurva insole, dan asisten cerdas Khatulistiwa AI."
                  : "ESC/P dot-matrix printing, raw material stock tracking, parametric vector CAD, and Khatulistiwa AI assistant."}
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10 text-[11px] text-red-300 border-t border-red-800/80 flex items-center justify-between">
            <span>Versi 1.0.0 (Production)</span>
            <span>Bandung, Jawa Barat</span>
          </div>
        </div>

        {/* Right Side: Auth Form & Quick Access */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="space-y-1 mb-5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {isId ? "Masuk ke Akun Anda" : "Sign In to Your Account"}
              </h3>
              <p className="text-xs text-gray-500">
                {isId
                  ? "Gunakan kredensial resmi pabrik atau pilih akun demo di bawah"
                  : "Enter your factory credentials or select a role profile below"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                  {isId ? "Username / Email" : "Username or Email"}
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin / manager / gudang / sales"
                    className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                  {isId ? "Kata Sandi (Password)" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 pl-10 pr-10 py-2.5 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-2xl bg-[#8B0000] hover:bg-[#A00000] text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? (isId ? "Memverifikasi..." : "Authenticating...") : isId ? "Masuk ke Sistem" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Role Cards */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block">
              {isId ? "Akses Cepat 4 Peran Pabrik (1-Klik Masuk):" : "Quick Role Access (1-Click Demo Login):"}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {FACTORY_DEMO_ACCOUNTS.map((acc) => {
                const info = getRoleBadgeInfo(acc.role, language);
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickDemoLogin(acc)}
                    disabled={loading}
                    className="p-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/40 text-left transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-8 h-8 rounded-xl object-cover border shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-[11px] text-gray-900 dark:text-white truncate">
                        {acc.name.split(",")[0]}
                      </p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${info.badgeBg}`}>
                        {acc.role.split("_")[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
