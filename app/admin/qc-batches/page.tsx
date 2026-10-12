"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Building,
  Package,
  Clock,
  ArrowRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
  X,
  Eye,
  Check,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const PRODUCT_CATEGORIES = [
  "ALL",
  "IAD-Industrial Adhesive",
  "CPD-Consumer Product Division",
  "CCD-Construction Chemical Division",
  "DCP-Dry Powder Chemical",
];

export default function QcBatchesRegisterPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal State for New QC Entry
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");

  // Inspect Modal
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Master products for dropdown
  const [productsList, setProductsList] = useState<any[]>([]);

  // Daily Logging Form State
  const [formData, setFormData] = useState({
    batch_number: "",
    product_category: "CCD-Construction Chemical Division",
    product_name: "Top Fix Super : Grey - 20 Kg",
    product_code: "CCD-FGM-0000FC45",
    manufacturing_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    testing_date: new Date().toISOString().split("T")[0],
    tested_by: "Rajesh Poojari (QC Manager)",

    // Core Testing Parameters
    appearance: "Passed",
    appearance_notes: "Homogeneous consistency, free of lumps and uniform colour",
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
    fetchBatches();
    fetchProducts();
  }, [statusFilter, categoryFilter]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/qc-batches";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (searchTerm) params.append("search", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
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

  const handleProductChange = (prodCodeName: string) => {
    const [code, name] = prodCodeName.split(":::");
    const matched = productsList.find((p) => p.product_code === code && p.product_name === name);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        product_name: matched.product_name,
        product_code: matched.product_code,
        product_category: matched.category_name || prev.product_category,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!formData.batch_number.trim()) {
      setModalError("Batch Number is required.");
      return;
    }
    if (!formData.product_name.trim()) {
      setModalError("Please select a Product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/qc-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setModalSuccess(`Batch ${formData.batch_number.toUpperCase()} recorded successfully in QC Register!`);
      fetchBatches();
      setTimeout(() => {
        setShowLogModal(false);
        setModalSuccess("");
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || "Failed to record QC batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs
  const totalBatches = batches.length;
  const passedBatches = batches.filter((b) => b.qc_status === "Passed").length;
  const failedBatches = batches.filter((b) => b.qc_status === "Failed").length;
  const holdBatches = batches.filter((b) => b.qc_status === "Hold").length;

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4 text-emerald-600" /> Laboratory Quality Control & Daily Batch Register
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
            Daily QC Batch Data Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Daily logging of batch testing parameters: <strong>Appearance</strong>, <strong>Viscosity</strong>, <strong>Solid Content</strong>, and <strong>Bond Strength</strong> (Pass/Fail) with retention sample tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setModalError("");
              setModalSuccess("");
              setShowLogModal(true);
            }}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> + Log Daily Batch QC Data
          </button>

          <Link
            href="/admin/resolve"
            className="px-4 py-3 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Complaints Resolution Desk →
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Batches Tested</div>
          <div className="text-3xl font-black text-[#0A2540] mt-2">{totalBatches}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded in QC lab log</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Batches Passed</div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{passedBatches}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">All 4 parameters approved</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Batches Failed / Rejected</div>
          <div className="text-3xl font-black text-rose-700 mt-2">{failedBatches}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Non-compliant parameter</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">On Hold / Retesting</div>
          <div className="text-3xl font-black text-amber-700 mt-2">{holdBatches}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting re-check</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search batch number, product, tester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBatches()}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="Passed">Passed Only</option>
            <option value="Failed">Failed Only</option>
            <option value="Hold">On Hold Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          <button
            onClick={fetchBatches}
            className="p-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-bold cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QC Batches Register Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-sm text-[#0A2540]">
              Master QC Laboratory Batch Testing Register
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{batches.length} registered batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Batch Number</th>
                <th className="p-4">Product & Category</th>
                <th className="p-4">Mfg / Exp Date</th>
                <th className="p-4">Appearance</th>
                <th className="p-4">Viscosity</th>
                <th className="p-4">Solid Content</th>
                <th className="p-4">Bond Strength</th>
                <th className="p-4">Overall Result</th>
                <th className="p-4">Tested By</th>
                <th className="p-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Loading QC batch records...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">No QC batch records found. Click "+ Log Daily Batch QC Data" above to add.</td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Batch Number */}
                    <td className="p-4 font-mono font-black text-slate-900">
                      {b.batch_number}
                    </td>

                    {/* Product */}
                    <td className="p-4 max-w-[200px]">
                      <div className="font-bold text-slate-900 truncate">{b.product_name}</div>
                      {b.product_category && (
                        <div className="text-[10px] text-slate-400 truncate">{b.product_category}</div>
                      )}
                    </td>

                    {/* Mfg / Exp */}
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      <div>M: {b.manufacturing_date || "—"}</div>
                      <div className="text-slate-400 text-[10px]">E: {b.expiry_date || "—"}</div>
                    </td>

                    {/* Appearance */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        b.appearance === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {b.appearance === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {b.appearance || "Passed"}
                      </span>
                    </td>

                    {/* Viscosity */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        b.viscosity_status === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {b.viscosity_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {b.viscosity_status || "Passed"}
                      </span>
                      {b.viscosity_value && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">{b.viscosity_value}</div>
                      )}
                    </td>

                    {/* Solid Content */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        b.solid_content_status === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {b.solid_content_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {b.solid_content_status || "Passed"}
                      </span>
                      {b.solid_content_value && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.solid_content_value}</div>
                      )}
                    </td>

                    {/* Bond Strength */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        b.bond_strength_status === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {b.bond_strength_status === "Failed" ? <XCircle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {b.bond_strength_status || "Passed"}
                      </span>
                      {b.bond_strength_value && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">{b.bond_strength_value}</div>
                      )}
                    </td>

                    {/* Overall Status */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                        b.qc_status === "Passed"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : b.qc_status === "Failed"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-amber-500 text-white shadow-sm"
                      }`}>
                        {b.qc_status}
                      </span>
                    </td>

                    {/* Tested By */}
                    <td className="p-4 whitespace-nowrap text-slate-600">
                      <div>{b.tested_by || "QC Executive"}</div>
                      <div className="text-slate-400 text-[10px]">{b.testing_date || "—"}</div>
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedBatch(b)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#0A2540] hover:text-white text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DAILY QC BATCH DATA LOGGING (APPEARANCE, VISCOSITY, SOLIDS, BOND) */}
      {/* ========================================================================= */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0A2540]">
                    Daily QC Batch Parameter Entry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Log laboratory testing metrics for manufactured batch.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}
            {modalError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Batch & Product Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  1. Batch & Product Traceability
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-black text-red-600 uppercase mb-1">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-2409-12 / LOT-4890"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Mfg Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.manufacturing_date}
                      onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Exp Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Select Purechem Product *
                    </label>
                    <select
                      value={`${formData.product_code}:::${formData.product_name}`}
                      onChange={(e) => handleProductChange(e.target.value)}
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

              {/* CORE PARAMETERS (Appearance, Viscosity, Solids, Bond Strength) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-[#0A2540] tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" /> 2. Core Quality Testing Parameters
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Parameter 1: Appearance */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">A. Appearance Test *</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, appearance: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.appearance === "Passed"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, appearance: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.appearance === "Failed"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Observation: e.g. Smooth homogeneous emulsion, no separation or lumps"
                      value={formData.appearance_notes}
                      onChange={(e) => setFormData({ ...formData, appearance_notes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>

                  {/* Parameter 2: Viscosity */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">B. Viscosity Test *</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, viscosity_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.viscosity_status === "Passed"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, viscosity_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.viscosity_status === "Failed"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 45,000 cPs (Brookfield Spindle 6 / 20 RPM @ 25°C)"
                      value={formData.viscosity_value}
                      onChange={(e) => setFormData({ ...formData, viscosity_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Parameter 3: Solid Content */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">C. Solid Content Test *</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, solid_content_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.solid_content_status === "Passed"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, solid_content_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.solid_content_status === "Failed"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 48.5% (Oven test 105°C / 2 hours)"
                      value={formData.solid_content_value}
                      onChange={(e) => setFormData({ ...formData, solid_content_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>

                  {/* Parameter 4: Bond Strength */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 uppercase">D. Bond Strength Test *</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bond_strength_status: "Passed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.bond_strength_status === "Passed"
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Passed
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, bond_strength_status: "Failed" })}
                          className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            formData.bond_strength_status === "Failed"
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Measured value: e.g. 8.2 MPa / Complete wood substrate tear"
                      value={formData.bond_strength_value}
                      onChange={(e) => setFormData({ ...formData, bond_strength_value: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* OVERALL DECISION & TESTER */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  3. Overall QC Decision & Counter Retention
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-black text-slate-800 uppercase mb-1">
                      Overall QC Certification Status *
                    </label>
                    <select
                      value={formData.qc_status}
                      onChange={(e) => setFormData({ ...formData, qc_status: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-extrabold bg-white text-slate-900"
                    >
                      <option value="Passed">Passed (Approved for Dispatch)</option>
                      <option value="Failed">Failed (Rejected / Quarantine)</option>
                      <option value="Hold">Hold (Retest / Investigation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Tested By (QC Executive / Officer) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tested_by}
                      onChange={(e) => setFormData({ ...formData, tested_by: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      QC Remarks & Counter Retention Location:
                    </label>
                    <input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="e.g. Counter sample stored on Shelf C-2 in Retention Room, Lagos Lab."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Saving to QC Database..." : "Save Daily QC Batch Record →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT BATCH QUALITY CERTIFICATE                                   */}
      {/* ========================================================================= */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">QC Laboratory Certificate</span>
                <h3 className="text-lg font-black text-[#0A2540] font-mono">
                  Batch: {selectedBatch.batch_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Product:</span>
                  <span className="font-bold text-slate-900">{selectedBatch.product_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">QC Status:</span>
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[10px] ${
                    selectedBatch.qc_status === "Passed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedBatch.qc_status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mfg Date:</span>
                  <span className="font-medium text-slate-800">{selectedBatch.manufacturing_date || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Exp Date:</span>
                  <span className="font-medium text-slate-800">{selectedBatch.expiry_date || "—"}</span>
                </div>
              </div>
            </div>

            {/* Test parameters */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase text-[10px]">Tested Parameters:</h4>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Appearance:</span>
                  <div className="text-[11px] text-slate-500">{selectedBatch.appearance_notes || "Visual standard"}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedBatch.appearance === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {selectedBatch.appearance || "Passed"}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Viscosity:</span>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedBatch.viscosity_value || selectedBatch.viscosity || "Standard"}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedBatch.viscosity_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {selectedBatch.viscosity_status || "Passed"}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Solid Content:</span>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedBatch.solid_content_value || selectedBatch.solids || "Standard"}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedBatch.solid_content_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {selectedBatch.solid_content_status || "Passed"}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Bond Strength:</span>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedBatch.bond_strength_value || "Passed shear adhesion"}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  selectedBatch.bond_strength_status === "Failed" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {selectedBatch.bond_strength_status || "Passed"}
                </span>
              </div>
            </div>

            {selectedBatch.remarks && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-700 block uppercase text-[10px]">Remarks & Retention Shelf:</strong>
                {selectedBatch.remarks}
              </div>
            )}

            <button
              onClick={() => setSelectedBatch(null)}
              className="w-full py-2.5 bg-[#0A2540] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
