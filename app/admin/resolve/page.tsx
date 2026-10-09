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
  FlaskConical,
  X,
  ClipboardCheck,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

const PURECHEM_PRODUCTS = [
  "TOP BOND White Glue",
  "TOPGIT",
  "TOPGUM & Craft Glue",
  "812M/GS1100 Beer Bottel labelling adhesive",
  "Construction Chemicals & Grinding Aids",
  "Tile Adhesive & Grout",
  "Waterproofing Solutions",
  "Wires and Cables",
  "Solvent Base Adhesive PU",
  "Solvent Free Adhesive PU",
  "Inkbinder PU",
  "Other Purechem Product",
];

export default function ComplaintResolutionDeskPage() {
  const [deskTab, setDeskTab] = useState<"cases" | "qc_register">("cases");

  // Complaint States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filter States for Complaints
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Resolution Form State (First Information, Immediate Resolution, Suggestions)
  const [resolvingStatus, setResolvingStatus] = useState("RESOLVED");
  const [firstInformation, setFirstInformation] = useState(""); // Replaced RCA
  const [immediateResolution, setImmediateResolution] = useState(""); // Replaced Corrective Action
  const [suggestions, setSuggestions] = useState(""); // Replaced Preventive Action
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
  const [noteSuccessMessage, setNoteSuccessMessage] = useState("");

  // QC Batch Register States
  const [qcBatches, setQcBatches] = useState<any[]>([]);
  const [loadingQC, setLoadingQC] = useState(false);
  const [qcSearch, setQcSearch] = useState("");
  const [qcStatusFilter, setQcStatusFilter] = useState("ALL");

  // QC Modal State
  const [showQCModal, setShowQCModal] = useState(false);
  const [isSavingQC, setIsSavingQC] = useState(false);
  const [qcModalSuccess, setQcModalSuccess] = useState("");
  const [qcModalError, setQcModalError] = useState("");
  const [qcForm, setQcForm] = useState({
    product_name: "TOP BOND White Glue",
    batch_number: "",
    viscosity: "",
    colour: "",
    solids: "",
    qc_status: "Passed",
    manufacturing_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    tested_by: "Dr. Chioma Okonkwo (QC)",
    remarks: "",
  });

  useEffect(() => {
    fetchComplaints();
    fetchQCBatches();
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
    setNoteSuccessMessage("");
    try {
      // Pass include_internal=true so internal QA notes are always returned
      const res = await fetch(`/api/complaints/${id}?include_internal=true`);
      const data = await res.json();
      if (data.success && data.complaint) {
        setSelectedDetail(data);
        setFirstInformation(data.complaint.root_cause || "");
        setImmediateResolution(data.complaint.corrective_action || "");
        setSuggestions(data.complaint.preventive_action || "");
        setResolutionDetails(data.complaint.resolution_details || "");
        setAssignedDept(data.complaint.assigned_department || "Quality");
        setAssignedStaff(data.complaint.assigned_to || "");
        setResolvingStatus(
          data.complaint.status === "RESOLVED" || data.complaint.status === "CLOSED"
            ? data.complaint.status
            : "RESOLVED"
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchQCBatches = async () => {
    setLoadingQC(true);
    try {
      const params = new URLSearchParams();
      if (qcSearch) params.append("search", qcSearch);
      if (qcStatusFilter !== "ALL") params.append("status", qcStatusFilter);

      const res = await fetch(`/api/admin/qc-batches?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQcBatches(data.batches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQC(false);
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
          performed_by: "Dr. Chioma Okonkwo (QC)",
          performed_by_role: "Quality",
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
      setActionErrorMessage("Please provide official resolution details.");
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
          root_cause: firstInformation.trim(), // Stored as First Information
          corrective_action: immediateResolution.trim(), // Stored as Immediate Resolution
          preventive_action: suggestions.trim(), // Stored as Suggestions
          assigned_department: assignedDept,
          assigned_to: assignedStaff,
          action_comment: `Complaint finalized as ${resolvingStatus}. First Information & Immediate Resolution registered. Timer stopped.`,
          performed_by: "Dr. Chioma Okonkwo (QC)",
          performed_by_role: "Quality",
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

  // Post Investigation / Lab Note (Fixed & Verified)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedDetail?.complaint) return;
    setIsAddingNote(true);
    setNoteSuccessMessage("");
    try {
      const res = await fetch(`/api/complaints/${selectedDetail.complaint.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isInternalNote ? "Internal QA Lab Note" : "Customer Communication",
          comment: newNote.trim(),
          is_internal_only: isInternalNote ? 1 : 0,
          performed_by: "Dr. Chioma Okonkwo (QC)",
          performed_by_role: "Quality",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote("");
        setNoteSuccessMessage("✓ Note successfully registered in timeline audit!");
        await fetchComplaintDetail(selectedDetail.complaint.id);
      } else {
        alert("Failed to register note: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      console.error(e);
      alert("Error adding note: " + e.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Open QC Modal for a specific batch
  const openQCModalForBatch = (productName?: string, batchNumber?: string) => {
    setQcModalSuccess("");
    setQcModalError("");
    setQcForm({
      product_name: productName || "TOP BOND White Glue",
      batch_number: batchNumber || "",
      viscosity: "",
      colour: "",
      solids: "",
      qc_status: "Passed",
      manufacturing_date: new Date().toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
      tested_by: "Dr. Chioma Okonkwo (QC)",
      remarks: "",
    });
    setShowQCModal(true);
  };

  // Save QC Test Report
  const handleSaveQC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcForm.product_name || !qcForm.batch_number) {
      setQcModalError("Product Name and Batch Number are required.");
      return;
    }
    setIsSavingQC(true);
    setQcModalError("");
    setQcModalSuccess("");

    try {
      const res = await fetch("/api/admin/qc-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qcForm),
      });
      const data = await res.json();
      if (data.success) {
        setQcModalSuccess(`✓ QC Report for Batch ${qcForm.batch_number.toUpperCase()} saved!`);
        await fetchQCBatches();
        if (selectedComplaintId) {
          await fetchComplaintDetail(selectedComplaintId);
        }
        setTimeout(() => {
          setShowQCModal(false);
        }, 1200);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setQcModalError(e.message || "Failed to save QC report");
    } finally {
      setIsSavingQC(false);
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
            Quality Resolution Center & QC Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Investigate customer complaints, log First Information & Immediate Resolution, trace batch QC data, and finalize ISO SLA resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchComplaints();
              fetchQCBatches();
              if (selectedComplaintId) fetchComplaintDetail(selectedComplaintId);
            }}
            className="p-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openQCModalForBatch()}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FlaskConical className="w-4 h-4" /> + Log Daily Batch QC
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
            <PlusCircle className="w-4 h-4" /> + Raise Complaint
          </Link>
        </div>
      </div>

      {/* Desk Tab Switcher */}
      <div className="flex rounded-xl bg-slate-100 p-1.5 text-xs font-extrabold border border-slate-200">
        <button
          onClick={() => setDeskTab("cases")}
          className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
            deskTab === "cases"
              ? "bg-white text-purechem-navy shadow font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 text-purechem-orange" />
          <span>Active Case Resolution Desk ({complaints.length})</span>
        </button>
        <button
          onClick={() => {
            setDeskTab("qc_register");
            fetchQCBatches();
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
            deskTab === "qc_register"
              ? "bg-white text-emerald-800 shadow font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FlaskConical className="w-4 h-4 text-emerald-600" />
          <span>Daily QC Report Tracking Format ({qcBatches.length} Batches Tested)</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE COMPLAINT RESOLUTION DESK */}
      {deskTab === "cases" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Complaint Selector & Filters */}
          <div className="lg:col-span-4 space-y-4">
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

            {/* Complaints List Stream */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[820px] overflow-y-auto">
              {loadingList ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading complaints...</div>
              ) : complaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No complaints found.</div>
              ) : (
                complaints.map((item) => {
                  const isSelected = item.id === selectedComplaintId;
                  const isOverdue = item.is_overdue === 1;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedComplaintId(item.id)}
                      className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-orange-50/80 border-l-4 border-purechem-orange shadow-inner"
                          : "hover:bg-slate-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-slate-900">{item.complaint_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.status === "RESOLVED" || item.status === "CLOSED"
                              ? "bg-emerald-100 text-emerald-800"
                              : isOverdue
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isOverdue && item.status !== "RESOLVED" ? "OVERDUE" : item.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {item.customer_name} • <span className="text-slate-500 font-normal">{item.product_name}</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span className="font-mono text-[10px]">Batch: {item.batch_number || "N/A"}</span>
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.live_duration?.formatted || "WAT"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Investigation & Resolution Hub */}
          <div className="lg:col-span-8 space-y-6">
            {loadingDetail ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                Loading complaint details & lab history...
              </div>
            ) : !selectedDetail?.complaint ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                Select a complaint from the left panel to begin investigation.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Notification Alerts */}
                {actionSuccessMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {actionSuccessMessage}
                  </div>
                )}
                {actionErrorMessage && (
                  <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {actionErrorMessage}
                  </div>
                )}

                {/* CARD 1: Case Header & Live SLA Timer Clock */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Active Complaint Investigation
                      </div>
                      <h2 className="text-2xl font-mono font-black text-slate-900">
                        {c.complaint_number}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : c.is_overdue
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.is_overdue && !isResolved ? `OVERDUE • ${c.status}` : c.status}
                      </span>
                      <Link
                        href={`/admin/complaints/${c.id}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Full Dossier ↗
                      </Link>
                    </div>
                  </div>

                  {/* Timer Bar */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-white/10 text-purechem-orange">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          {isResolved ? "Final Resolution Turnaround" : "Active SLA Investigation Timer (WAT)"}
                        </div>
                        <div className="text-lg font-mono font-black mt-0.5">
                          {isResolved
                            ? c.resolution_time_formatted || "Resolved"
                            : c.live_duration?.formatted || "Calculating..."}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-300">
                      <div>Opened: {formatWAT(c.complaint_open_time)}</div>
                      {c.resolved_at && <div>Resolved: {formatWAT(c.resolved_at)}</div>}
                    </div>
                  </div>

                  {/* Quick ISO Status Workflow Buttons */}
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

                {/* CARD 2: Product Context & Linked Factory QC Lab Certificate */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purechem-orange" />
                    Product, Batch & Customer Details
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
                      <div className="text-slate-500 text-[11px]">
                        Pack: {c.pack_size || "N/A"} • Qty: {c.quantity_purchased || "N/A"}
                      </div>
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

                  {/* LINKED FACTORY QC LAB RECORD */}
                  {selectedDetail?.qc_report ? (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                          <FlaskConical className="w-4 h-4 text-emerald-700" />
                          Factory QC Lab Test Certificate (Batch: {selectedDetail.qc_report.batch_number})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                            selectedDetail.qc_report.qc_status === "Passed"
                              ? "bg-emerald-600"
                              : selectedDetail.qc_report.qc_status === "Not Passed"
                              ? "bg-rose-600"
                              : "bg-amber-600"
                          }`}
                        >
                          QC {selectedDetail.qc_report.qc_status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="text-slate-400 block text-[10px] font-medium">Viscosity</span>
                          <strong className="text-slate-800 font-mono text-[11px]">
                            {selectedDetail.qc_report.viscosity || "Standard"}
                          </strong>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="text-slate-400 block text-[10px] font-medium">Colour</span>
                          <strong className="text-slate-800 font-mono text-[11px]">
                            {selectedDetail.qc_report.colour || "Standard"}
                          </strong>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="text-slate-400 block text-[10px] font-medium">Solids %</span>
                          <strong className="text-slate-800 font-mono text-[11px]">
                            {selectedDetail.qc_report.solids || "Standard"}
                          </strong>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                          <span className="text-slate-400 block text-[10px] font-medium">MFG / EXP</span>
                          <strong className="text-slate-800 font-mono text-[11px]">
                            {selectedDetail.qc_report.manufacturing_date || "N/A"} • {selectedDetail.qc_report.expiry_date || "N/A"}
                          </strong>
                        </div>
                      </div>
                      <div className="text-[11px] text-emerald-950 font-medium pt-1">
                        Tested By: <strong>{selectedDetail.qc_report.tested_by}</strong> on {selectedDetail.qc_report.testing_date}
                        {selectedDetail.qc_report.remarks && (
                          <span className="block text-slate-600 mt-0.5">Lab Remarks: {selectedDetail.qc_report.remarks}</span>
                        )}
                      </div>
                    </div>
                  ) : c.batch_number ? (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex justify-between items-center">
                      <div className="text-amber-900">
                        No factory QC test record found for batch <strong className="font-mono">{c.batch_number}</strong>.
                      </div>
                      <button
                        onClick={() => openQCModalForBatch(c.product_name, c.batch_number)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        + Log QC Data for {c.batch_number}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* CARD 3: RESOLUTION & CAPA ACTION FORM */}
                <div className="bg-gradient-to-br from-white to-orange-50/40 rounded-2xl border-2 border-purechem-orange/30 shadow-md p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purechem-orange" />
                        Resolution & CAPA Form (Stop Timer)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Log First Information, Immediate Resolution, and Suggestions to complete resolution and stop the SLA clock.
                      </p>
                    </div>
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

                    {/* FIELD 1: First Information (Replaced RCA) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        First Information
                      </label>
                      <textarea
                        rows={2}
                        value={firstInformation}
                        onChange={(e) => setFirstInformation(e.target.value)}
                        placeholder="Initial laboratory observations, inspection findings, temperature/viscosity at arrival, defect confirmation..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    {/* FIELD 2 & 3: Immediate Resolution & Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Immediate Resolution
                        </label>
                        <textarea
                          rows={2}
                          value={immediateResolution}
                          onChange={(e) => setImmediateResolution(e.target.value)}
                          placeholder="Immediate resolution provided to customer (e.g. replaced 5 defective drums, dispatched technical engineer)..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Suggestions
                        </label>
                        <textarea
                          rows={2}
                          value={suggestions}
                          onChange={(e) => setSuggestions(e.target.value)}
                          placeholder="Quality & operational suggestions to avoid recurrence (e.g. storage recommendation, calibration, supplier spec tweak)..."
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
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purechem-orange" />
                      Investigation Notes & Timeline Audit ({selectedDetail?.timeline?.length || 0})
                    </h3>
                    {noteSuccessMessage && (
                      <span className="text-xs text-emerald-600 font-bold animate-pulse">
                        {noteSuccessMessage}
                      </span>
                    )}
                  </div>

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
                      className="px-5 py-2 bg-purechem-navy hover:bg-purechem-navy-dark text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> {isAddingNote ? "Posting..." : "Post"}
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
      )}

      {/* TAB 2: DAILY QC REPORT TRACKING FORMAT */}
      {deskTab === "qc_register" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto grow max-w-2xl">
              <div className="relative grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Batch Number, Product, Remarks, or Tester..."
                  value={qcSearch}
                  onChange={(e) => setQcSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <select
                value={qcStatusFilter}
                onChange={(e) => setQcStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="ALL">All QC Statuses</option>
                <option value="Passed">Passed</option>
                <option value="Not Passed">Not Passed</option>
                <option value="Under Testing">Under Testing</option>
                <option value="Rework">Rework</option>
              </select>

              <button
                onClick={fetchQCBatches}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Filter
              </button>
            </div>

            <button
              onClick={() => openQCModalForBatch()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs shadow-md transition-colors flex items-center gap-2 shrink-0"
            >
              <FlaskConical className="w-4 h-4" /> + Log Daily Batch Test Data
            </button>
          </div>

          {/* QC Daily Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                Factory QC Batch Release Register ({qcBatches.length} Entries)
              </div>
              <div className="text-xs text-slate-500">
                Lagos Factory Quality Control Laboratory • ISO 9001:2015
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Viscosity</th>
                    <th className="py-3 px-4">Colour</th>
                    <th className="py-3 px-4">Solids %</th>
                    <th className="py-3 px-4">QC Status</th>
                    <th className="py-3 px-4">MFG / EXP Date</th>
                    <th className="py-3 px-4">Tested By / Date</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingQC ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading QC batch records...
                      </td>
                    </tr>
                  ) : qcBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No QC batch reports found. Click "+ Log Daily Batch Test Data" above to add.
                      </td>
                    </tr>
                  ) : (
                    qcBatches.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {item.batch_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.product_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {item.viscosity || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.colour || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {item.solids || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                              item.qc_status === "Passed"
                                ? "bg-emerald-600"
                                : item.qc_status === "Not Passed"
                                ? "bg-rose-600"
                                : "bg-amber-600"
                            }`}
                          >
                            {item.qc_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {item.manufacturing_date || "N/A"} • {item.expiry_date || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{item.tested_by}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.testing_date}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.remarks}>
                          {item.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QC LOGGING MODAL */}
      {showQCModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  QC Report Tracking Format — Log Tested Batch
                </h3>
              </div>
              <button
                onClick={() => setShowQCModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qcModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {qcModalSuccess}
              </div>
            )}
            {qcModalError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {qcModalError}
              </div>
            )}

            <form onSubmit={handleSaveQC} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                  <select
                    value={qcForm.product_name}
                    onChange={(e) => setQcForm({ ...qcForm, product_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                    required
                  >
                    {PURECHEM_PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TB-2026-088, B260901"
                    value={qcForm.batch_number}
                    onChange={(e) => setQcForm({ ...qcForm, batch_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Viscosity</label>
                  <input
                    type="text"
                    placeholder="e.g. 45,000 cPs, 1,850 cPs"
                    value={qcForm.viscosity}
                    onChange={(e) => setQcForm({ ...qcForm, viscosity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Colour</label>
                  <input
                    type="text"
                    placeholder="e.g. Milky White, Clear, Amber"
                    value={qcForm.colour}
                    onChange={(e) => setQcForm({ ...qcForm, colour: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Solids (%)</label>
                  <input
                    type="text"
                    placeholder="e.g. 48.5%, 24.2%"
                    value={qcForm.solids}
                    onChange={(e) => setQcForm({ ...qcForm, solids: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">QC Status *</label>
                  <select
                    value={qcForm.qc_status}
                    onChange={(e) => setQcForm({ ...qcForm, qc_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Not Passed">Not Passed</option>
                    <option value="Under Testing">Under Testing</option>
                    <option value="Rework">Rework / Quarantine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturing Date (MFG)</label>
                  <input
                    type="date"
                    value={qcForm.manufacturing_date}
                    onChange={(e) => setQcForm({ ...qcForm, manufacturing_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (EXP)</label>
                  <input
                    type="date"
                    value={qcForm.expiry_date}
                    onChange={(e) => setQcForm({ ...qcForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tested By (QC Executive)</label>
                <input
                  type="text"
                  value={qcForm.tested_by}
                  onChange={(e) => setQcForm({ ...qcForm, tested_by: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  placeholder="e.g. Dr. Chioma Okonkwo (QC)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Lab Observations</label>
                <textarea
                  rows={2}
                  value={qcForm.remarks}
                  onChange={(e) => setQcForm({ ...qcForm, remarks: e.target.value })}
                  placeholder="e.g. Standard dispatch approval. Viscosity within ASTM D1084 specification..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQCModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQC}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSavingQC ? "Saving QC Record..." : "Save Daily QC Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
