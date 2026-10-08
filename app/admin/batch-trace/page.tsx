"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  AlertTriangle,
  Search,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

function BatchTraceContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlBatch = searchParams.get("batch");
    if (urlBatch) {
      setSearchTerm(urlBatch);
      fetchTrace(urlBatch);
    } else {
      fetchTrace("");
    }
  }, [searchParams]);

  const fetchTrace = async (batch: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/batch-trace?batch=${encodeURIComponent(batch)}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrace(searchTerm.trim());
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" /> Quality Assurance & Traceability (Sections 40 & 41)
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Batch Traceability & Recurring Issue Detector
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track multi-customer defect clusters across manufacturing batches, factory shifts, and resin blends.
        </p>
      </div>

      {/* RECURRING ISSUE CRITICAL ALERTS BANNER (Section 41) */}
      {data?.recurringAlerts?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
            Detected Multi-Customer Batch Clusters (Immediate QA Action)
          </h2>
          {data.recurringAlerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              className="bg-rose-50 border-2 border-rose-300 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-rose-950"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                    High Risk: Recurring Batch Quality Variance
                  </div>
                  <p className="text-sm font-bold text-rose-950">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSearchTerm(alert.batch_number);
                  fetchTrace(alert.batch_number);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0"
              >
                Inspect Linked Complaints →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Batch Search Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Batch Number (e.g. B260901, BB260710)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded-xl text-xs font-bold shadow transition-colors"
          >
            Trace Batch History
          </button>
        </form>
      </div>

      {/* SPECIFIC TRACE RESULTS (IF SEARCHED) */}
      {searchTerm && data?.specificTrace && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Batch Trace History</span>
              <h3 className="text-lg font-mono font-black text-slate-900">
                Batch: {searchTerm} ({data.specificTrace.length} complaints recorded)
              </h3>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                fetchTrace("");
              }}
              className="text-xs text-purechem-orange font-bold hover:underline"
            >
              Clear filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Complaint Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date (WAT)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.specificTrace.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-purechem-navy">
                      <Link href={`/admin/complaints/${c.id}`} className="hover:underline">
                        {c.complaint_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.customer_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.customer_company || "N/A"}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.product_name}</td>
                    <td className="py-3 px-4 text-slate-700">{c.complaint_type}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatWAT(c.complaint_open_time, false)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/complaints/${c.id}`}
                        className="px-2.5 py-1 bg-purechem-navy text-white rounded text-[11px] font-bold inline-block"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALL BATCHES SUMMARY TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">All Product Batches Under QA Surveillance</h2>
            <p className="text-xs text-slate-500">Batches with customer complaint logs in chronological order</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Analyzing batches...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Total Complaints</th>
                  <th className="py-3 px-4 text-center">Distinct Customers</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data?.batchAggregates?.map((b: any, idx: number) => {
                  const isRecurring = b.total_complaints >= 2;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-purechem-navy text-sm">
                        {b.batch_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{b.product_name}</td>
                      <td className="py-3 px-4 text-slate-500">{b.product_category}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm">
                        {b.total_complaints}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                        {b.distinct_customers} Accounts
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            b.total_complaints >= 3
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : b.total_complaints === 2
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {b.total_complaints >= 3 ? "CRITICAL RECURRENCE" : b.total_complaints === 2 ? "POTENTIAL RECURRENCE" : "ISOLATED DEFECT"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSearchTerm(b.batch_number);
                            fetchTrace(b.batch_number);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-purechem-navy hover:text-white rounded font-bold transition-colors text-[11px]"
                        >
                          Trace →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatchTracePage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-slate-500 text-xs">Loading batch traceability...</div>}>
      <BatchTraceContent />
    </React.Suspense>
  );
}
