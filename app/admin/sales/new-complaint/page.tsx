"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Copy,
  ArrowRight,
  ShieldAlert,
  Info,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  Package,
  Clock,
  Check,
  Search,
} from "lucide-react";

const SALES_MANAGERS = [
  "Ishan Phadke",
  "Indra",
  "Lognath",
  "Aravind Nagraj",
];

const CUSTOMER_TYPES = [
  "Distributor",
  "Dealer",
  "Direct Customer",
  "Applicator",
  "Contractor",
  "Other",
];

const PRODUCT_CATEGORIES = [
  "IAD-Industrial Adhesive",
  "CPD-Consumer Product Division",
  "CCD-Construction Chemical Division",
  "DCP-Dry Powder Chemical",
];

const DEFAULT_COMPLAINT_TYPES = [
  "Product Quality",
  "Product Performance",
  "Packaging Issue",
  "Leakage",
  "Short Quantity",
  "Colour Variation",
  "Viscosity Issue",
  "Adhesion Issue",
  "Drying/Curing Issue",
  "Settling",
  "Gel Formation",
  "Odour Issue",
  "Contamination",
  "Wrong Product Supplied",
  "Damaged Material",
  "Delivery Issue",
  "Documentation Issue",
  "Other",
];

function ComplaintRegistrationForm({ isSalesPortal = false }: { isSalesPortal?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salesManager, setSalesManager] = useState<string>(SALES_MANAGERS[0]);
  const [categories, setCategories] = useState<string[]>(PRODUCT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>(PRODUCT_CATEGORIES[2]); // CCD default
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [complaintTypesList, setComplaintTypesList] = useState<string[]>(DEFAULT_COMPLAINT_TYPES);

  // Other product fallback
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    // Section 1: Customer Details
    customer_name: "",
    customer_company: "",
    customer_email: "",
    customer_phone: "+234",
    customer_address: "",

    // Section 2: Customer Type & Category
    customer_type: "Distributor",
    product_category: PRODUCT_CATEGORIES[2],
    product_name: "",
    product_code: "",

    // Section 3: Batch Number & Purchase Traceability
    batch_number: "",
    manufacturing_date: "",
    expiry_date: "",
    pack_size: "",
    quantity_purchased: "",
    invoice_number: "",
    purchase_date: "",

    // Section 4: Nature of Complaint & Description
    complaint_type: "Product Quality",
    customer_priority: "Normal",
    description: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedComplaint, setSubmittedComplaint] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        if (data.categories?.length) {
          setCategories(data.categories.map((c: any) => c.name));
        }
        if (data.products?.length) {
          setAllProducts(data.products);
        }
        if (data.complaintTypes?.length) {
          setComplaintTypesList(data.complaintTypes.map((t: any) => t.name));
        }
      }
    } catch (e) {
      console.error("Failed to load metadata", e);
    }
  };

  // Filter products when category or search changes
  useEffect(() => {
    let prods = allProducts;
    if (selectedCategory) {
      const prefix = selectedCategory.split("-")[0].trim().toUpperCase();
      prods = prods.filter(
        (p: any) =>
          p.category_name === selectedCategory ||
          (p.product_code && p.product_code.toUpperCase().startsWith(prefix))
      );
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      prods = prods.filter(
        (p: any) =>
          p.product_name?.toLowerCase().includes(q) ||
          p.product_code?.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(prods);
  }, [allProducts, selectedCategory, productSearch]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setFormData((prev) => ({
      ...prev,
      product_category: cat,
      product_name: "",
      product_code: "",
      pack_size: "",
    }));
    setIsOtherProduct(false);
  };

  const handleProductSelect = (prod: any) => {
    if (prod === "OTHER") {
      setIsOtherProduct(true);
      setFormData((prev) => ({
        ...prev,
        product_name: "Other Purechem Product",
        product_code: "PCM-OTHER",
      }));
      return;
    }
    setIsOtherProduct(false);
    setFormData((prev) => ({
      ...prev,
      product_name: prod.product_name,
      product_code: prod.product_code,
      pack_size: prod.pack_size || prev.pack_size,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!salesManager) {
      setErrorMessage("Please select the logging Sales Manager.");
      return;
    }
    if (!formData.customer_name.trim()) {
      setErrorMessage("Please enter the Customer / Contact Person Name.");
      return;
    }
    if (!formData.customer_company.trim()) {
      setErrorMessage("Please enter the Customer Company Name.");
      return;
    }
    if (!formData.customer_email.trim() || !formData.customer_email.includes("@")) {
      setErrorMessage("Please enter a valid Customer Email Address.");
      return;
    }
    if (!formData.customer_phone.trim() || formData.customer_phone.length < 8) {
      setErrorMessage("Please enter a valid Phone Number (+234 format).");
      return;
    }
    if (isOtherProduct && !customProductName.trim()) {
      setErrorMessage("Please enter the custom Product Name.");
      return;
    }
    if (!isOtherProduct && !formData.product_name.trim()) {
      setErrorMessage("Please select a Product from Section 2.");
      return;
    }
    if (!formData.batch_number.trim()) {
      setErrorMessage("Batch Number is mandatory for quality investigation.");
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      setErrorMessage("Please provide a detailed description (at least 15 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalProductName = isOtherProduct ? customProductName.trim() : formData.product_name;
      const payload = {
        ...formData,
        sales_manager_name: salesManager,
        raised_by_role: "Sales",
        raised_by_name: salesManager,
        product_name: finalProductName,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit complaint");
      }

      const createdComplaint = data.complaint;

      // Upload any attached files
      if (files.length > 0 && createdComplaint) {
        for (const file of files) {
          const fileData = new FormData();
          fileData.append("file", file);
          fileData.append("category", "customer_evidence");
          fileData.append("uploaded_by", salesManager);
          await fetch(`/api/complaints/${createdComplaint.id}/upload`, {
            method: "POST",
            body: fileData,
          });
        }
      }

      setSubmittedComplaint(createdComplaint);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // SUCCESS CONFIRMATION MODAL / SCREEN
  if (submittedComplaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0A2540] to-blue-900 p-8 text-white text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              Workflow Stage 1 Activated
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Complaint Submitted to Rajesh Poojari (QC Manager)
            </h1>
            <p className="text-sm text-blue-200 max-w-lg mx-auto leading-relaxed">
              Successfully logged by Sales Manager <strong className="text-white">{salesManager}</strong>. Complaint is queued for QC Validation under the 48-Hour Response SLA.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Reference Number Box */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3">
              <div className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Official Purechem Complaint Number
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-4xl font-mono font-black text-[#0A2540] tracking-wider">
                  {submittedComplaint.complaint_number}
                </span>
                <button
                  onClick={() => copyToClipboard(submittedComplaint.complaint_number)}
                  className="p-2.5 text-slate-500 hover:text-[#0A2540] hover:bg-slate-200 rounded-xl transition-colors shadow-sm bg-white border border-slate-200"
                  title="Copy Reference ID"
                >
                  {copiedId ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-600" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Complaint ID: <code className="font-mono font-semibold">{submittedComplaint.id}</code>
              </p>
            </div>

            {/* SLA Workflow Notice Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Response SLA: 48 Hours
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Rajesh Poojari will review the complaint, inspect counter-retention samples, and either Accept or Reject with mandatory laboratory justification.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Resolution SLA: 7 Working Days
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Once accepted, the 7-working-day resolution clock starts. Assigned officers in Sales, Production, or Quality must complete investigation before final QC closure.
                </p>
              </div>
            </div>

            {/* Complaint Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Submission Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Sales Manager:</span>
                  <span className="font-bold text-slate-800">{salesManager}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer Company:</span>
                  <span className="font-bold text-slate-800">{formData.customer_company}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer Type:</span>
                  <span className="font-bold text-slate-800">{formData.customer_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-bold text-slate-800">{formData.product_category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Product:</span>
                  <span className="font-bold text-slate-800">{formData.product_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Batch Number:</span>
                  <span className="font-bold text-red-600 font-mono">{formData.batch_number}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmittedComplaint(null);
                  setFiles([]);
                  setFormData((prev) => ({
                    ...prev,
                    batch_number: "",
                    invoice_number: "",
                    quantity_purchased: "",
                    description: "",
                  }));
                }}
                className="flex-1 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" /> Log Another Complaint
              </button>

              <Link
                href="/admin/resolve"
                className="flex-1 py-3 px-4 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2 transition-colors"
              >
                Go to Resolution Desk <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0A2540] via-blue-700 to-[#FF6900]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider mb-2">
              Purechem Technical & Quality Division
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              Sales Manager Complaint Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Official registration desk for logging customer complaints. Every case is routed directly to <strong>Rajesh Poojari (QC Manager)</strong> for counter-sample evaluation under the 48-Hour Response SLA.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400">Destination Reviewer</div>
              <div className="text-sm font-black text-[#0A2540]">Rajesh Poojari</div>
              <div className="text-[11px] font-semibold text-emerald-600">QC Manager</div>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Please correct the following:</h3>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LOGGED BY SALES MANAGER SELECTOR */}
        <div className="bg-gradient-to-r from-blue-900 to-[#0A2540] p-6 rounded-3xl text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" /> Logged By (Authorized Sales Manager) *
              </div>
              <p className="text-xs text-blue-200">
                Only designated Purechem Sales Managers can log complaints into the portal.
              </p>
            </div>
            <div className="sm:w-72">
              <select
                value={salesManager}
                onChange={(e) => setSalesManager(e.target.value)}
                className="w-full bg-white text-slate-900 font-bold px-4 py-2.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm shadow-sm"
                required
              >
                {SALES_MANAGERS.map((sm) => (
                  <option key={sm} value={sm}>
                    {sm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 1: CUSTOMER DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2540]">
                Section 1: Customer Information
              </h2>
              <p className="text-xs text-slate-500">
                Customer company details and primary technical contact.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer / Company Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Construction Ltd / Kabor Furniture"
                  value={formData.customer_company}
                  onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Person Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alhaji Danladi Musa / Engr. Emeka"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="customer@company.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (+234 format) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="+234 803 123 4567"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Address / State / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 14 Commercial Area, Ikeja / Kano Depot / Onitsha Market"
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CUSTOMER TYPE & PRODUCT CATEGORY */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2540]">
                Section 2: Customer Classification & Product Master
              </h2>
              <p className="text-xs text-slate-500">
                Select Customer Type and the designated Purechem Product Category.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Type *
              </label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-bold text-slate-800 bg-white"
              >
                {CUSTOMER_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Category (4 Defined Categories) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-bold text-slate-800 bg-white"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Selector with Search */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#0A2540] uppercase tracking-wider">
                  Select Purechem Product ({filteredProducts.length} items available) *
                </label>
                <p className="text-xs text-slate-500">
                  Filtered by {selectedCategory}. Search by item code or product name.
                </p>
              </div>

              {/* Search box */}
              <div className="relative sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code or name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {!isOtherProduct && (
              <div className="space-y-2">
                <select
                  value={formData.product_code ? `${formData.product_code}:::${formData.product_name}` : ""}
                  onChange={(e) => {
                    if (e.target.value === "OTHER") {
                      handleProductSelect("OTHER");
                    } else if (e.target.value) {
                      const [code, name] = e.target.value.split(":::");
                      const matched = allProducts.find((p) => p.product_code === code && p.product_name === name);
                      if (matched) handleProductSelect(matched);
                    }
                  }}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-semibold text-slate-900 bg-white"
                  required
                >
                  <option value="">-- Select Product from Catalog ({filteredProducts.length}) --</option>
                  {filteredProducts.map((p: any, idx: number) => (
                    <option key={`${p.product_code}-${idx}`} value={`${p.product_code}:::${p.product_name}`}>
                      {p.product_code ? `[${p.product_code}] ` : ""}{p.product_name}
                    </option>
                  ))}
                  <option value="OTHER">+ Other / Unlisted Product</option>
                </select>

                {formData.product_name && (
                  <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500">Selected:</span>
                    <span className="font-extrabold text-[#0A2540]">{formData.product_name}</span>
                    {formData.product_code && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono font-bold">
                        {formData.product_code}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {isOtherProduct && (
              <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase">Custom / Unlisted Product</span>
                  <button
                    type="button"
                    onClick={() => setIsOtherProduct(false)}
                    className="text-xs text-blue-700 underline font-semibold cursor-pointer"
                  >
                    Back to Product List
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter Custom Product Name & Grade"
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 focus:ring-2 focus:ring-blue-600 bg-white font-semibold"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: BATCH NUMBER & PURCHASE TRACEABILITY */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2540]">
                Section 3: Batch Number & Purchase Traceability
              </h2>
              <p className="text-xs text-slate-500">
                Batch identification is mandatory to check counter-retention samples.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-red-600 uppercase tracking-wider mb-1">
                Batch Number (Mandatory for QC Check) *
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. B-2409-12 / LOT-4581 / 2026/03"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value.toUpperCase() })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border-2 border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-400 font-mono font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Printed on drum, bucket, pail, or carton label.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pack Size
              </label>
              <input
                type="text"
                placeholder="e.g. 20 Kg, 210 Ltr, 1000 Ltr"
                value={formData.pack_size}
                onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity Affected / Purchased
              </label>
              <input
                type="text"
                placeholder="e.g. 50 Buckets / 10 Drums"
                value={formData.quantity_purchased}
                onChange={(e) => setFormData({ ...formData, quantity_purchased: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice / Delivery Note Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9041"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Purchase / Invoice Date
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: NATURE OF COMPLAINT & DESCRIPTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm">
              4
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2540]">
                Section 4: Nature of Complaint & Technical Description
              </h2>
              <p className="text-xs text-slate-500">
                Categorize the defect observed and describe the issue in detail.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Complaint Classification *
              </label>
              <select
                value={formData.complaint_type}
                onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-bold text-slate-800 bg-white"
              >
                {complaintTypesList.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Priority
              </label>
              <select
                value={formData.customer_priority}
                onChange={(e) => setFormData({ ...formData, customer_priority: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-bold text-slate-800 bg-white"
              >
                <option value="Normal">Normal (Standard 7-Day SLA)</option>
                <option value="Urgent">Urgent (Line Stoppage / Critical)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Problem Description (Minimum 15 characters) *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide specific details: e.g., product consistency, separation observed on site, batch application conditions, temperature, substrates used, leakage location, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: SUPPORTING EVIDENCE & ATTACHMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-sm">
              5
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A2540]">
                Section 5: Supporting Photos & Documents
              </h2>
              <p className="text-xs text-slate-500">
                Upload photos of batch label, defect on site, or test reports.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">
              Click or drag photos/documents here
            </div>
            <p className="text-xs text-slate-500 mt-1">
              JPEG, PNG, PDF up to 10MB each
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
              accept="image/*,.pdf"
            />
            <label
              htmlFor="file-upload-input"
              className="mt-3 inline-block px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Selected Files ({files.length}):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="truncate font-medium text-slate-700 max-w-[200px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SUBMISSION BUTTON */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <div>By submitting, this ticket will be forwarded to <strong>Rajesh Poojari (QC Manager)</strong>.</div>
            <div className="text-amber-700 font-semibold mt-0.5">48-Hour Response SLA validation will initiate immediately.</div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#FF6900] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" /> Submitting to Rajesh Poojari...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Submit Complaint to Rajesh Poojari
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ComplaintRegistrationPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-slate-500">Loading portal...</div>}>
      <ComplaintRegistrationForm isSalesPortal={false} />
    </React.Suspense>
  );
}
