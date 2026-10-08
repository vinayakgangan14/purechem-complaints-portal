"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Building,
  RefreshCw,
} from "lucide-react";

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {};

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purechem-orange uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> ISO Quality Reporting & Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quality & Resolution Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Turnaround duration metrics, product Pareto analysis, and department SLA compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/api/admin/export?format=excel"
            target="_blank"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download Complete Excel Report
          </Link>
          <Link
            href="/api/admin/export?format=csv"
            target="_blank"
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> CSV Format
          </Link>
        </div>
      </div>

      {/* RESOLUTION PERFORMANCE SUMMARY CARDS (Section 21) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Average Resolution Time</div>
          <div className="text-2xl sm:text-3xl font-black text-purechem-navy mt-2">
            {kpis.avgResolutionHours || "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">From ticket open to resolution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Fastest Resolution (Min)</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {kpis.minResolutionHours || "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Best response turnaround</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-600 uppercase">Peak Resolution (Max)</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {kpis.maxResolutionHours || "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Complex lab investigations</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-rose-600 uppercase">SLA Target Breach (Overdue)</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
            {kpis.overdueComplaints || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Complaints exceeding SLA</div>
        </div>
      </div>

      {/* PRODUCT-WISE & CATEGORY ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Pareto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Product-Wise Complaints Volume</span>
            <span className="text-xs text-slate-400">Total Products: {data?.productStats?.length || 0}</span>
          </h3>
          <div className="space-y-3">
            {data?.productStats?.map((prod: any, idx: number) => {
              const max = data.productStats[0]?.count || 1;
              const pct = Math.round((prod.count / max) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">{prod.name}</span>
                    <span className="font-bold text-slate-900">{prod.count} complaints</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purechem-orange h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complaint Type Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>Defect & Complaint Type Distribution</span>
            <span className="text-xs text-slate-400">Breakdown</span>
          </h3>
          <div className="space-y-3">
            {data?.typeStats?.map((type: any, idx: number) => {
              const max = data.typeStats[0]?.count || 1;
              const pct = Math.round((type.count / max) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">{type.name}</span>
                    <span className="font-bold text-slate-900">{type.count} issues</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DEPARTMENT PERFORMANCE & MONTHLY TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department SLA Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Department Resolution Performance</h3>
          <div className="space-y-3">
            {data?.departmentStats?.map((dept: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{dept.department} Team</div>
                  <div className="text-slate-500">
                    {dept.resolved} resolved out of {dept.total} assigned
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-emerald-600">{dept.rate}%</div>
                  <div className="text-[10px] text-slate-400">Resolution Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Complaint Trajectory</h3>
          <div className="space-y-3">
            {data?.monthlyStats?.map((m: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{m.month}</span>
                <span className="px-3 py-1 bg-purechem-navy text-white rounded-lg font-bold">
                  {m.count} Registered
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
