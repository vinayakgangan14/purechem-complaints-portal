"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Check,
  Send,
  FileText,
  User,
  Building,
  Package,
  Calendar,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

export default function ComplaintResolutionDeskPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Active Resolution & CAPA Form State
  const [resolvingStatus, setResolvingStatus] = useState("RESOLVED");
  const [rca, setRca] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [assignedDept, setAssignedDept] = useState("Quality");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");

  // Timeline Note Form State
  const [newNote, setNewNote] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedComplaintId) {
      fetchComplaintDetail(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const fetchComplaints = async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        // Auto-select first complaint if none selected
        if (!selectedComplaintId && data.complaints?.length > 0) {
          setSelectedComplaintId(data.complaints[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchComplaintDetail = async (id: string) => {
    setLoadingDetail(true);
    setActionSuccessMessage("");
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      if (data.success && data.complaint) {
        setSelectedDetail(data);
        setRca(data.complaint.root_cause || "");
        setCorrectiveAction(data.complaint.corrective_action || "");
        setPreventiveAction(data.complaint.preventive_action || "");
        setResolutionDetails(data.complaint.resolution_details || "");
        setAssignedDept(data.complaint.assigned_department || "Quality");
        setAssignedStaff(data.complaint.assigned_to || "");
        setResolvingStatus(data.complaint.status === "RESOLVED" || data.complaint.status === "CLOSED" ? data.complaint.status : "RESOLVED");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Quick Status Transition (ISO 11-step)
  const handleQuickStatusChange = async (targetStatus: string) => {
    if (!selectedDetail?.complaint) return;
    setActionErrorMessage("");
    setActionSuccessMessage("");
    try {
      const res = await fetch(`/api/complaints/${selectedDetail.complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          action_comment: `Status transitioned to ${targetStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`✓ Status updated to ${targetStatus}`);
        fetchComplaintDetail(selectedDetail.complaint.id);
        fetchComplaints();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setActionErrorMessage(e.message || "Failed to update status");
    }
  };

  // Submit Final Resolution & Stop Timer
  const handleFinalizeResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetail?.complaint) return;
    if (!resolutionDetails.trim()) {
      setActionErrorMessage("Please provide resolution details.");
      return;
    }

    setIsSubmittingResolution(true);
    setActionErrorMessage("");
    setActionSuccessMessage("");

    try {
      const res = await fetch(`/api/complaints/${selectedDetail.complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resolvingStatus,
          resolution_details: resolutionDetails.trim(),
          root_cause: rca.trim(),
          corrective_action: correctiveAction.trim(),
          preventive_action: preventiveAction.trim(),
          assigned_department: assignedDept,
          assigned_to: assignedStaff,
          action_comment: `Complaint finalized as ${resolvingStatus}. Resolution timer stopped.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`🎉 Complaint marked as ${resolvingStatus}! Timer stopped.`);
        fetchComplaintDetail(selectedDetail.complaint.id);
        fetchComplaints();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setActionErrorMessage(e.message || "Failed to save resolution");
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  // Post Investigation / Lab Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedDetail?.complaint) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/complaints/${selectedDetail.complaint.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isInternalNote ? "Internal QA Lab Note" : "Customer Communication",
          comment: newNote.trim(),
          is_internal_only: isInternalNote ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote("");
        fetchComplaintDetail(selectedDetail.complaint.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingNote(false);
    }
  };

  const c = selectedDetail?.complaint;
  const isResolved = c?.status === "RESOLVED" || c?.status === "CLOSED";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-purechem-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" /> Resolution Desk • West Africa Time (WAT)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaint Resolution Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            One-stop desk to investigate complaints, record Root Cause & CAPA, and finalize resolution to stop the SLA clock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchComplaints();
              if (selectedComplaintId) fetchComplaintDetail(selectedComplaintId);
            }}
            className="p-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/api/admin/export?format=excel"
            target="_blank"
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Link>
          <Link
            href="/complaint/new"
            className="px-4 py-2.5 bg-purechem-orange hover:bg-purechem-orange-dark text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> + Raise New Complaint
          </Link>
        </div>
      </div>

      {/* Main Resolution Workspace Layout: Left Column (List) + Right Column (Resolution Desk) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Complaint Selector & Filters (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Ref ID, Customer, Batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-slate-50"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER TESTING">Under Testing</option>
                <option value="INVESTIGATION">Investigation</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="Urgent">Urgent (48h)</option>
                <option value="Normal">Normal (72h)</option>
              </select>
            </div>
          </div>

          {/* Complaints List Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading complaints...</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <div>No complaints match your filters.</div>
                <button onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); }} className="text-purechem-orange font-bold hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              complaints.map((item) => {
                const isSelected = item.id === selectedComplaintId;
                const isOverdue = item.is_overdue === 1;
                const isDone = item.status === "RESOLVED" || item.status === "CLOSED";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedComplaintId(item.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-orange-50/80 border-l-4 border-purechem-orange"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-purechem-navy">
                        {item.complaint_number}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : isOverdue
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : item.status === "UNDER TESTING"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {item.product_name}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.customer_name} {item.customer_company ? `• ${item.customer_company}` : ""}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      <span>Batch: <strong className="text-slate-600">{item.batch_number || "N/A"}</strong></span>
                      <span className="flex items-center gap-1 font-mono font-medium text-slate-600">
                        <Clock className="w-3 h-3 text-purechem-orange" />
                        {isDone ? item.resolution_time_formatted || "Resolved" : item.live_duration?.formatted || "Active"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Complaint Detail & Resolution Desk (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {!c ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-sm text-slate-600">No Complaint Selected</div>
              <p className="text-xs">Click on any complaint from the list on the left to inspect and resolve it.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Messages / Alerts */}
              {actionSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}
              {actionErrorMessage && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionErrorMessage}</span>
                </div>
              )}

              {/* CARD 1: Reference Header & Timer Clock */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Reference Number
                    </span>
                    <div className="text-2xl font-black font-mono text-purechem-navy tracking-tight">
                      {c.complaint_number}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        isResolved
                          ? "bg-emerald-100 text-emerald-800"
                          : c.is_overdue === 1
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {c.customer_priority} Priority ({c.target_resolution_hours || 72}h SLA)
                    </span>
                  </div>
                </div>

                {/* Resolution Timer Banner */}
                <div
                  className={`p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    isResolved
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-950"
                      : c.is_overdue === 1
                      ? "bg-rose-50 border border-rose-200 text-rose-950"
                      : "bg-orange-50 border border-orange-200 text-orange-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock
                      className={`w-5 h-5 ${
                        isResolved
                          ? "text-emerald-600"
                          : c.is_overdue === 1
                          ? "text-rose-600 animate-pulse"
                          : "text-purechem-orange"
                      }`}
                    />
                    <div>
                      <div className="font-extrabold text-xs uppercase tracking-wider">
                        {isResolved ? "Total Resolution Duration (Timer Stopped)" : "Live Resolution Clock (WAT / UTC+1)"}
                      </div>
                      <div className="text-lg font-mono font-black mt-0.5">
                        {isResolved
                          ? c.resolution_time_formatted || "Resolved"
                          : c.live_duration?.formatted || "Calculating..."}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>Opened: {formatWAT(c.complaint_open_time)}</div>
                    {c.resolved_at && <div>Resolved: {formatWAT(c.resolved_at)}</div>}
                  </div>
                </div>

                {/* Quick Status Workflow Step Buttons */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quick ISO Status Progression:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["ACKNOWLEDGED", "UNDER TESTING", "INVESTIGATION", "ACTION IN PROGRESS"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(st)}
                        disabled={c.status === st || isResolved}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          c.status === st
                            ? "bg-purechem-navy text-white shadow"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD 2: Product & Customer Context */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purechem-orange" />
                  Product & Customer Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Product Name:</span>
                    <strong className="text-slate-900 text-sm">{c.product_name}</strong>
                    <div className="text-slate-500 text-[11px]">{c.product_category}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Batch & Packaging:</span>
                    <strong className="text-slate-800 font-mono">Batch: {c.batch_number || "Not specified"}</strong>
                    <div className="text-slate-500 text-[11px]">Pack: {c.pack_size || "N/A"} • Qty: {c.quantity_purchased || "N/A"}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Contact:</span>
                    <strong className="text-slate-900">{c.customer_name}</strong>
                    <div className="text-slate-600">{c.customer_company || "Independent"}</div>
                    <div className="text-slate-500 text-[11px]">{c.customer_email} • {c.customer_phone}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Defect Classification:</span>
                    <strong className="text-rose-700 text-sm">{c.complaint_type}</strong>
                    <div className="text-slate-500 text-[11px]">
                      Raised By: {c.raised_by_role} ({c.raised_by_name || c.customer_name})
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-semibold block text-[11px] mb-1">Customer Issue Description:</span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
              </div>

              {/* CARD 3: RESOLUTION & CAPA ACTION FORM (The core resolution desk!) */}
              <div className="bg-gradient-to-br from-white to-orange-50/40 rounded-2xl border-2 border-purechem-orange/30 shadow-md p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purechem-orange" />
                      Resolution & CAPA Form (Stop Timer)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Submit findings, Root Cause Analysis, and corrective action to resolve and stop the SLA clock.
                    </p>
                  </div>
                  {isResolved && (
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-lg">
                      RESOLVED
                    </span>
                  )}
                </div>

                <form onSubmit={handleFinalizeResolution} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Final Status *</label>
                      <select
                        value={resolvingStatus}
                        onChange={(e) => setResolvingStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold bg-white text-slate-800"
                      >
                        <option value="RESOLVED">RESOLVED (Complete)</option>
                        <option value="CLOSED">CLOSED (Archived)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                      <input
                        type="text"
                        value={assignedDept}
                        onChange={(e) => setAssignedDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        placeholder="e.g. Quality Assurance / QA Lab"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assigned Specialist</label>
                      <input
                        type="text"
                        value={assignedStaff}
                        onChange={(e) => setAssignedStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        placeholder="e.g. Dr. Chioma Okonkwo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Root Cause Analysis (RCA)
                    </label>
                    <textarea
                      rows={2}
                      value={rca}
                      onChange={(e) => setRca(e.target.value)}
                      placeholder="e.g. Temperature fluctuation in storage room, or seal liner defect during filling shift 2..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Corrective Action (Immediate Fix)
                      </label>
                      <textarea
                        rows={2}
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        placeholder="e.g. Replaced 5 defective drums, re-adjusted batch formulation..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Preventive Action (Long-Term CAPA)
                      </label>
                      <textarea
                        rows={2}
                        value={preventiveAction}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        placeholder="e.g. Calibrated viscosity meters, enhanced sealing SOP at factory..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Final Resolution Summary * <span className="text-slate-400 font-normal">(Shared with customer and logged in audit report)</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={resolutionDetails}
                      onChange={(e) => setResolutionDetails(e.target.value)}
                      placeholder="e.g. Technical QA team visited client site and verified full adhesion recovery after optimizing applicator temperature..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingResolution}
                      className="px-8 py-3 bg-purechem-orange hover:bg-purechem-orange-dark text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {isSubmittingResolution ? "Finalizing & Stopping Timer..." : "MARK AS RESOLVED (STOP TIMER)"}
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 4: Timeline & Notes (Investigation history) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purechem-orange" />
                  Investigation Notes & Timeline Audit
                </h3>

                {/* Add New Note Box */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={isInternalNote ? "Add internal QA lab note (Confidential)..." : "Add public note..."}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      isInternalNote
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {isInternalNote ? "🔒 Internal QA" : "Public"}
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingNote}
                    className="px-4 py-2 bg-purechem-navy hover:bg-purechem-navy-dark text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>

                {/* Timeline Items */}
                <div className="space-y-3 pt-2">
                  {selectedDetail?.timeline?.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs ${
                        item.is_internal_only
                          ? "bg-amber-50/60 border-amber-200 text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="flex items-center gap-1.5">
                          {item.is_internal_only && <Lock className="w-3 h-3 text-amber-600" />}
                          {item.action}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {formatWAT(item.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{item.comment}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        By {item.performed_by} ({item.performed_by_role || "Staff"})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
