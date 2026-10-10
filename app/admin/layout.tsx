"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PhoneForwarded,
  Layers,
  Settings,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-sky-50/40 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white text-slate-900 p-4 flex justify-between items-center border-b border-sky-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Purechem Manufacturing Limited"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar: Crisp White & Purechem Blue */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white text-slate-700 shrink-0 border-r border-sky-100 shadow-sm flex flex-col z-30`}
      >
        {/* Brand Header with Official Logo */}
        <div className="p-5 border-b border-sky-100 flex flex-col gap-2">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Purechem Manufacturing Limited"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="text-[10px] text-[#0084C7] font-bold uppercase tracking-wider">
            Quality Assurance & Operations
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 grow">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#0084C7] text-white shadow-sm font-extrabold"
                    : "text-slate-600 hover:text-[#0084C7] hover:bg-sky-50"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#0084C7]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 pt-5 pb-1.5">
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#0084C7] text-white shadow-sm font-extrabold"
                    : "text-slate-600 hover:text-[#0084C7] hover:bg-sky-50"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-sky-100 bg-sky-50/60 text-[11px] text-slate-500">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0084C7]" />
            ISO 9001:2015 System
          </div>
          <div>Lagos QA Operations • WAT</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="grow overflow-x-hidden min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}
