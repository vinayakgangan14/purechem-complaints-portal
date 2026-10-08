"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  Phone, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  User, 
  Menu, 
  X,
  Building2,
  CheckCircle2
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState("customer");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentRole(data.user.role || "customer");
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = async (newRole: string) => {
    try {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setCurrentRole(newRole);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const isAdminArea = pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 bg-purechem-navy text-white shadow-md border-b border-slate-700">
      {/* Top Banner: Emergency Hotlines & Location */}
      <div className="bg-purechem-navy-dark text-xs text-slate-300 py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-purechem-orange font-medium">
              <Phone className="w-3.5 h-3.5" />
              Quality Hotline: +234 912 154 0036 / +234 915 065 5555
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-400">Afprint Compound, Isolo, Lagos, Nigeria</span>
          </div>

          {/* Quick Role Switcher for instant evaluation of all 5 internal roles + customer */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden md:inline">Active Persona:</span>
            <select
              value={currentRole}
              onChange={(e) => handleRoleSwitch(e.target.value)}
              className="bg-slate-800 text-white text-xs rounded px-2 py-0.5 border border-slate-600 focus:outline-none focus:border-purechem-orange"
            >
              <option value="customer">Customer / Buyer</option>
              <option value="sales">Sales Team Rep</option>
              <option value="customer_service">Customer Service</option>
              <option value="quality_manager">Quality Manager</option>
              <option value="management">Executive Management</option>
              <option value="super_admin">Super Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-purechem-navy text-xl tracking-tighter">PCM</span>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-tight flex items-center gap-1.5">
                <span>PURECHEM</span>
                <span className="text-purechem-orange font-normal text-xs uppercase px-1.5 py-0.5 bg-purechem-navy-dark rounded border border-purechem-orange/30">
                  Nigeria
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium tracking-wide">
                Customer Complaint & Tracking Portal
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/" ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              Home
            </Link>

            <Link
              href="/track"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname === "/track" ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Search className="w-4 h-4 text-purechem-orange" />
              Track Complaint
            </Link>

            <Link
              href="/portal"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname === "/portal" ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-4 h-4 text-blue-400" />
              My Complaints
            </Link>

            {/* Raise Complaint Action Button */}
            <Link
              href="/complaint/new"
              className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold bg-purechem-orange hover:bg-purechem-orange-dark text-white shadow-sm transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              RAISE COMPLAINT
            </Link>

            {/* Admin Command Link */}
            <Link
              href="/admin"
              className={`ml-2 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 border transition-colors ${
                isAdminArea
                  ? "bg-purechem-orange text-white border-purechem-orange"
                  : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              Admin Portal
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/complaint/new"
              className="px-3 py-1.5 text-xs font-bold bg-purechem-orange text-white rounded shadow-sm"
            >
              Raise
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-purechem-navy-dark border-t border-slate-700 px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Track Complaint
          </Link>
          <Link
            href="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
          >
            My Complaints
          </Link>
          <Link
            href="/complaint/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-bold text-purechem-orange bg-slate-900 border border-purechem-orange/40"
          >
            + Raise New Complaint
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 bg-slate-800"
          >
            Admin Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
