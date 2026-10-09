"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PhoneForwarded,
  Layers,
  BarChart3,
  Settings,
  History,
  ShieldCheck,
  UserCheck,
  Building,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("quality_manager");

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setActiveRole(data.user.role || "quality_manager");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleDestination = (role: string) => {
    switch (role) {
      case "sales":
        return "/admin/sales/new-complaint";
      case "management":
        return "/admin/reports";
      case "customer_service":
        return "/admin/complaints";
      case "quality_manager":
        return "/admin/resolve";
      case "super_admin":
        return "/admin";
      case "customer":
      default:
        return "/portal";
    }
  };

  const handleRoleChange = async (role: string) => {
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setActiveRole(role);
      const target = getRoleDestination(role);
      window.location.href = target;
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: "Dashboard & Analytics", href: "/admin", icon: LayoutDashboard },
    { label: "Complaint Resolution Desk", href: "/admin/resolve", icon: ClipboardList },
    { label: "Raise New Complaint", href: "/complaint/new", icon: PhoneForwarded },
  ];

  const secondaryNavItems = [
    { label: "Batch Traceability", href: "/admin/batch-trace", icon: Layers },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-purechem-orange">PCM</span>
          <span className="font-bold text-sm">Admin Command</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded text-slate-300">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800 flex flex-col z-30`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purechem-navy flex items-center justify-center font-black text-white text-base border border-slate-700">
            QA
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-tight">PURECHEM QA</div>
            <div className="text-[10px] text-purechem-orange font-semibold uppercase">Lagos QA & Investigation</div>
          </div>
        </div>

        {/* Staff Role Switcher */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purechem-orange" /> Acting Staff Role:
          </label>
          <select
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-purechem-orange font-medium"
          >
            <option value="quality_manager">Quality Manager</option>
            <option value="super_admin">Super Administrator</option>
            <option value="customer_service">Customer Service</option>
            <option value="sales">Sales Representative</option>
            <option value="management">Executive Management</option>
          </select>
          <div className="text-[10px] text-slate-400 mt-1">
            Access: {activeRole.replace("_", " ").toUpperCase()}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 grow">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            Core Portals
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-purechem-orange text-white shadow-md font-bold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-2 border-t border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            System Tools
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Timezone: WAT (UTC+1)</div>
          <div>Purechem Mfg Ltd • Nigeria</div>
        </div>
      </aside>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
