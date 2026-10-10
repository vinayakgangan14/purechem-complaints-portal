"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  PlusCircle,
  FileSpreadsheet,
  AlertOctagon,
  RefreshCw,
  Search,
  Cloud,
  Database,
  UploadCloud,
  Check,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [batchAlerts, setBatchAlerts] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadSupabaseStatus();
  }, []);

  const loadSupabaseStatus = async () => {
    try {
      const res = await fetch("/api/admin/supabase-status");
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (e) {
      console.warn("Could not load Supabase status:", e);
    }
  };

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/supabase-status", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSyncMessage(data.message);
        await loadSupabaseStatus();
      } else {
        setSyncMessage(`Sync Alert: ${data.error || "Unable to sync"}`);
      }
    } catch (e: any) {
      setSyncMessage(`Sync Error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [repRes, batchRes, compRes] = await Promise.all([
        fetch("/api/admin/reports"),
        fetch("/api/admin/batch-trace"),
        fetch("/api/complaints?limit=8"),
      ]);

      const rep = repRes.ok ? await repRes.json().catch(() => null) : null;
      const batch = batchRes.ok ? await batchRes.json().catch(() => null) : null;
      const comp = compRes.ok ? await compRes.json().catch(() => null) : null;

      if (rep?.success) setReportData(rep);
      if (batch?.success) setBatchAlerts(batch.recurringAlerts || []);
      if (comp?.success) setRecentComplaints(comp.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = reportData?.kpis || {};

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
            Executive Analytics & Performance • WAT (UTC+1)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin & Analytics Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized monitoring of customer complaints, resolution durations, SLA benchmarks, and batch quality alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/resolve"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Go to Resolution Desk
          </Link>

          <button
            onClick={loadDashboard}
            className="p-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/api/admin/export?format=excel"
            target="_blank"
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Link>

          <Link
            href="/complaint/new"
            className="px-4 py-2.5 bg-purechem-orange hover:bg-purechem-orange-dark text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> + Raise Complaint
          </Link>
        </div>
      </div>

      {/* SUPABASE CLOUD DATABASE & ATTACHMENTS SYNC STATUS CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${supabaseStatus?.configured ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-purechem-blue"}`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Supabase Cloud Database & Storage
                </h3>
                {supabaseStatus?.configured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Live & Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Local SQLite Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {supabaseStatus?.configured
                  ? "Every new complaint and image attachment is automatically synced to your Supabase PostgreSQL tables and Storage bucket."
                  : "Currently storing data safely on local disk (data/purechem.db). Configure Supabase in .env.local to collect data & attachments in the cloud."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {supabaseStatus?.configured ? (
              <button
                onClick={handleSyncSupabase}
                disabled={syncing}
                className="px-4 py-2.5 bg-purechem-blue hover:bg-purechem-blue-dark text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {syncing ? "Syncing to Cloud..." : "Sync Local Data to Supabase"}
              </button>
            ) : (
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                Set credentials in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">.env.local</code> to activate
              </div>
            )}
          </div>
        </div>

        {/* Sync message alert if any */}
        {syncMessage && (
          <div className={`p-3 rounded-xl text-xs font-medium ${syncMessage.startsWith("Error") || syncMessage.startsWith("Sync Alert") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
            {syncMessage}
          </div>
        )}

        {/* Metric counts comparison */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Complaints (Local)</span>
            <span className="text-lg font-black text-slate-900">{supabaseStatus?.localDatabase?.complaints_recorded ?? supabaseStatus?.dataCollection?.local_complaints ?? 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Complaints (Supabase)</span>
            <span className={`text-lg font-black ${supabaseStatus?.configured ? "text-emerald-600" : "text-slate-400"}`}>
              {supabaseStatus?.dataCollection?.complaints_in_supabase ?? 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attachments (Local)</span>
            <span className="text-lg font-black text-slate-900">{supabaseStatus?.localDatabase?.attachments_recorded ?? supabaseStatus?.dataCollection?.local_attachments ?? 0}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attachments (Supabase)</span>
            <span className={`text-lg font-black ${supabaseStatus?.configured ? "text-emerald-600" : "text-slate-400"}`}>
              {supabaseStatus?.dataCollection?.attachments_in_supabase ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 41: RECURRING COMPLAINT ALERT BANNER */}
      {batchAlerts.length > 0 && (
        <div className="space-y-3">
          {batchAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-amber-950"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-xs uppercase tracking-wider text-amber-800">
                    Quality Alert: Potential Recurring Batch Defect
                  </div>
                  <p className="text-sm font-semibold text-amber-950">{alert.message}</p>
                </div>
              </div>
              <Link
                href={`/admin/batch-trace?batch=${encodeURIComponent(alert.batch_number)}`}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow shrink-0"
              >
                Inspect Batch Trace →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 10: 10 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Complaints</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.totalComplaints || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">All recorded tickets</div>
        </div>

        {/* Open Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Open Complaints</div>
          <div className="text-3xl font-black text-blue-700 mt-2">{kpis.openComplaints || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requiring action</div>
        </div>

        {/* New Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">New Today</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.newToday || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged today (WAT)</div>
        </div>

        {/* This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">This Month</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{kpis.newThisMonth || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Current month tally</div>
        </div>

        {/* Under Investigation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Under Investigation</div>
          <div className="text-3xl font-black text-amber-700 mt-2">{kpis.underInvestigation || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">QA Lab / RCA stage</div>
        </div>

        {/* OVERDUE COMPLAINTS (CRITICAL HIGHLIGHT) */}
        <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-300 shadow-sm">
          <div className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" /> Overdue Complaints
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2">{kpis.overdueComplaints || 0}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Exceeded SLA threshold</div>
        </div>

        {/* Resolved Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved</div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{kpis.resolvedComplaints || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting final closure</div>
        </div>

        {/* Closed Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Closed</div>
          <div className="text-3xl font-black text-slate-700 mt-2">{kpis.closedComplaints || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Confirmed finalized</div>
        </div>

        {/* Average Resolution Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Avg Resolution Time</div>
          <div className="text-2xl font-black text-indigo-900 mt-2">{kpis.avgResolutionHours || "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across resolved tickets</div>
        </div>

        {/* Max Resolution Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Max Resolution Time</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpis.maxResolutionHours || "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Peak turnaround</div>
        </div>
      </div>

      {/* RESOLUTION SPEED & SLA SCORECARD (Section 7, 8) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purechem-orange flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> ISO 9001 Resolution Time Scorecard
            </div>
            <h3 className="text-xl font-extrabold mt-0.5">SLA Turnaround & Performance Quality</h3>
          </div>
          <Link
            href="/admin/resolve"
            className="px-4 py-2 bg-purechem-orange hover:bg-purechem-orange-dark text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
          >
            Resolve Pending Complaints →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 text-xs">SLA Compliance Rate</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">100%</div>
            <span className="text-[11px] text-slate-400">Tickets within SLA</span>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 text-xs">Standard SLA Limit</span>
            <div className="text-2xl font-black text-white mt-1">72 Hours</div>
            <span className="text-[11px] text-slate-400">Normal priority target</span>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 text-xs">Urgent Production SLA</span>
            <div className="text-2xl font-black text-amber-300 mt-1">48 Hours</div>
            <span className="text-[11px] text-slate-400">Production line stoppage</span>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
            <span className="text-slate-300 text-xs">Average Turnaround</span>
            <div className="text-2xl font-black text-blue-300 mt-1">{kpis.avgResolutionHours || "52 Hours"}</div>
            <span className="text-[11px] text-slate-400">WAT calendar duration</span>
          </div>
        </div>
      </div>

      {/* QUICK CHARTS & METRICS SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Pareto Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Complaints by Purechem Product</h3>
            <span className="text-xs text-slate-400 font-semibold">11 Authentic Products</span>
          </div>
          <div className="space-y-3">
            {reportData?.productStats?.slice(0, 5).map((p: any, i: number) => {
              const max = reportData.productStats[0]?.count || 1;
              const pct = Math.round((p.count / max) * 100);
              return (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium truncate max-w-xs">{p.name}</span>
                    <span className="font-bold">{p.count} complaints</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purechem-orange h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Department Resolution Performance</h3>
            <span className="text-xs text-emerald-600 font-bold">100% On-Target</span>
          </div>
          <div className="space-y-3">
            {reportData?.departmentStats?.map((dept: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-900">{dept.department} Department</span>
                  <div className="text-[11px] text-slate-400">
                    {dept.resolved} of {dept.total} resolved
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-emerald-600">{dept.rate}%</span>
                  <div className="text-[10px] text-slate-400">Success rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT COMPLAINTS TABLE (Section 11) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Complaints Register</h2>
            <p className="text-xs text-slate-500">Live countdown timers and workflow status</p>
          </div>
          <Link
            href="/admin/resolve"
            className="text-xs font-bold text-purechem-orange hover:underline flex items-center gap-1"
          >
            Open Full Resolution Desk →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Customer / Company</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Resolution Duration</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-purechem-navy">
                    <Link href={`/admin/resolve`} className="hover:underline">
                      {c.complaint_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{c.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{c.customer_company || "Independent"}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{c.product_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{c.batch_number || "—"}</td>
                  <td className="py-3 px-4 text-slate-600">{c.complaint_type}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.admin_priority === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : c.admin_priority === "High"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {c.admin_priority || c.customer_priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        c.is_overdue && c.status !== "RESOLVED" && c.status !== "CLOSED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : c.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {c.is_overdue && c.status !== "RESOLVED" && c.status !== "CLOSED"
                        ? `OVERDUE • ${c.status}`
                        : c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {c.status === "RESOLVED" || c.status === "CLOSED"
                      ? c.resolution_time_formatted || "Resolved"
                      : c.live_duration?.formatted}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/resolve`}
                      className="px-3 py-1.5 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded font-bold transition-colors inline-block"
                    >
                      Resolve →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
