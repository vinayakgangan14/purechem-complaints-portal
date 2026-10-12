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
  ShieldCheck,
  Layers,
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

  // Filters for complaints
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
  const [qcStatusFilter, setQcStatusFilter] = useState("ALL");
  const [showQcModal, setShowQcModal] = useState(false);
  const [isSavingQc, setIsSavingQc] = useState(false);
  const [qcModalSuccess, setQcModalSuccess] = useState("");
  const [qcModalError, setQcModalError] = useState("");
  const [selectedCertificateBatch, setSelectedCertificateBatch] = useState<any>(null);

  // Master products list
  const [productsList, setProductsList] = useState<any[]>([]);

  // QC Entry Form State
  const [qcForm, setQcForm] = useState({
    batch_number: "",
    product_name: "Top Fix Super : Grey - 20 Kg",
    product_code: "CCD-FGM-0000FC45",
    product_category: "CCD-Construction Chemical Division",
    manufacturing_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    testing_date: new Date().toISOString().split("T")[0],
    tested_by: "Rajesh Poojari (QC Manager)",

    // Core 4 Parameters
    appearance: "Passed",
    appearance_notes: "Homogeneous consistency, uniform colour, no lumps",
    viscosity_status: "Passed",
    viscosity_value: "Standard paste consistency compliant with spec",
    solid_content_status: "Passed",
    solid_content_value: "Compliant with COA standard",
    bond_strength_status: "Passed",
    bond_strength_value: "Passed substrate adhesion & shear requirement",

    // Overall
    qc_status: "Passed",
    remarks: "Counter retention sample preserved on shelf. Batch certified compliant for dispatch.",
  });

  useEffect(() => {
    loadComplaints();
    loadQcBatches();
    loadProducts();
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
      const res = await fetch("/api/admin/qc-batches?limit=100");
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

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.products?.length) {
        setProductsList(data.products);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  // 5. SAVE DAILY QC BATCH PARAMETERS
  const handleSaveQcBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setQcModalError("");
    setQcModalSuccess("");

    if (!qcForm.batch_number.trim()) {
      setQcModalError("Batch Number is mandatory.");
      return;
    }
    if (!qcForm.product_name.trim()) {
      setQcModalError("Please select a Product.");
      return;
    }

    setIsSavingQc(true);
    try {
      const res = await fetch("/api/admin/qc-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qcForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setQcModalSuccess(`QC Batch Data for ${qcForm.batch_number.toUpperCase()} saved successfully!`);
      await loadQcBatches();
      setTimeout(() => {
        setShowQcModal(false);
        setQcModalSuccess("");
      }, 1400);
    } catch (err: any) {
      setQcModalError(err.message || "Failed to save QC Batch Report.");
    } finally {
      setIsSavingQc(false);
    }
  };

  // Quick open QC modal pre-filled with complaint info
  const openQcModalForComplaint = (complaint: any) => {
    setQcForm((prev) => ({
      ...prev,
      batch_number: complaint.batch_number || "",
      product_name: complaint.product_name || prev.product_name,
      product_category: complaint.product_category || prev.product_category,
      product_code: complaint.product_code || prev.product_code,
    }));
    setQcModalError("");
    setQcModalSuccess("");
    setShowQcModal(true);
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

  // Check if current complaint has a matching logged QC batch certificate
  const matchedQcBatch = qcBatches.find(
    (b) => b.batch_number?.trim().toUpperCase() === comp?.batch_number?.trim().toUpperCase()
  );

  // Filtered QC Batches for the QC tab
  const filteredQcBatches = qcBatches.filter((b) => {
    if (qcStatusFilter !== "ALL" && b.qc_status !== qcStatusFilter) return false;
    if (qcSearch.trim()) {
      const q = qcSearch.toLowerCase();
      return (
        b.batch_number?.toLowerCase().includes(q) ||
        b.product_name?.toLowerCase().includes(q) ||
        b.tested_by?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4 text-emerald-600" /> Purechem QC Resolution Desk & Daily Batch Register
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
            QC Resolution & Quality Data Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Managed by <strong>Rajesh Poojari (QC Manager)</strong>. Two-tier SLA enforcement and daily QC batch parameters logging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setQcModalError("");
              setQcModalSuccess("");
              setShowQcModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FlaskConical className="w-4 h-4" /> + Log Daily QC Batch Data
          </button>

          <Link
            href="/complaint/new"
            className="px-4 py-2.5 bg-[#FF6900] hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> + Log New Complaint
          </Link>
        </div>
      </div>

      {/* CORE PORTAL TAB SWITCHER */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setDeskTab("cases")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            deskTab === "cases"
              ? "bg-[#0A2540] text-white shadow"
              : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Complaints Resolution Desk ({complaints.length})</span>
        </button>

        <button
          onClick={() => setDeskTab("qc_register")}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            deskTab === "qc_register"
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Daily QC Batch Data Register ({qcBatches.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPLAINTS RESOLUTION DESK                                         */}
      {/* ========================================================================= */}
      {deskTab === "cases" && (
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
                {/* QC BATCH LABORATORY RETENTION CROSS-REFERENCE CARD                        */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-wider">
                        QC Batch Quality Test Data (Batch: {comp.batch_number || "Unspecified"})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => openQcModalForComplaint(comp)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Log / Update QC Data
                    </button>
                  </div>

                  {matchedQcBatch ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {/* Appearance */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Appearance</div>
                          <div className="flex items-center gap-1 mt-1 font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              matchedQcBatch.appearance === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {matchedQcBatch.appearance || "Passed"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 truncate">{matchedQcBatch.appearance_notes || "Compliant"}</div>
                        </div>

                        {/* Viscosity */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Viscosity</div>
                          <div className="flex items-center gap-1 mt-1 font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              matchedQcBatch.viscosity_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {matchedQcBatch.viscosity_status || "Passed"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">{matchedQcBatch.viscosity_value || matchedQcBatch.viscosity || "Standard"}</div>
                        </div>

                        {/* Solid Content */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Solid Content</div>
                          <div className="flex items-center gap-1 mt-1 font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              matchedQcBatch.solid_content_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {matchedQcBatch.solid_content_status || "Passed"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">{matchedQcBatch.solid_content_value || matchedQcBatch.solids || "Standard"}</div>
                        </div>

                        {/* Bond Strength */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Bond Strength</div>
                          <div className="flex items-center gap-1 mt-1 font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              matchedQcBatch.bond_strength_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {matchedQcBatch.bond_strength_status || "Passed"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">{matchedQcBatch.bond_strength_value || "Compliant"}</div>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-emerald-900 font-bold">Lab QC Result: {matchedQcBatch.qc_status}</strong>
                          <span className="text-emerald-800 ml-2">Tested by: {matchedQcBatch.tested_by} ({matchedQcBatch.testing_date})</span>
                        </div>
                        {matchedQcBatch.remarks && (
                          <div className="text-[11px] text-emerald-700 italic">"{matchedQcBatch.remarks}"</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        No laboratory QC parameters logged yet for batch <strong className="text-red-700 font-mono">{comp.batch_number}</strong>.
                      </div>
                      <button
                        type="button"
                        onClick={() => openQcModalForComplaint(comp)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        + Log Parameters for Batch {comp.batch_number}
                      </button>
                    </div>
                  )}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY QC BATCH DATA REGISTER (APPEARANCE, VISCOSITY, SOLIDS, BOND)  */}
      {/* ========================================================================= */}
      {deskTab === "qc_register" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                QC Executive Daily Laboratory Log
              </div>
              <h2 className="text-xl font-black text-[#0A2540]">
                Daily Batch Testing Register & Parameter Results
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Log daily test results for Appearance, Viscosity, Solids, and Bond Strength across production batches.
              </p>
            </div>

            <button
              onClick={() => {
                setQcModalError("");
                setQcModalSuccess("");
                setShowQcModal(true);
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> + Log New Batch Testing Data
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search batch, product, tester..."
                value={qcSearch}
                onChange={(e) => setQcSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={qcStatusFilter}
                onChange={(e) => setQcStatusFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="ALL">All QC Results</option>
                <option value="Passed">Passed Only</option>
                <option value="Failed">Failed Only</option>
                <option value="Hold">Hold Only</option>
              </select>

              <button
                onClick={loadQcBatches}
                className="p-2 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
                title="Refresh QC Batches"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QC Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Batch Number</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Mfg / Exp Date</th>
                    <th className="p-4">Appearance</th>
                    <th className="p-4">Viscosity</th>
                    <th className="p-4">Solid Content</th>
                    <th className="p-4">Bond Strength</th>
                    <th className="p-4">QC Result</th>
                    <th className="p-4">Tested By</th>
                    <th className="p-4 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingQC ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">Loading QC data...</td>
                    </tr>
                  ) : filteredQcBatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">No QC records match your query. Click "+ Log New Batch Testing Data" to record a batch.</td>
                    </tr>
                  ) : (
                    filteredQcBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-black text-slate-900">{b.batch_number}</td>
                        <td className="p-4 max-w-[200px]">
                          <div className="font-bold text-slate-900 truncate">{b.product_name}</div>
                          {b.product_category && <div className="text-[10px] text-slate-400 truncate">{b.product_category}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-600">
                          <div>M: {b.manufacturing_date || "—"}</div>
                          <div className="text-slate-400 text-[10px]">E: {b.expiry_date || "—"}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            b.appearance === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {b.appearance === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {b.appearance || "Passed"}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            b.viscosity_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {b.viscosity_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {b.viscosity_status || "Passed"}
                          </span>
                          {b.viscosity_value && <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">{b.viscosity_value}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            b.solid_content_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {b.solid_content_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {b.solid_content_status || "Passed"}
                          </span>
                          {b.solid_content_value && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.solid_content_value}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            b.bond_strength_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {b.bond_strength_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {b.bond_strength_status || "Passed"}
                          </span>
                          {b.bond_strength_value && <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">{b.bond_strength_value}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                            b.qc_status === "Passed" ? "bg-emerald-600 text-white" : b.qc_status === "Failed" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                          }`}>
                            {b.qc_status}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-600">
                          <div>{b.tested_by || "QC Executive"}</div>
                          <div className="text-slate-400 text-[10px]">{b.testing_date || "—"}</div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedCertificateBatch(b)}
                            className="px-3 py-1 bg-slate-100 hover:bg-[#0A2540] hover:text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                          >
                            Certificate
                          </button>
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
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>As <strong>Rajesh Poojari (QC Manager)</strong>, you are rejecting this complaint based on lab counter-sample checks.</p>
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                A mandatory justification reason is required and will be logged into the audit trail.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Mandatory Rejection Reason:
              </label>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRejectionReason("Counter sample checked found ok and rejected")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer"
                >
                  "Counter sample checked found ok and rejected"
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
              <button onClick={() => setShowAcceptModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              Accepting will start the <strong>7-Working-Day Resolution SLA clock</strong>.
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

      {/* ========================================================================= */}
      {/* MODAL 3: LOG QC BATCH DATA (APPEARANCE, VISCOSITY, SOLIDS, BOND STRENGTH)  */}
      {/* ========================================================================= */}
      {showQcModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0A2540]">
                    Log QC Laboratory Batch Test Data
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record Appearance, Viscosity, Solids, and Bond Strength parameters.
                  </p>
                </div>
              </div>

              <button onClick={() => setShowQcModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {qcModalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {qcModalSuccess}
              </div>
            )}
            {qcModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> {qcModalError}
              </div>
            )}

            <form onSubmit={handleSaveQcBatch} className="space-y-5">
              {/* Batch Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">1. Batch & Product Info</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-black text-red-600 uppercase mb-1">Batch Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-2409-12"
                      value={qcForm.batch_number}
                      onChange={(e) => setQcForm({ ...qcForm, batch_number: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mfg Date *</label>
                    <input
                      type="date"
                      required
                      value={qcForm.manufacturing_date}
                      onChange={(e) => setQcForm({ ...qcForm, manufacturing_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Exp Date *</label>
                    <input
                      type="date"
                      required
                      value={qcForm.expiry_date}
                      onChange={(e) => setQcForm({ ...qcForm, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 uppercase mb-1">Product *</label>
                    <select
                      value={`${qcForm.product_code}:::${qcForm.product_name}`}
                      onChange={(e) => {
                        const [code, name] = e.target.value.split(":::");
                        const matched = productsList.find((p) => p.product_code === code && p.product_name === name);
                        if (matched) {
                          setQcForm((prev) => ({
                            ...prev,
                            product_name: matched.product_name,
                            product_code: matched.product_code,
                            product_category: matched.category_name || prev.product_category,
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-800"
                    >
                      {productsList.map((p, idx) => (
                        <option key={idx} value={`${p.product_code}:::${p.product_name}`}>
                          [{p.product_code}] {p.product_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4 Testing Parameters */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] uppercase font-bold text-emerald-800">2. Laboratory Parameters (Pass/Fail)</span>
                <div className="space-y-3 text-xs">
                  {/* Appearance */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">Appearance Test:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, appearance: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.appearance === "Passed" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, appearance: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.appearance === "Failed" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Observation: e.g. Smooth homogeneous emulsion, no separation"
                      value={qcForm.appearance_notes}
                      onChange={(e) => setQcForm({ ...qcForm, appearance_notes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>

                  {/* Viscosity */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">Viscosity Test:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, viscosity_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.viscosity_status === "Passed" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, viscosity_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.viscosity_status === "Failed" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 45,000 cPs"
                      value={qcForm.viscosity_value}
                      onChange={(e) => setQcForm({ ...qcForm, viscosity_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Solid Content */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">Solid Content Test:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, solid_content_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.solid_content_status === "Passed" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, solid_content_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.solid_content_status === "Failed" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 48.5%"
                      value={qcForm.solid_content_value}
                      onChange={(e) => setQcForm({ ...qcForm, solid_content_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Bond Strength */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">Bond Strength Test:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, bond_strength_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.bond_strength_status === "Passed" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setQcForm({ ...qcForm, bond_strength_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            qcForm.bond_strength_status === "Failed" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 8.2 MPa / Substrate tear"
                      value={qcForm.bond_strength_value}
                      onChange={(e) => setQcForm({ ...qcForm, bond_strength_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-black text-slate-800 uppercase mb-1">Overall QC Result *</label>
                  <select
                    value={qcForm.qc_status}
                    onChange={(e) => setQcForm({ ...qcForm, qc_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Passed">Passed (Approved)</option>
                    <option value="Failed">Failed (Rejected)</option>
                    <option value="Hold">Hold (Retest)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tested By *</label>
                  <input
                    type="text"
                    required
                    value={qcForm.tested_by}
                    onChange={(e) => setQcForm({ ...qcForm, tested_by: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Remarks & Retention Location:</label>
                  <input
                    type="text"
                    value={qcForm.remarks}
                    onChange={(e) => setQcForm({ ...qcForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQcModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQc}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow cursor-pointer disabled:opacity-50"
                >
                  {isSavingQc ? "Saving..." : "Save Daily QC Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW CERTIFICATE DETAILS */}
      {selectedCertificateBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">QC Laboratory Certificate</span>
                <h3 className="text-lg font-black text-[#0A2540] font-mono">
                  Batch: {selectedCertificateBatch.batch_number}
                </h3>
              </div>
              <button onClick={() => setSelectedCertificateBatch(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-bold text-slate-900">{selectedCertificateBatch.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">QC Result:</span>
                <span className="font-black text-emerald-700">{selectedCertificateBatch.qc_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mfg / Exp:</span>
                <span className="font-medium text-slate-800">{selectedCertificateBatch.manufacturing_date} / {selectedCertificateBatch.expiry_date}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between">
                <span>Appearance:</span>
                <span className="font-black text-emerald-700">{selectedCertificateBatch.appearance || "Passed"}</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between">
                <span>Viscosity:</span>
                <span className="font-black text-emerald-700">{selectedCertificateBatch.viscosity_status || "Passed"} ({selectedCertificateBatch.viscosity_value || selectedCertificateBatch.viscosity || "Std"})</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between">
                <span>Solid Content:</span>
                <span className="font-black text-emerald-700">{selectedCertificateBatch.solid_content_status || "Passed"} ({selectedCertificateBatch.solid_content_value || selectedCertificateBatch.solids || "Std"})</span>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between">
                <span>Bond Strength:</span>
                <span className="font-black text-emerald-700">{selectedCertificateBatch.bond_strength_status || "Passed"} ({selectedCertificateBatch.bond_strength_value || "Std"})</span>
              </div>
            </div>

            {selectedCertificateBatch.remarks && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong>Remarks:</strong> {selectedCertificateBatch.remarks}
              </div>
            )}

            <button
              onClick={() => setSelectedCertificateBatch(null)}
              className="w-full py-2 bg-[#0A2540] text-white rounded-xl text-xs font-bold"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
