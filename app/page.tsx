"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Search,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ArrowRight,
  PhoneCall,
  Sparkles,
  FileCheck2,
  HelpCircle,
  Truck,
  Building,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [quickTrackId, setQuickTrackId] = useState("");
  const [quickContact, setQuickContact] = useState("");
  const [trackError, setTrackError] = useState("");

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackId.trim() || !quickContact.trim()) {
      setTrackError("Please provide both Complaint Reference ID and your email/phone.");
      return;
    }
    router.push(
      `/track?complaint_id=${encodeURIComponent(quickTrackId.trim())}&query=${encodeURIComponent(quickContact.trim())}`
    );
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purechem-navy via-[#0c2f54] to-purechem-navy-dark text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FF6900_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-slate-200 text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-4 h-4 text-purechem-orange" />
            <span>Purechem Manufacturing Limited • ISO 9001:2008 Certified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Have a problem with a <br className="hidden sm:inline" />
            <span className="text-purechem-orange underline decoration-purechem-orange/40">Purechem product?</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to the official Purechem Quality & Customer Support Portal. We are committed to prompt,
            transparent, and precise resolution across all Nigerian states.
          </p>

          {/* Primary 3 Core Pillar Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <Link
              href="/complaint/new"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-purechem-orange hover:bg-purechem-orange-dark text-white shadow-lg hover:shadow-purechem-orange/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              1. RAISE COMPLAINT
            </Link>

            <Link
              href="/admin/resolve"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              2. RESOLUTION DESK
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShieldCheck className="w-5 h-5 text-blue-300" />
              3. ADMIN & ANALYTICS
            </Link>
          </div>

          {/* Quick Notice */}
          <p className="text-xs text-slate-400">
            Frictionless portal: Raise complaints directly, resolve issues with CAPA timers, or view the executive analytics dashboard.
          </p>
        </div>
      </section>

      {/* Instant Quick-Track Box (Floating card) */}
      <section className="max-w-4xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-50 text-purechem-orange">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Instant Complaint Status Lookup</h2>
              <p className="text-xs text-slate-500">Track your ticket without logging in using your reference number</p>
            </div>
          </div>

          <form onSubmit={handleQuickTrack} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaint Reference ID
              </label>
              <input
                type="text"
                placeholder="e.g. PCM-NG-20261008-0001"
                value={quickTrackId}
                onChange={(e) => setQuickTrackId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email or Phone (+234)
              </label>
              <input
                type="text"
                placeholder="e.g. 0802... or email@company.com"
                value={quickContact}
                onChange={(e) => setQuickContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-purechem-navy hover:bg-purechem-navy-dark text-white font-bold rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                Track Now <ArrowRight className="w-4 h-4 text-purechem-orange" />
              </button>
            </div>
          </form>

          {trackError && (
            <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {trackError}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs text-slate-500">
            <span>Demo Reference: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">PCM-NG-20261008-0001</code> (Verify with: <code className="text-slate-800">+2348023456789</code>)</span>
            <Link href="/portal" className="text-purechem-orange font-semibold hover:underline">
              View All My Complaints →
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Step Resolution Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Purechem Resolves Your Complaint
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Every ticket triggers an automated server-side countdown timer based on West Africa Time (WAT) to guarantee prompt attention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:border-purechem-orange transition-colors">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-purechem-orange font-bold flex items-center justify-center text-lg mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Submit Details</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select product, enter batch details (if available), specify what happened, and attach photos or invoice.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:border-purechem-orange transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Instant Ticket ID</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              System generates reference (e.g. PCM-NG-20261008-0001) and starts the live resolution timer immediately.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:border-purechem-orange transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-lg mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Quality Investigation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our QA lab tests retention samples, performs Root Cause Analysis (RCA), and updates your timeline with email alerts.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:border-purechem-orange transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg mb-4">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Resolution & Feedback</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Timer stops upon resolution. Total resolution time is calculated, and you can rate the resolution quality.
            </p>
          </div>
        </div>
      </section>

      {/* QR Code Feature Spotlight (Section 39) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-purechem-navy text-white rounded-2xl p-8 sm:p-12 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purechem-orange/20 text-purechem-orange text-xs font-semibold">
                <QrCode className="w-4 h-4" /> Packaging QR Code Integration
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Scan & Raise Directly From Drum or Bucket
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Found an issue on site? Purechem product labels feature quick QR codes. Scanning the code on TOPGIT PVC cans, TOP BOND buckets, or resin drums automatically pre-fills the exact product name, pack size, and batch number into your complaint form!
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/complaint/new?product_code=PCM-PVC-003&batch=B260901"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purechem-orange hover:bg-purechem-orange-dark text-white rounded-lg text-sm font-bold shadow transition-colors"
                >
                  <QrCode className="w-4 h-4" /> Simulate QR Scan Pre-Fill
                </Link>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  View My Previous Tickets
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="bg-white p-6 rounded-2xl text-slate-900 shadow-xl max-w-xs text-center space-y-3">
                <div className="w-36 h-36 mx-auto bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-2">
                  {/* Visual QR representation */}
                  <div className="grid grid-cols-5 gap-1 w-28 h-28 p-1 bg-white">
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-purechem-orange rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-white"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-purechem-orange rounded-sm"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-white"></div>
                    <div className="bg-purechem-orange rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800">Purechem Label QR</div>
                <div className="text-[11px] text-slate-500">
                  Instant mobile complaint dispatch without manual typing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences: Customer, Distributor, Sales, Internal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Who Uses This Portal?</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tailored workflows for all stakeholders in Purechem's distribution network.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-purechem-orange font-bold text-sm mb-1 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> End Customers & Builders
            </div>
            <p className="text-xs text-slate-600">
              Carpenters, furniture factories, tiling contractors, and building developers reporting application or performance issues.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-blue-600 font-bold text-sm mb-1 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Dealers & Distributors
            </div>
            <p className="text-xs text-slate-600">
              Major building material and hardware distributors reporting transit damage, leakage, or packaging variances.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-emerald-600 font-bold text-sm mb-1 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" /> Sales Representatives
            </div>
            <p className="text-xs text-slate-600">
              Field sales officers raising complaints on behalf of customers received via phone or WhatsApp field visits.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="text-purple-600 font-bold text-sm mb-1 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4" /> QA & Management
            </div>
            <p className="text-xs text-slate-600">
              Quality managers, lab technicians, and directors tracking SLA targets, recurring batch alerts, and CAPA.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
