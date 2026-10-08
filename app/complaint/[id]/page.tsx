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
  Star,
  Send,
  Building,
  Calendar,
  Package,
  ShieldCheck,
  User,
  ArrowLeft,
  Paperclip,
} from "lucide-react";

export default function CustomerComplaintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Uploading additional requested evidence
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Customer Feedback
  const [rating, setRating] = useState(5);
  const [satisfaction, setSatisfaction] = useState("Yes");
  const [comments, setComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

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
      if (resData.feedback) {
        setFeedbackDone(true);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAdditional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !data?.complaint?.id) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", "customer_evidence");
      formData.append("uploaded_by", data.complaint.customer_name);

      const res = await fetch(`/api/complaints/${data.complaint.id}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadRes = await res.json();
      if (uploadRes.success) {
        setUploadFile(null);
        fetchComplaint(); // refresh timeline and attachments
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.complaint?.id) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/complaints/${data.complaint.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          resolution_satisfaction: satisfaction,
          comments,
          customer_name: data.complaint.customer_name,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setFeedbackDone(true);
        fetchComplaint();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-slate-500 text-sm">Loading complaint details...</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">{error || "Could not retrieve the requested record."}</p>
        <Link href="/portal" className="inline-block px-4 py-2 bg-purechem-navy text-white text-xs font-bold rounded-lg">
          Return to My Complaints
        </Link>
      </div>
    );
  }

  const { complaint, timeline, attachments, feedback } = data;
  const isResolvedOrClosed = complaint.status === "RESOLVED" || complaint.status === "CLOSED";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/portal" className="text-xs font-semibold text-purechem-orange hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Complaints
        </Link>
        <span className="text-xs text-slate-400">Purechem Quality Management • Lagos, Nigeria</span>
      </div>

      {/* Main Banner */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-purechem-navy p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-purechem-orange uppercase tracking-wider">
              Official Quality Ticket
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-black tracking-wide text-white mt-1">
              {complaint.complaint_number}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Registered by {complaint.customer_name} ({complaint.customer_company || "Direct Customer"})
            </p>
          </div>

          <div>
            <span
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm ${
                isResolvedOrClosed
                  ? "bg-emerald-500 text-white"
                  : complaint.is_overdue
                  ? "bg-rose-500 text-white"
                  : "bg-purechem-orange text-white"
              }`}
            >
              {complaint.is_overdue && !isResolvedOrClosed ? `OVERDUE • ${complaint.status}` : complaint.status}
            </span>
          </div>
        </div>

        {/* SERVER-SIDE RESOLUTION TIMER (Section 7, 8, 29) */}
        <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-orange-100 text-purechem-orange rounded-2xl shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isResolvedOrClosed ? "TOTAL RESOLUTION DURATION" : "LIVE RESOLUTION TIMER (WAT)"}
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
                {isResolvedOrClosed
                  ? complaint.resolution_time_formatted || complaint.live_duration?.formatted
                  : `OPEN FOR: ${complaint.live_duration?.formatted}`}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <div>
              Registered: <strong>{new Date(complaint.complaint_open_time).toLocaleString()} WAT</strong>
            </div>
            {complaint.resolved_at && (
              <div>
                Resolved: <strong>{new Date(complaint.resolved_at).toLocaleString()} WAT</strong>
              </div>
            )}
            <div>
              SLA Resolution Target: <strong>{complaint.target_resolution_hours || 72} Hours</strong>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Product & Batch */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-purechem-orange" /> Product Details
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Product Name:</span>
                <span className="font-bold text-slate-900">{complaint.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product Category:</span>
                <span className="font-semibold text-slate-800">{complaint.product_category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Number:</span>
                <span className="font-mono font-bold text-purechem-navy">{complaint.batch_number || "Not Provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pack Size / Affected:</span>
                <span className="font-medium text-slate-800">{complaint.pack_size || "—"} ({complaint.quantity_purchased || "N/A"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono text-slate-700">{complaint.invoice_number || "—"}</span>
              </div>
            </div>
          </div>

          {/* Complaint Classification */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purechem-orange" /> Issue Classification
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Complaint Type:</span>
                <span className="font-bold text-slate-900">{complaint.complaint_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Priority:</span>
                <span className="font-semibold text-purechem-orange">{complaint.customer_priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Department:</span>
                <span className="font-bold text-slate-800">{complaint.assigned_department || "Quality Assurance"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Specialist:</span>
                <span className="font-medium text-slate-700">{complaint.assigned_to || "Quality Officer"}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Reported Complaint Description</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {/* Resolution Details */}
          {complaint.resolution_details && (
            <div className="md:col-span-2 p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Quality Department Official Resolution
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {complaint.resolution_details}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EVIDENCE ATTACHMENTS & UPLOAD SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-purechem-orange" />
            Supporting Photos & Documents ({attachments.length})
          </h2>
        </div>

        {attachments.length === 0 ? (
          <p className="text-xs text-slate-500">No documents attached to this complaint yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attachments.map((att: any) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3 transition-colors group"
              >
                <FileText className="w-6 h-6 text-purechem-orange shrink-0" />
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 text-xs truncate group-hover:underline">
                    {att.file_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {(att.file_size / 1024).toFixed(1)} KB • {att.attachment_category}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Upload additional evidence if requested by quality team (Section 5) */}
        <form onSubmit={handleUploadAdditional} className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-600 font-semibold">Attach Additional Document / Photo:</div>
          <input
            type="file"
            onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          {uploadFile && (
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-1.5 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          )}
        </form>
      </div>

      {/* VERIFIED CUSTOMER TIMELINE (Section 12, 14) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purechem-orange" />
          Complaint Investigation Timeline (West Africa Time)
        </h2>

        <div className="space-y-4">
          {timeline.map((step: any, idx: number) => (
            <div key={idx} className="flex gap-4 text-xs">
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-purechem-orange ring-4 ring-orange-100 shrink-0 mt-0.5"></div>
                {idx < timeline.length - 1 && <div className="w-0.5 grow bg-slate-200 my-1"></div>}
              </div>
              <div className="space-y-1 grow pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-sm">{step.action}</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(step.created_at).toLocaleString()} WAT
                  </span>
                </div>
                {step.comment && <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{step.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CUSTOMER SATISFACTION FEEDBACK (Section 18) */}
      {isResolvedOrClosed && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Customer Service Feedback
          </h2>

          {feedbackDone ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-emerald-900 text-sm">
                ✓ Feedback Recorded
              </div>
              <p className="text-emerald-700">
                Rating: <strong>{feedback?.rating || rating}/5 Stars</strong> • Satisfied: <strong>{feedback?.resolution_satisfaction || satisfaction}</strong>
              </p>
              {feedback?.comments && <p className="text-slate-600 italic">"{feedback.comments}"</p>}
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Was your complaint resolved satisfactorily?
                </label>
                <div className="flex gap-3">
                  {["Yes", "Partially", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSatisfaction(opt)}
                      className={`px-4 py-2 rounded-lg font-bold border transition-colors ${
                        satisfaction === opt
                          ? "bg-purechem-navy text-white border-purechem-navy"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Overall Service Rating:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Comments / Observations:
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us about your experience with our technical resolution..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Submit Resolution Feedback
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
