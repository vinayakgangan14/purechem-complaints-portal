"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  Building,
  User,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function CustomerPortalPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>({
    name: "Mr. Adebayo Ogunleye",
    company: "Ikeja Woodworking Hub Lagos",
    email: "adebayo@ikejawood.com",
    phone: "+2348023456789",
  });
  const [filterEmail, setFilterEmail] = useState("adebayo@ikejawood.com");

  useEffect(() => {
    loadCustomerData(filterEmail);
  }, [filterEmail]);

  const loadCustomerData = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints?customer_email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = (email: string, name: string, company: string, phone: string) => {
    setCurrentUser({ name, company, email, phone });
    setFilterEmail(email);
  };

  // KPI Calculations
  const total = complaints.length;
  const openCount = complaints.filter((c) => c.status === "OPEN" || c.status === "ACKNOWLEDGED").length;
  const inProgress = complaints.filter((c) =>
    ["ASSIGNED", "INVESTIGATION", "SAMPLE REQUIRED", "UNDER TESTING", "ROOT CAUSE ANALYSIS", "ACTION IN PROGRESS"].includes(
      c.status
    )
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const latestComplaint = complaints[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purechem-orange uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" /> Purechem Customer Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {currentUser.company} • Contact: {currentUser.email} ({currentUser.phone})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/complaint/new"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-purechem-orange hover:bg-purechem-orange-dark text-white font-extrabold rounded-xl shadow transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            RAISE NEW COMPLAINT
          </Link>
        </div>
      </div>

      {/* Customer Account Switcher for Demo / Testing */}
      <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <User className="w-4 h-4 text-purechem-orange" /> Switch Sample Customer Account:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleSwitchAccount(
                "adebayo@ikejawood.com",
                "Mr. Adebayo Ogunleye",
                "Ikeja Woodworking Hub Lagos",
                "+2348023456789"
              )
            }
            className={`px-3 py-1 rounded-lg border font-medium ${
              filterEmail === "adebayo@ikejawood.com"
                ? "bg-purechem-navy text-white border-purechem-navy"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Adebayo Ogunleye (Lagos)
          </button>
          <button
            onClick={() =>
              handleSwitchAccount(
                "eze@ezebuilders.com",
                "Chief Emeka Eze",
                "Eze & Sons Construction Onitsha",
                "+2348067788990"
              )
            }
            className={`px-3 py-1 rounded-lg border font-medium ${
              filterEmail === "eze@ezebuilders.com"
                ? "bg-purechem-navy text-white border-purechem-navy"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Chief Emeka Eze (Onitsha)
          </button>
          <button
            onClick={() =>
              handleSwitchAccount(
                "danladi@kaborfurniture.ng",
                "Alhaji Danladi Musa",
                "Kabor Furniture Works Kano",
                "+2348035544332"
              )
            }
            className={`px-3 py-1 rounded-lg border font-medium ${
              filterEmail === "danladi@kaborfurniture.ng"
                ? "bg-purechem-navy text-white border-purechem-navy"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Alhaji Danladi Musa (Kano)
          </button>
        </div>
      </div>

      {/* KPI Cards (Section 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Complaints Raised</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1">All time records</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase">Open / Acknowledged</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">{openCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Initial assessment stage</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase">Investigation / Testing</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">{inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lab RCA & Action in progress</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase">Resolved & Closed</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Completed resolution</div>
        </div>
      </div>

      {/* Latest Complaint Feature Card */}
      {latestComplaint && (
        <div className="bg-gradient-to-r from-slate-900 to-purechem-navy text-white rounded-2xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs text-purechem-orange font-bold uppercase tracking-wider">
                Latest Active Complaint
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {latestComplaint.product_name} • Ref: {latestComplaint.complaint_number}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-2">
                {latestComplaint.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Current Timer (WAT)</div>
                <div className="text-sm font-mono font-bold text-purechem-orange">
                  {latestComplaint.status === "RESOLVED" || latestComplaint.status === "CLOSED"
                    ? latestComplaint.resolution_time_formatted || "Resolved"
                    : latestComplaint.live_duration?.formatted}
                </div>
              </div>
              <Link
                href={`/complaint/${latestComplaint.id}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Track →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MY COMPLAINTS TABLE (Section 17) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">My Registered Complaints</h2>
          <span className="text-xs text-slate-500">Showing {complaints.length} tickets</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-600 font-medium">No complaints registered under this account.</p>
            <Link
              href="/complaint/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purechem-orange text-white text-xs font-bold rounded-lg"
            >
              <PlusCircle className="w-4 h-4" /> Raise Your First Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3.5 px-4">Complaint ID</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Registration Date (WAT)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Resolution Duration</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purechem-navy">
                      <Link href={`/complaint/${c.id}`} className="hover:underline">
                        {c.complaint_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{c.product_name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{c.batch_number || "—"}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(c.complaint_open_time).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          c.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "CLOSED"
                            ? "bg-slate-100 text-slate-800"
                            : c.is_overdue
                            ? "bg-rose-100 text-rose-800"
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
                        href={`/complaint/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-purechem-navy hover:text-white rounded text-slate-700 font-semibold transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
