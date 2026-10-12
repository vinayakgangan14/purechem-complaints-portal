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
  XCircle,
  ChevronRight,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

const PRODUCT_CATEGORIES = [
  "ALL",
  "IAD-Industrial Adhesive",
  "CPD-Consumer Product Division",
  "CCD-Construction Chemical Division",
  "DCP-Dry Powder Chemical",
];

const DEPARTMENTS = [
  {
    name: "Sales",
    officers: ["Ishan Phadke", "Indra", "Lognath", "Aravind Nagraj"],
  },
  {
    name: "Production",
    officers: ["Vinayak Gangan", "Sunil Patro"],
  },
  {
    name: "Quality",
    officers: ["Rajesh Poojari"],
  },
];

export default function ComplaintResolutionDeskPage() {
  const [deskTab, setDeskTab] = useState<"cases" | "qc_register">("cases");

  // Complaint States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // QC Validation (Phase 1)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(
    "Counter sample checked found ok and rejected"
  );
  const [selectedDept, setSelectedDept] = useState("Production");
  const [selectedOfficer, setSelectedOfficer] = useState("Vinayak Gangan");
  const [acceptComment, setAcceptComment] = useState("");
  const [adminPriority, setAdminPriority] = useState("Medium");

  // Department Investigation (Phase 2)
  const [rootCause, setRootCause] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  // Final QC Closure (Phase 3)
  const [finalQcRemarks, setFinalQcRemarks] = useState(
    "Verified and approved by Rajesh Poojari (QC Manager). Root cause addressed and corrective actions verified."
  );

  // General Action State
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");

  // Timeline note state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // QC Batch Register State
  const [qcBatches, setQcBatches] = useState<any[]>([]);
  const [loadingQC, setLoadingQC] = useState(false);
  const [qcSearch, setQcSearch] = useState("");

  useEffect(() => {
    loadComplaints();
    loadQcBatches();
  }, [statusFilter, categoryFilter, overdueOnly]);

  const loadComplaints = async () => {
    setLoadingList(true);
    try {
      let url = `/api/complaints?limit=100`;
      if (statusFilter !== "ALL") url += `&status=${encodeURIComponent(statusFilter)}`;
      if (categoryFilter !== "ALL") url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (overdueOnly) url += `&overdue=true`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        if (data.complaints.length > 0 && !selectedComplaintId) {
          selectComplaint(data.complaints[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const selectComplaint = async (id: string) => {
    setSelectedComplaintId(id);
    setLoadingDetail(true);
    setActionSuccessMessage("");
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDetail(data);
        // Pre-fill fields if already existing
        const c = data.complaint;
        setRootCause(c.root_cause || "");
        setCorrectiveAction(c.corrective_action || "");
        setPreventiveAction(c.preventive_action || "");
        setResolutionDetails(c.resolution_details || "");
        if (c.assigned_department) setSelectedDept(c.assigned_department);
        if (c.assigned_to) setSelectedOfficer(c.assigned_to);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadQcBatches = async () => {
    setLoadingQC(true);
    try {
      const res = await fetch("/api/admin/qc-batches?limit=50");
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

  // Switch officer list when department changes
  const handleDepartmentChange = (deptName: string) => {
    setSelectedDept(deptName);
    const deptObj = DEPARTMENTS.find((d) => d.name === deptName);
    if (deptObj && deptObj.officers.length > 0) {
      setSelectedOfficer(deptObj.officers[0]);
    }
  };

  // 1. REJECT COMPLAINT (Rajesh Poojari)
  const handleRejectComplaint = async () => {
    if (!rejectionReason.trim()) {
      setActionErrorMessage("Please provide a mandatory laboratory rejection reason.");
      return;
    }
    setIsSubmittingAction(true);
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_action: "qc_reject",
          rejection_reason: rejectionReason.trim(),
          performed_by: "Rajesh Poojari (QC Manager)",
          performed_by_role: "QC Manager",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setShowRejectModal(false);
      setActionSuccessMessage("Complaint REJECTED by Rajesh Poojari (QC Manager). Customer notified.");
      await selectComplaint(selectedComplaintId!);
      loadComplaints();
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to reject complaint.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 2. ACCEPT COMPLAINT & START TIMER (Rajesh Poojari)
  const handleAcceptComplaint = async () => {
    setIsSubmittingAction(true);
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_action: "qc_accept",
          assigned_department: selectedDept,
          assigned_to: selectedOfficer,
          admin_priority: adminPriority,
          comment: acceptComment.trim() || undefined,
          performed_by: "Rajesh Poojari (QC Manager)",
          performed_by_role: "QC Manager",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setShowAcceptModal(false);
      setActionSuccessMessage(
        `Complaint ACCEPTED by Rajesh Poojari! 7-Working-Day Resolution Timer is now ACTIVE. Assigned to ${selectedDept} (${selectedOfficer}).`
      );
      await selectComplaint(selectedComplaintId!);
      loadComplaints();
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to accept complaint.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 3. DEPARTMENT SUBMITS INVESTIGATION FINDINGS
  const handleDeptSubmitResolution = async () => {
    if (!rootCause.trim() || !correctiveAction.trim() || !preventiveAction.trim()) {
      setActionErrorMessage("Please fill Root Cause, Corrective Action, and Preventive Action.");
      return;
    }
    setIsSubmittingAction(true);
    setActionErrorMessage("");
    try {
      const activeOfficer = selectedDetail?.complaint?.assigned_to || selectedOfficer;
      const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_action: "dept_resolve",
          root_cause: rootCause.trim(),
          corrective_action: correctiveAction.trim(),
          preventive_action: preventiveAction.trim(),
          resolution_details: resolutionDetails.trim(),
          performed_by: activeOfficer,
          performed_by_role: selectedDetail?.complaint?.assigned_department || "Investigation Team",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActionSuccessMessage("Investigation submitted! Case is now queued for Rajesh Poojari's Final QC Review.");
      await selectComplaint(selectedComplaintId!);
      loadComplaints();
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to submit investigation.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 4. RAJESH POOJARI FINAL QC CLOSURE
  const handleFinalQcClosure = async () => {
    setIsSubmittingAction(true);
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_action: "qc_final_close",
          comment: finalQcRemarks.trim(),
          performed_by: "Rajesh Poojari (QC Manager)",
          performed_by_role: "QC Manager",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActionSuccessMessage("Complaint officially APPROVED & CLOSED by Rajesh Poojari (QC Manager)!");
      await selectComplaint(selectedComplaintId!);
      loadComplaints();
    } catch (err: any) {
      setActionErrorMessage(err.message || "Failed to close complaint.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Add Timeline Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedComplaintId) return;
    setIsAddingNote(true);
    try {
      await fetch(`/api/complaints/${selectedComplaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: newNote.trim(),
          is_internal_only: true,
          performed_by: "Rajesh Poojari (QC Desk)",
          performed_by_role: "Quality",
        }),
      });
      setNewNote("");
      await selectComplaint(selectedComplaintId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingNote(false);
    }
  };

  const comp = selectedDetail?.complaint;
  const sla = comp?.sla_status || {};

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purechem-orange uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4 text-emerald-600" /> Purechem QC Resolution Desk & Investigation Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
            QC Resolution Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Managed by <strong>Rajesh Poojari (QC Manager)</strong>. Two-tier SLA enforcement: 48-Hour Response SLA & 7-Working-Day Resolution SLA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              loadComplaints();
              if (selectedComplaintId) selectComplaint(selectedComplaintId);
            }}
            className="p-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>

          <Link
            href="/complaint/new"
            className="px-4 py-2.5 bg-[#FF6900] hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> + Log New Complaint
          </Link>
        </div>
      </div>

      {/* Main Workspace: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaints Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[850px]">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, customer, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadComplaints()}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_QC_VALIDATION">Pending QC (48h)</option>
                <option value="ACCEPTED">Accepted / In Progress</option>
                <option value="UNDER_FINAL_REVIEW">Under Final Review</option>
                <option value="REJECTED">Rejected by QC</option>
                <option value="CLOSED">Closed / Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat.split("-")[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 font-bold text-red-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded text-red-600"
                />
                Show Overdue Cases Only
              </label>

              <span className="text-slate-400 font-semibold">
                {complaints.length} tickets
              </span>
            </div>
          </div>

          {/* Complaints Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading cases...</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No complaints found.</div>
            ) : (
              complaints.map((c) => {
                const isSelected = selectedComplaintId === c.id;
                const isPendingQc = c.status === "PENDING_QC_VALIDATION";
                const isAccepted = c.status === "ACCEPTED";
                const isUnderReview = c.status === "UNDER_FINAL_REVIEW";
                const isRejected = c.status === "REJECTED";
                const isClosed = c.status === "CLOSED" || c.status === "RESOLVED";

                const isRespOverdue = c.is_response_overdue === 1;
                const isResOverdue = c.is_resolution_overdue === 1;

                return (
                  <div
                    key={c.id}
                    onClick={() => selectComplaint(c.id)}
                    className={`p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-l-4 border-blue-600"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-[#0A2540]">
                        {c.complaint_number}
                      </span>

                      {/* Status Badges */}
                      {isPendingQc && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide">
                          Stage 1: Pending QC
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase tracking-wide">
                          Stage 2: Investigating
                        </span>
                      )}
                      {isUnderReview && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-extrabold uppercase tracking-wide">
                          Stage 3: QC Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wide">
                          Rejected
                        </span>
                      )}
                      {isClosed && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
                          Closed
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-black text-slate-800 mt-1 truncate">
                      {c.customer_company || c.customer_name}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.product_name}
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100/80">
                      <span className="font-mono text-slate-500 font-semibold">
                        Batch: <strong className="text-red-700">{c.batch_number || "—"}</strong>
                      </span>

                      {/* SLA Overdue Warnings */}
                      {isRespOverdue && isPendingQc && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <AlertOctagon className="w-3 h-3 text-red-600" /> Response Overdue (&gt;48h)
                        </span>
                      )}
                      {isResOverdue && isAccepted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <AlertOctagon className="w-3 h-3 text-red-600" /> Resolution Overdue (&gt;7d)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Complaint Dossier & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!comp ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 shadow-sm">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold">Select a complaint from the left to inspect and take action.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert Feedback Messages */}
              {actionSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}
              {actionErrorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{actionErrorMessage}</span>
                </div>
              )}

              {/* TICKET HEADER CARD */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Purechem Complaint Dossier
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#0A2540] font-mono">
                      {comp.complaint_number}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pill */}
                    <span className="px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider bg-[#0A2540] text-white">
                      {comp.status}
                    </span>
                  </div>
                </div>

                {/* 2-Tier SLA Live Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Response SLA (48h) */}
                  <div className={`p-4 rounded-2xl border ${
                    sla.isResponseOverdue
                      ? "bg-red-50 border-red-200 text-red-950"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}>
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" /> 48h Response SLA
                      </span>
                      {comp.acknowledged_at ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Validated
                        </span>
                      ) : sla.isResponseOverdue ? (
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                          CRITICAL OVERDUE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          Pending Validation
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1.5">
                      {comp.acknowledged_at
                        ? `Validated by QC on ${new Date(comp.acknowledged_at).toLocaleDateString()}`
                        : `Target: Within 48 hours of complaint logging by Sales Manager.`}
                    </div>
                  </div>

                  {/* Resolution SLA (7 Working Days) */}
                  <div className={`p-4 rounded-2xl border ${
                    sla.isResolutionOverdue
                      ? "bg-red-50 border-red-200 text-red-950"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}>
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" /> 7 Working Days SLA
                      </span>
                      {comp.status === "CLOSED" ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Closed
                        </span>
                      ) : !comp.acknowledged_at ? (
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          Starts on QC Acceptance
                        </span>
                      ) : sla.isResolutionOverdue ? (
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                          CRITICAL OVERDUE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                          Active Timer ({sla.workingDaysElapsed || 0}/7 days)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1.5">
                      {comp.acknowledged_at
                        ? `Timer running since ${new Date(comp.acknowledged_at).toLocaleDateString()}. Excludes weekends.`
                        : `Timer strictly commences the moment Rajesh Poojari accepts the case.`}
                    </div>
                  </div>
                </div>

                {/* Complaint Core Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Sales Manager (Logger):</span>
                    <span className="font-bold text-slate-900">{comp.raised_by_name || "Sales"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Customer Company:</span>
                    <span className="font-bold text-slate-900">{comp.customer_company || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Customer Contact:</span>
                    <span className="font-bold text-slate-900">{comp.customer_name} ({comp.customer_phone})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Customer Type:</span>
                    <span className="font-bold text-slate-900">{comp.customer_type || "Distributor"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Category:</span>
                    <span className="font-bold text-slate-900">{comp.product_category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Product Name:</span>
                    <span className="font-bold text-slate-900">{comp.product_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Batch Number:</span>
                    <span className="font-mono font-bold text-red-600">{comp.batch_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Pack Size / Qty:</span>
                    <span className="font-bold text-slate-900">{comp.pack_size || "—"} / {comp.quantity_purchased || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-900">{comp.invoice_number || "—"}</span>
                  </div>
                </div>

                {/* Complaint Description */}
                <div className="space-y-1">
                  <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Customer Problem Description:
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                    {comp.description}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* WORKFLOW ACTION CARD: PHASE 1 - RAJESH POOJARI VALIDATION (PENDING_QC)     */}
              {/* ========================================================================= */}
              {comp.status === "PENDING_QC_VALIDATION" && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-md space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#0A2540]">
                        Phase 1: QC Validation by Rajesh Poojari (QC Manager)
                      </h2>
                      <p className="text-xs text-amber-900 font-medium">
                        Evaluate complaint details and counter-retention sample in the QC Laboratory.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-2">
                    <p>
                      <strong>Protocol:</strong> Check the counter-sample for batch <strong className="text-red-700 font-mono">{comp.batch_number}</strong>.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li><strong>If Counter Sample is OK / Compliant:</strong> Click <em>Reject Complaint</em>. State mandatory justification (e.g. counter sample checked found ok and rejected). Case is closed without starting resolution timer.</li>
                      <li><strong>If Defect is Confirmed:</strong> Click <em>Accept & Assign Department</em>. Resolution timer (7 Working Days) will immediately activate, and case will route to the designated officer.</li>
                    </ul>
                  </div>

                  {/* Buttons for Accept / Reject */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Reject Complaint (Sample OK)
                    </button>

                    <button
                      onClick={() => setShowAcceptModal(true)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept & Assign Department →
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* WORKFLOW ACTION CARD: PHASE 2 - DEPARTMENT INVESTIGATION (ACCEPTED)        */}
              {/* ========================================================================= */}
              {comp.status === "ACCEPTED" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-200 shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[#0A2540]">
                          Phase 2: Department Investigation
                        </h2>
                        <p className="text-xs text-slate-500">
                          Assigned to: <strong className="text-blue-900">{comp.assigned_department}</strong> — <strong className="text-slate-900">{comp.assigned_to}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-black">
                      7 Working Days SLA Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        1. Root Cause Analysis (RCA) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Detailed technical cause: e.g. raw material variance, mixing temperature deviation, substrate contamination, packaging seal pressure..."
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        2. Corrective Action Taken *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Immediate action: e.g. batch replaced with fresh tested lot, technical team dispatched to site, applicator retrained..."
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        3. Preventive Action / Quality Assurance Suggestion *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Long term fix: e.g. QC batch testing parameters updated, supplier audit initiated, SOP revised..."
                        value={preventiveAction}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <button
                      onClick={handleDeptSubmitResolution}
                      disabled={isSubmittingAction}
                      className="w-full py-3 bg-[#0A2540] hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingAction ? (
                        <>Submitting to Rajesh Poojari...</>
                      ) : (
                        <>Submit Investigation for Rajesh Poojari's Final QC Review →</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* WORKFLOW ACTION CARD: PHASE 3 - FINAL QC CLOSURE (UNDER_FINAL_REVIEW)      */}
              {/* ========================================================================= */}
              {comp.status === "UNDER_FINAL_REVIEW" && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-purple-200 shadow-md space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-[#0A2540]">
                        Phase 3: Final QC Review & Closure by Rajesh Poojari
                      </h2>
                      <p className="text-xs text-slate-500">
                        Review investigation findings from {comp.assigned_department} ({comp.assigned_to}) and officially close case.
                      </p>
                    </div>
                  </div>

                  {/* Findings Summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div>
                      <strong className="text-slate-500 block uppercase text-[10px]">Submitted Root Cause:</strong>
                      <p className="text-slate-800 font-medium mt-0.5">{comp.root_cause || rootCause || "—"}</p>
                    </div>
                    <div>
                      <strong className="text-slate-500 block uppercase text-[10px]">Corrective Action:</strong>
                      <p className="text-slate-800 font-medium mt-0.5">{comp.corrective_action || correctiveAction || "—"}</p>
                    </div>
                    <div>
                      <strong className="text-slate-500 block uppercase text-[10px]">Preventive Action:</strong>
                      <p className="text-slate-800 font-medium mt-0.5">{comp.preventive_action || preventiveAction || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Rajesh Poojari QC Closure Remarks & Final Signoff:
                    </label>
                    <textarea
                      rows={3}
                      value={finalQcRemarks}
                      onChange={(e) => setFinalQcRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-600 font-medium"
                    />

                    <button
                      onClick={handleFinalQcClosure}
                      disabled={isSubmittingAction}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Officially Close Complaint (Stop Timer)
                    </button>
                  </div>
                </div>
              )}

              {/* TIMELINE & AUDIT TRAIL CARD */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Audit Trail & Timeline History
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {selectedDetail?.timeline?.length || 0} events
                  </span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(selectedDetail?.timeline || []).map((ev: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#0A2540]">{ev.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.created_at).toLocaleDateString()} {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {ev.comment && (
                        <p className="text-slate-600 text-[11px] font-medium">{ev.comment}</p>
                      )}
                      <div className="text-[10px] text-slate-400 font-semibold">
                        Logged by: {ev.performed_by || "System"} ({ev.performed_by_role || "Staff"})
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick internal note */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Add internal QC note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote || !newNote.trim()}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REJECT COMPLAINT (RAJESH POOJARI)                                 */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm uppercase">
                <XCircle className="w-5 h-5" /> Reject Complaint (QC Decision)
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                As <strong>Rajesh Poojari (QC Manager)</strong>, you are rejecting this complaint based on lab counter-sample checks.
              </p>
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                A mandatory justification reason is required and will be logged into the audit trail and sent to the customer and sales manager.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Mandatory Rejection Reason:
              </label>

              {/* Quick pre-set options */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRejectionReason("Counter sample checked found ok and rejected")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                >
                  "Counter sample checked found ok and rejected"
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionReason("Lab retention batch re-tested: viscosity, solids, and bonding comply with COA standard.")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                >
                  "Lab retention batch fully complies with COA standard"
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-600 font-medium"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction || !rejectionReason.trim()}
                onClick={handleRejectComplaint}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer shadow disabled:opacity-50"
              >
                {isSubmittingAction ? "Rejecting..." : "Confirm QC Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACCEPT & ASSIGN DEPARTMENT (RAJESH POOJARI)                       */}
      {/* ========================================================================= */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Accept Complaint & Start Timer
              </div>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              Accepting this ticket will officially record <code>acknowledged_at</code> and commence the <strong>7-Working-Day Resolution SLA clock</strong>.
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  1. Assign Department *
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} Department
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  2. Designated Investigation Officer under {selectedDept} *
                </label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                >
                  {DEPARTMENTS.find((d) => d.name === selectedDept)?.officers.map((officer) => (
                    <option key={officer} value={officer}>
                      {officer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  3. Internal Priority
                </label>
                <select
                  value={adminPriority}
                  onChange={(e) => setAdminPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                >
                  <option value="Medium">Medium (Standard)</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent (Immediate Site Visit)</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  4. Instructions / QC Validation Notes for Officer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Conduct adhesion peel test on site, verify substrate prep, inspect warehouse batch stock..."
                  value={acceptComment}
                  onChange={(e) => setAcceptComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleAcceptComplaint}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow disabled:opacity-50"
              >
                {isSubmittingAction ? "Activating..." : "Accept & Start Resolution Timer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
