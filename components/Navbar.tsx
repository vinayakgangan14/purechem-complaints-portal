"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Phone, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  Menu, 
  X,
  CheckCircle2,
  Building2,
  Clock,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-sky-100">
      {/* Top Banner: Hotline & Lagos Location (Purechem Blue) */}
      <div className="bg-[#0084C7] text-white text-xs py-1.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs font-medium">
            <span className="flex items-center gap-1.5 font-bold">
              <Phone className="w-3.5 h-3.5 text-white" />
              Hotlines: +234 912 154 0036 / +234 915 065 5555
            </span>
            <span className="hidden sm:inline text-sky-200">|</span>
            <span className="hidden sm:inline text-sky-100">
              Afprint Compound, Isolo, Lagos, Nigeria
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-sky-100">
            <Clock className="w-3 h-3 text-sky-200" />
            <span>ISO 9001:2015 Quality Portal (WAT)</span>
          </div>
        </div>
      </div>

      {/* Main Navbar: Crisp White */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Official Purechem Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Purechem Manufacturing Limited"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
            <div className="hidden lg:block border-l border-sky-200 pl-3">
              <div className="text-[11px] font-bold text-[#0084C7] tracking-wider uppercase">
                Customer Care & Quality Desk
              </div>
              <div className="text-[10px] text-slate-500">
                Official Complaint & Resolution Portal
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                pathname === "/"
                  ? "bg-sky-50 text-[#0084C7]"
                  : "text-slate-600 hover:text-[#0084C7] hover:bg-slate-50"
              }`}
            >
              Home
            </Link>

            {/* Pillar 1: Raise Complaint */}
            <Link
              href="/complaint/new"
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                pathname === "/complaint/new"
                  ? "bg-[#0084C7] text-white shadow-md"
                  : "bg-[#0084C7] hover:bg-[#006CA6] text-white hover:shadow"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              RAISE COMPLAINT
            </Link>

            {/* Pillar 2: Resolution Desk */}
            <Link
              href="/admin/resolve"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                pathname === "/admin/resolve"
                  ? "bg-sky-600 text-white border-sky-600 shadow"
                  : "bg-sky-50 text-[#0084C7] border-sky-200 hover:bg-sky-100"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#0084C7]" />
              RESOLUTION DESK
            </Link>

            {/* Pillar 3: Admin & Analytics */}
            <Link
              href="/admin"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                pathname === "/admin"
                  ? "bg-slate-800 text-white border-slate-800 shadow"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-600" />
              ADMIN & ANALYTICS
            </Link>

            {/* Public Track by ID */}
            <Link
              href="/track"
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                pathname === "/track"
                  ? "bg-sky-100 text-[#0084C7]"
                  : "text-slate-600 hover:text-[#0084C7]"
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#0084C7]" />
              Track
            </Link>
          </nav>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/complaint/new"
              className="px-3 py-1.5 text-xs font-bold bg-[#0084C7] text-white rounded-lg shadow-sm"
            >
              + Raise
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown: Clean White */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-sky-100 px-4 pt-3 pb-5 space-y-2 text-sm shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-700 font-bold hover:bg-sky-50 hover:text-[#0084C7]"
          >
            Home
          </Link>
          <Link
            href="/complaint/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg font-black text-white bg-[#0084C7]"
          >
            + 1. Raise Complaint
          </Link>
          <Link
            href="/admin/resolve"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg font-bold text-[#0084C7] bg-sky-50 border border-sky-200"
          >
            ⚖️ 2. Resolution Desk
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg font-bold text-slate-800 bg-slate-50 border border-slate-200"
          >
            📊 3. Admin & Analytics Dashboard
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-50"
          >
            🔍 Track by Reference ID
          </Link>
        </div>
      )}
    </header>
  );
}
