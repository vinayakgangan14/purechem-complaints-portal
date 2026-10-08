"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  UserCheck,
  Building,
  Package,
  ShieldAlert,
  Send,
  Lock,
  MessageSquare,
  ArrowLeft,
  Paperclip,
  Check,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "internal" | "customer" | "investigation" | "attachments">("timeline");

  // Status & Assignment updates
  const [newStatus, setNewStatus] = useState("");
  const [assignedDept, setAssignedDept] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [adminPriority, setAdminPriority] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Investigation & CAPA details
  const [rcaText, setRcaText] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  // Timeline Comment states
  const [noteText, setNoteText] = useState("");
  const [isInternalOnly, setIsInternalOnly] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("lab_report");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || "Complaint not found");
      }
      setData(resData);
      setNewStatus(resData.complaint.status);
      setAssignedDept(resData.complaint.assigned_department || "Quality");
      setAssignedStaff(resData.complaint.assigned_to || "");
      setAdminPriority(resData.complaint.admin_priority || "Medium");
      setRcaText(resData.complaint.root_cause || "");
      setCorrectiveAction(resData.complaint.corrective_action || "");
      setPreventiveAction(resData.complaint.preventive_action || "");
      setResolutionDetails(resData.complaint.resolution_details || "");
    } catch (e: any) {
      setError(e.message || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusAndAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${data.complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          assigned_department: assignedDept,
          assigned_to: assignedStaff,
          admin_priority: adminPriority,
          comment: actionComment,
          root_cause: rcaText,
          corrective_action: correctiveAction,
          preventive_action: preventiveAction,
          resolution_details: resolutionDetails,
          performed_by: "Quality Admin",
          performed_by_role: "Quality Manager",
        }),
      });
      const updateData = await res.json();
      if (!updateData.success) throw new Error(updateData.error);
      setActionComment("");
      await fetchComplaint();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/complaints/${data.complaint.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: noteText.trim(),
          is_internal_only: isInternalOnly,
          performed_by: "Dr. Chioma Okonkwo (QA)",
          performed_by_role: "Quality Manager",
        }),
      });
      const noteRes = await res.json();
      if (noteRes.success) {
        setNoteText("");
        await fetchComplaint();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      formData.append("uploaded_by", "Purechem Quality Lab");

      const res = await fetch(`/api/complaints/${data.complaint.id}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadRes = await res.json();
      if (uploadRes.success) {
        setUploadFile(null);
        await fetchComplaint();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading investigation workspace...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <Link href="/admin/complaints" className="inline-block px-4 py-2 bg-purechem-navy text-white text-xs font-bold rounded-lg">
          Back to Register
        </Link>
      </div>
    );
  }

  const { complaint, timeline, attachments, feedback } = data;
  const isResolvedOrClosed = complaint.status === "RESOLVED" || complaint.status === "CLOSED";

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/admin/complaints"
          className="text-xs font-semibold text-purechem-orange hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints Register
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchComplaint}
            className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href={`/track?complaint_id=${encodeURIComponent(complaint.complaint_number)}&query=${encodeURIComponent(complaint.customer_email)}`}
            target="_blank"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Customer View ↗
          </Link>
        </div>
      </div>

      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-purechem-navy p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purechem-orange uppercase tracking-wider">
              <span>Purechem QA Investigation Record</span>
              <span>•</span>
              <span>Registered in WAT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">
              {complaint.complaint_number}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Customer: <strong>{complaint.customer_name}</strong> ({complaint.customer_company || "Independent"}) • Tel: {complaint.customer_phone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                isResolvedOrClosed
                  ? "bg-emerald-500 text-white"
                  : complaint.is_overdue
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-purechem-orange text-white"
              }`}
            >
              {complaint.is_overdue && !isResolvedOrClosed ? `OVERDUE • ${complaint.status}` : complaint.status}
            </span>
          </div>
        </div>

        {/* TIMER BAR (Section 7, 8, 29) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-purechem-orange rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isResolvedOrClosed ? "TOTAL RESOLUTION DURATION" : "LIVE INVESTIGATION TIMER"}
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-900">
                {isResolvedOrClosed
                  ? complaint.resolution_time_formatted || complaint.live_duration?.formatted
                  : `OPEN FOR: ${complaint.live_duration?.formatted}`}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <div>Open Date (WAT): <strong>{formatWAT(complaint.complaint_open_time)}</strong></div>
            {complaint.resolved_at && <div>Resolved Date (WAT): <strong>{formatWAT(complaint.resolved_at)}</strong></div>}
            <div>SLA Target: <strong>{complaint.target_resolution_hours || 72} Hours</strong></div>
          </div>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Package className="w-4 h-4 text-purechem-orange" /> Product & Batch
            </h3>
            <div>Product: <strong className="text-slate-900">{complaint.product_name}</strong></div>
            <div>Category: <span className="text-slate-700">{complaint.product_category}</span></div>
            <div>Batch: <strong className="text-purechem-navy font-mono">{complaint.batch_number || "N/A"}</strong></div>
            <div>Invoice: <span className="font-mono">{complaint.invoice_number || "—"}</span></div>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-purechem-orange" /> Classification
            </h3>
            <div>Issue: <strong className="text-slate-900">{complaint.complaint_type}</strong></div>
            <div>Admin Priority: <strong className="text-purechem-orange">{complaint.admin_priority}</strong></div>
            <div>Raised By: <span>{complaint.raised_by_role} ({complaint.raised_by_name || complaint.customer_name})</span></div>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <UserCheck className="w-4 h-4 text-purechem-orange" /> Ownership
            </h3>
            <div>Department: <strong className="text-slate-900">{complaint.assigned_department || "Quality"}</strong></div>
            <div>Assigned Lead: <strong className="text-slate-900">{complaint.assigned_to || "Unassigned"}</strong></div>
            <div>Target SLA: <strong>{complaint.target_resolution_hours} Hours</strong></div>
          </div>

          <div className="md:col-span-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
            <div className="font-bold text-slate-900">Customer Description:</div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>
        </div>
      </div>

      {/* ADMIN WORKSPACE ACTIONS (Section 13: Change Status, Assign, RCA, Resolve) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purechem-orange" />
          Administrative Status Workflow & Assignment
        </h2>

        <form onSubmit={handleUpdateStatusAndAssignment} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Workflow Selector (all 11 ISO/CAPA statuses) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workflow Status (11 ISO Steps)
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purechem-orange"
              >
                <option value="OPEN">1. OPEN</option>
                <option value="ACKNOWLEDGED">2. ACKNOWLEDGED</option>
                <option value="ASSIGNED">3. ASSIGNED</option>
                <option value="INVESTIGATION">4. INVESTIGATION</option>
                <option value="CUSTOMER INFORMATION REQUIRED">5. CUSTOMER INFORMATION REQUIRED</option>
                <option value="SAMPLE REQUIRED">6. SAMPLE REQUIRED</option>
                <option value="UNDER TESTING">7. UNDER TESTING</option>
                <option value="ROOT CAUSE ANALYSIS">8. ROOT CAUSE ANALYSIS</option>
                <option value="ACTION IN PROGRESS">9. ACTION IN PROGRESS</option>
                <option value="RESOLVED">10. RESOLVED (Stops Timer)</option>
                <option value="CLOSED">11. CLOSED (Final)</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Department
              </label>
              <select
                value={assignedDept}
                onChange={(e) => setAssignedDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              >
                <option value="Quality">Quality Assurance (QA)</option>
                <option value="Technical">Technical Services</option>
                <option value="Production">Production & Plant</option>
                <option value="Sales">Commercial Sales</option>
                <option value="Logistics">Logistics & Supply Chain</option>
                <option value="Customer Service">Customer Care</option>
              </select>
            </div>

            {/* Specialist Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Specialist
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Chioma Okonkwo"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>

            {/* Priority Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Priority Level
              </label>
              <select
                value={adminPriority}
                onChange={(e) => setAdminPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              >
                <option value="Critical">Critical (24h SLA)</option>
                <option value="High">High (48h SLA)</option>
                <option value="Medium">Medium (72h SLA)</option>
                <option value="Low">Low (96h SLA)</option>
              </select>
            </div>
          </div>

          {/* Root Cause Analysis & Corrective Actions (CAPA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Root Cause Analysis (RCA)
              </label>
              <textarea
                rows={3}
                placeholder="Identified root cause (e.g. storage temperature, formulation variance, packaging leak)..."
                value={rcaText}
                onChange={(e) => setRcaText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corrective Action (Immediate)
              </label>
              <textarea
                rows={3}
                placeholder="Immediate corrective measure applied (e.g. product replacement, parameter adjustment)..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preventive Action (Long-Term CAPA)
              </label>
              <textarea
                rows={3}
                placeholder="Preventive steps to avoid recurrence across batch runs..."
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Resolution Details (Visible to Customer upon Resolution)
              </label>
              <textarea
                rows={2}
                placeholder="Summary explained to the customer upon resolution..."
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transition Reason / Action Comment
            </label>
            <input
              type="text"
              placeholder="e.g. Retention sample Brookfield test completed. Ready for customer communication."
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {isUpdating ? "Saving Changes & Calculating Timers..." : "Save Workflow Updates"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 14: INTERNAL NOTES VS CUSTOMER COMMUNICATIONS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purechem-orange" />
            Investigation Notes & Communications
          </h2>

          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "timeline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Events ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab("internal")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === "internal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3 h-3 text-amber-500" /> Internal Notes Only
            </button>
            <button
              onClick={() => setActiveTab("attachments")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === "attachments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Paperclip className="w-3 h-3 text-purechem-orange" /> Documents ({attachments.length})
            </button>
          </div>
        </div>

        {/* Note Composer */}
        <form onSubmit={handleAddTimelineNote} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Add Log Entry / Note:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isInternalOnly}
                onChange={(e) => setIsInternalOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-amber-600 rounded"
              />
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Internal Only (Hidden from Customer)</span>
            </label>
          </div>
          <textarea
            rows={2}
            placeholder={
              isInternalOnly
                ? "Internal QA observation (e.g. Batch retention shows 15% solvent loss in warehouse shift 2)..."
                : "Customer communication message (e.g. Our QA lab is currently testing your product sample)..."
            }
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange bg-white"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAddingNote || !noteText.trim()}
              className="px-4 py-1.5 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Post Entry
            </button>
          </div>
        </form>

        {/* Timeline Items List */}
        {activeTab !== "attachments" && (
          <div className="space-y-3">
            {timeline
              .filter((step: any) => (activeTab === "internal" ? step.is_internal_only === 1 : true))
              .map((step: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-1 ${
                    step.is_internal_only === 1
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{step.action}</span>
                      {step.is_internal_only === 1 && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> INTERNAL ONLY
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatWAT(step.created_at)}
                    </span>
                  </div>
                  {step.comment && <p className="text-slate-700 leading-relaxed">{step.comment}</p>}
                  <div className="text-[10px] text-slate-400 pt-1">
                    Recorded by: {step.performed_by} ({step.performed_by_role || "Staff"})
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Attachments Tab */}
        {activeTab === "attachments" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {attachments.map((att: any) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3 transition-colors"
                >
                  <FileText className="w-6 h-6 text-purechem-orange shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-800 text-xs truncate hover:underline">
                      {att.file_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {(att.file_size / 1024).toFixed(1)} KB • {att.attachment_category}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Upload lab / RCA document */}
            <form onSubmit={handleUploadDocument} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Upload QA / Lab / RCA Document:</div>
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="lab_report">Laboratory Test Report</option>
                  <option value="rca_document">Root Cause Analysis Sheet</option>
                  <option value="capa_document">CAPA Corrective Action Sheet</option>
                  <option value="customer_evidence">Customer Evidence</option>
                </select>
                <input
                  type="file"
                  onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                  className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-200"
                />
                {uploadFile && (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-1.5 bg-purechem-navy text-white rounded-lg font-bold"
                  >
                    {isUploading ? "Uploading..." : "Upload Document"}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* CUSTOMER FEEDBACK AUDIT (Section 18) */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-2 text-xs">
          <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Customer Satisfaction Audit Record
          </div>
          <div>Rating: <strong>{feedback.rating} / 5 Stars</strong></div>
          <div>Satisfactorily Resolved: <strong>{feedback.resolution_satisfaction}</strong></div>
          {feedback.comments && <div>Customer Remarks: <em className="text-slate-700">"{feedback.comments}"</em></div>}
          <div className="text-[10px] text-emerald-700 pt-1">
            Submitted at {formatWAT(feedback.submitted_at)} by {feedback.customer_name}
          </div>
        </div>
      )}
    </div>
  );
}
