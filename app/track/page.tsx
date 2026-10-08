"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  Calendar,
  FileText,
  Star,
  Send,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

function TrackContent() {
  const searchParams = useSearchParams();
  const [complaintId, setComplaintId] = useState("");
  const [verification, setVerification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  // Customer feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSatisfied, setFeedbackSatisfied] = useState("Yes");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get("complaint_id");
    const queryParam = searchParams.get("query");
    if (idParam && queryParam) {
      setComplaintId(idParam);
      setVerification(queryParam);
      performTrack(idParam, queryParam);
    }
  }, [searchParams]);

  const performTrack = async (id: string, verify: string) => {
    setError("");
    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_id: id, verification: verify }),
      });
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || "Complaint not found or verification mismatch.");
      }
      setData(resData);
    } catch (err: any) {
      setError(err.message || "Failed to look up complaint.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim() || !verification.trim()) {
      setError("Please enter both Complaint ID and your registered Email or Phone number.");
      return;
    }
    performTrack(complaintId.trim(), verification.trim());
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.complaint?.id) return;
    setFeedbackSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${data.complaint.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          resolution_satisfaction: feedbackSatisfied,
          comments: feedbackComments,
          customer_name: data.complaint.customer_name,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setFeedbackSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Status color badge
  const getStatusBadge = (status: string, overdue: number) => {
    if (overdue && status !== "RESOLVED" && status !== "CLOSED") {
      return <span className="px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-full text-xs border border-rose-300">OVERDUE • {status}</span>;
    }
    switch (status) {
      case "OPEN":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-xs">OPEN</span>;
      case "ACKNOWLEDGED":
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-full text-xs">ACKNOWLEDGED</span>;
      case "ASSIGNED":
      case "INVESTIGATION":
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full text-xs">{status}</span>;
      case "UNDER TESTING":
      case "ROOT CAUSE ANALYSIS":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold rounded-full text-xs">{status}</span>;
      case "RESOLVED":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">RESOLVED</span>;
      case "CLOSED":
        return <span className="px-3 py-1 bg-slate-200 text-slate-800 font-bold rounded-full text-xs">CLOSED</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <Search className="w-8 h-8 text-purechem-orange" />
          Track Complaint Status
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Enter your reference number and registered phone or email address to verify identity and view live progress.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complaint Reference Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PCM-NG-20261008-0001"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange font-mono"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email or Phone (+234)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +234802... or email@company.com"
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-purechem-navy hover:bg-purechem-navy-dark text-white font-bold rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Track Progress"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* TRACKING DETAILS CARD */}
      {data && data.complaint && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-6">
          {/* Header banner */}
          <div className="bg-purechem-navy p-6 text-white flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="text-xs text-slate-300 font-medium">COMPLAINT REFERENCE ID</div>
              <div className="text-2xl font-mono font-extrabold text-white tracking-wide">
                {data.complaint.complaint_number}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(data.complaint.status, data.complaint.is_overdue)}
            </div>
          </div>

          {/* TIMER BANNER (Section 7, 8, 29) */}
          <div className="px-6 sm:px-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 text-purechem-orange rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {data.complaint.status === "RESOLVED" || data.complaint.status === "CLOSED"
                      ? "FINAL RESOLUTION TIME"
                      : "CURRENT RESOLUTION TIMER (WAT)"}
                  </div>
                  <div className="text-lg sm:text-xl font-mono font-bold text-slate-900">
                    {data.complaint.status === "RESOLVED" || data.complaint.status === "CLOSED"
                      ? data.complaint.resolution_time_formatted || data.complaint.live_duration?.formatted
                      : `OPEN FOR: ${data.complaint.live_duration?.formatted}`}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div>Registered: <strong>{new Date(data.complaint.complaint_open_time).toLocaleString()} WAT</strong></div>
                {data.complaint.resolved_at && (
                  <div>Resolved: <strong>{new Date(data.complaint.resolved_at).toLocaleString()} WAT</strong></div>
                )}
              </div>
            </div>
          </div>

          {/* Complaint Info Grid */}
          <div className="px-6 sm:px-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-400 font-semibold uppercase">Product</span>
              <div className="font-bold text-slate-900 text-sm">{data.complaint.product_name}</div>
              <div className="text-slate-500">Category: {data.complaint.product_category}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <span className="text-slate-400 font-semibold uppercase">Batch Information</span>
              <div className="font-bold text-slate-900 text-sm">Batch: {data.complaint.batch_number || "Not Specified"}</div>
              <div className="text-slate-500">Issue Type: {data.complaint.complaint_type}</div>
            </div>
          </div>

          {/* Resolution Details (if resolved) */}
          {data.complaint.resolution_details && (
            <div className="px-6 sm:px-8">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Quality Department Resolution Summary
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {data.complaint.resolution_details}
                </p>
              </div>
            </div>
          )}

          {/* VERIFIED CUSTOMER TIMELINE (Section 12, 14 - internal notes stripped) */}
          <div className="px-6 sm:px-8 pb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Verified Progress Timeline
            </h3>

            <div className="space-y-4">
              {data.timeline?.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-purechem-orange ring-4 ring-orange-50 shrink-0 mt-0.5"></div>
                    {idx < data.timeline.length - 1 && <div className="w-0.5 grow bg-slate-200 my-1"></div>}
                  </div>
                  <div className="space-y-0.5 grow pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{step.action}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(step.created_at).toLocaleString()} WAT
                      </span>
                    </div>
                    {step.comment && <p className="text-slate-600">{step.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CUSTOMER SATISFACTION FEEDBACK FORM (Section 18) */}
          {(data.complaint.status === "RESOLVED" || data.complaint.status === "CLOSED") && (
            <div id="feedback" className="bg-slate-50 p-6 sm:p-8 border-t border-slate-200">
              {feedbackSuccess ? (
                <div className="p-4 bg-emerald-100 text-emerald-900 rounded-xl text-center text-sm font-bold">
                  ✓ Thank you! Your feedback has been recorded into our quality audit register.
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">Rate Your Resolution Experience</h4>
                    <p className="text-xs text-slate-500">
                      Was your product complaint resolved satisfactorily by Purechem Manufacturing?
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {["Yes", "Partially", "No"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFeedbackSatisfied(opt)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          feedbackSatisfied === opt
                            ? "bg-purechem-navy text-white border-purechem-navy"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Additional Comments / Suggestions
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share your experience with the resolution speed or quality engineer..."
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-purechem-orange"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <React.Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-slate-500 text-sm">Loading complaint tracker...</div>}>
      <TrackContent />
    </React.Suspense>
  );
}
