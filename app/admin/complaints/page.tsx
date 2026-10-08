"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  AlertOctagon,
  RefreshCw,
  PlusCircle,
  Building,
  CheckCircle2,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [searchTerm, filterStatus, filterCategory, filterPriority, filterOverdue]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.categories) {
        setCategoriesList(data.categories.map((c: any) => c.name));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterStatus) params.append("status", filterStatus);
      if (filterCategory) params.append("category", filterCategory);
      if (filterPriority) params.append("priority", filterPriority);
      if (filterOverdue) params.append("overdue", "true");

      const res = await fetch(`/api/complaints?${params.toString()}`);
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

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterCategory("");
    setFilterPriority("");
    setFilterOverdue(false);
  };

  return (
    <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Central Complaints Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete database of Purechem customer complaints, ISO status workflows, and resolution timers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/api/admin/export?format=csv"
            target="_blank"
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export CSV
          </Link>
          <Link
            href="/api/admin/export?format=excel"
            target="_blank"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (.xlsx)
          </Link>
          <Link
            href="/admin/sales/new-complaint"
            className="px-3.5 py-2 bg-purechem-orange hover:bg-purechem-orange-dark text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Raise for Customer
          </Link>
        </div>
      </div>

      {/* FILTER CONTROLS BAR (Section 11) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search text */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Search by ID, Customer, Batch, or Issue
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. PCM-NG..., B260901, Julius Berger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
            >
              <option value="">All Workflow Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="INVESTIGATION">INVESTIGATION</option>
              <option value="CUSTOMER INFORMATION REQUIRED">INFO REQUIRED</option>
              <option value="SAMPLE REQUIRED">SAMPLE REQUIRED</option>
              <option value="UNDER TESTING">UNDER TESTING</option>
              <option value="ROOT CAUSE ANALYSIS">ROOT CAUSE ANALYSIS</option>
              <option value="ACTION IN PROGRESS">ACTION IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Product Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Priority Level</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical (24h)</option>
              <option value="High">High / Urgent (48h)</option>
              <option value="Medium">Medium (72h)</option>
              <option value="Low">Low (96h)</option>
            </select>
          </div>
        </div>

        {/* Additional Toggle / Clear */}
        <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
            <input
              type="checkbox"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span>Show ONLY Overdue Complaints (Exceeded SLA Target)</span>
          </label>

          <button
            onClick={clearFilters}
            className="text-slate-500 hover:text-slate-800 font-semibold underline text-xs"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* COMPLAINTS TABLE (Section 11) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600">
          <span>Found {complaints.length} complaint records</span>
          <span>Timestamps displayed in West Africa Time (WAT)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading complaints register...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No complaints match your selected filters.</p>
            <button onClick={clearFilters} className="text-xs text-purechem-orange font-bold hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Complaint ID</th>
                  <th className="py-3 px-3">Date (WAT)</th>
                  <th className="py-3 px-3">Customer / Company</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Batch</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3">Resolution Duration</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Complaint ID */}
                    <td className="py-3 px-3 font-mono font-extrabold text-purechem-navy">
                      <Link href={`/admin/complaints/${c.id}`} className="hover:underline">
                        {c.complaint_number}
                      </Link>
                    </td>

                    {/* Date (WAT) */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatWAT(c.complaint_open_time, false)}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{c.customer_company || "Independent"}</div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <div>{c.customer_phone}</div>
                      <div className="text-slate-400 truncate max-w-[120px]">{c.customer_email}</div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <div>{c.product_name}</div>
                      <div className="text-[10px] text-slate-400">{c.product_category}</div>
                    </td>

                    {/* Batch Number */}
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {c.batch_number || "—"}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-slate-700">{c.complaint_type}</td>

                    {/* Priority */}
                    <td className="py-3 px-3">
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

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          c.is_overdue && c.status !== "RESOLVED" && c.status !== "CLOSED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : c.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "CLOSED"
                            ? "bg-slate-200 text-slate-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {c.is_overdue && c.status !== "RESOLVED" && c.status !== "CLOSED"
                          ? `OVERDUE • ${c.status}`
                          : c.status}
                      </span>
                    </td>

                    {/* Assigned To */}
                    <td className="py-3 px-3 text-slate-700">
                      <div>{c.assigned_to || "Unassigned"}</div>
                      <div className="text-[10px] text-slate-400">{c.assigned_department || "Quality"}</div>
                    </td>

                    {/* Resolution Duration */}
                    <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap font-medium">
                      {c.status === "RESOLVED" || c.status === "CLOSED"
                        ? c.resolution_time_formatted || "Resolved"
                        : c.live_duration?.formatted}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/complaints/${c.id}`}
                        className="px-2.5 py-1 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded font-bold transition-colors inline-block text-[11px]"
                      >
                        Open
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
