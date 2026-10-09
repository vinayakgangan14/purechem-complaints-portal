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
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Adhesives",
  "Construction Chemicals",
  "Paint Chemicals",
  "Resin",
  "Polyester Resin",
  "Polyurethane",
  "Water-Based Adhesives",
  "Solvent-Based Adhesives",
  "PVC Adhesives",
  "Industrial Glue",
  "Electrical Wires & Cables",
  "Other Purechem Products"
];

const DEFAULT_PRODUCTS = [
  { id: 1, product_code: "PCM-ADH-001", product_name: "TOP BOND White Glue", category_name: "Water-Based Adhesives", pack_size: "500g, 1kg, 4kg, 20kg" },
  { id: 2, product_code: "PCM-PVC-001", product_name: "TOPGIT", category_name: "PVC Adhesives", pack_size: "50g, 100g, 250g, 500g" },
  { id: 3, product_code: "PCM-GUM-001", product_name: "TOPGUM & Craft Glue", category_name: "Adhesives", pack_size: "120ml Bottle, 250ml Jar" },
  { id: 4, product_code: "PCM-IND-001", product_name: "812M/GS1100 Beer Bottel labelling adhesive", category_name: "Industrial Glue", pack_size: "25kg Drum, 200kg Drum" },
  { id: 5, product_code: "PCM-CON-001", product_name: "Construction Chemicals & Grinding Aids", category_name: "Construction Chemicals", pack_size: "25kg Bag, 200L Drum, Bulk" },
  { id: 6, product_code: "PCM-CON-002", product_name: "Tile Adhesive & Grout", category_name: "Construction Chemicals", pack_size: "20kg Bag, 25kg Bag" },
  { id: 7, product_code: "PCM-CON-003", product_name: "Waterproofing Solutions", category_name: "Construction Chemicals", pack_size: "20L Pail, 25kg Slurry Pack" },
  { id: 8, product_code: "PCM-CAB-001", product_name: "Wires and Cables", category_name: "Electrical Wires & Cables", pack_size: "100m Coils, Wooden Drums" },
  { id: 9, product_code: "PCM-PUR-001", product_name: "Solvent Base Adhesive PU", category_name: "Polyurethane", pack_size: "15L Can, 200L Drum" },
  { id: 10, product_code: "PCM-PUR-002", product_name: "Solvent Free Adhesive PU", category_name: "Polyurethane", pack_size: "25kg Pail, 200kg Drum" },
  { id: 11, product_code: "PCM-PUR-003", product_name: "Inkbinder PU", category_name: "Polyurethane", pack_size: "200kg Drum" },
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
  "Other"
];

function ComplaintFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamic products & categories with guaranteed fallback defaults
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [productsList, setProductsList] = useState<any[]>(DEFAULT_PRODUCTS);
  const [complaintTypesList, setComplaintTypesList] = useState<string[]>(DEFAULT_COMPLAINT_TYPES);

  // Other product custom fields
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductDescription, setCustomProductDescription] = useState("");

  // Role toggle: Customer vs Sales Representative
  const [isRaisedBySales, setIsRaisedBySales] = useState(false);
  const [salesRepName, setSalesRepName] = useState("Femi Adeyemi (Lagos Mainland)");

  // Form State
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_company: "",
    customer_email: "",
    customer_phone: "+234",
    customer_type: "Customer",
    product_category: "Water-Based Adhesives",
    product_name: "TOP BOND White Glue",
    product_code: "PCM-ADH-001",
    batch_number: "",
    manufacturing_date: "",
    expiry_date: "",
    pack_size: "500g, 1kg, 4kg, 20kg",
    quantity_purchased: "",
    invoice_number: "",
    purchase_date: "",
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
    loadSession();
  }, []);

  // Pre-fill from URL if scanned from QR code (Section 39)
  useEffect(() => {
    const urlProdCode = searchParams.get("product_code");
    const urlBatch = searchParams.get("batch");
    if (urlProdCode || urlBatch) {
      setFormData((prev) => ({
        ...prev,
        product_code: urlProdCode || prev.product_code,
        batch_number: urlBatch || prev.batch_number,
      }));
    }
  }, [searchParams, productsList]);

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        if (data.categories?.length) {
          setCategories(data.categories.map((c: any) => c.name));
        }
        if (data.products?.length) {
          setProductsList(data.products);
          // If product code was passed in URL, set matching product
          const urlCode = searchParams.get("product_code");
          if (urlCode) {
            const matched = data.products.find((p: any) => p.product_code === urlCode);
            if (matched) {
              setFormData((prev) => ({
                ...prev,
                product_name: matched.product_name,
                product_category: matched.category_name,
                product_code: matched.product_code,
                pack_size: matched.pack_size || prev.pack_size,
              }));
            }
          }
        }
        if (data.complaintTypes?.length) {
          setComplaintTypesList(data.complaintTypes.map((t: any) => t.name));
        }
      }
    } catch (e) {
      console.error("Failed to load metadata", e);
    }
  };

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user && data.user.id !== "USR-GUEST") {
        setFormData((prev) => ({
          ...prev,
          customer_name: prev.customer_name || data.user.name || "",
          customer_company: prev.customer_company || data.user.company || "",
          customer_email: prev.customer_email || data.user.email || "",
          customer_phone: prev.customer_phone === "+234" ? data.user.phone || "+234" : prev.customer_phone,
          customer_type: data.user.customer_type || prev.customer_type,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (prodName: string) => {
    if (prodName === "Other Purechem Product" || prodName === "Other") {
      setIsOtherProduct(true);
      setFormData((prev) => ({
        ...prev,
        product_name: "Other Purechem Product",
        product_code: "PCM-OTHER",
      }));
      return;
    }

    setIsOtherProduct(false);
    const matched = productsList.find((p) => p.product_name === prodName);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        product_name: matched.product_name,
        product_category: matched.category_name,
        product_code: matched.product_code,
        pack_size: matched.pack_size || prev.pack_size,
      }));
    } else {
      setFormData((prev) => ({ ...prev, product_name: prodName }));
    }
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

    if (!formData.customer_name.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!formData.customer_email.trim() || !formData.customer_email.includes("@")) {
      setErrorMessage("Please enter a valid Email Address.");
      return;
    }
    if (!formData.customer_phone.trim() || formData.customer_phone.length < 8) {
      setErrorMessage("Please enter a valid Phone Number (+234 format).");
      return;
    }

    if (isOtherProduct) {
      if (!customProductName.trim()) {
        setErrorMessage("Please enter the specific name of your Purechem product.");
        return;
      }
    } else if (!formData.product_name.trim()) {
      setErrorMessage("Please select or specify a Purechem Product.");
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 15) {
      setErrorMessage("Please provide a detailed description (at least 15 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalProductName = isOtherProduct ? customProductName.trim() : formData.product_name;
      const finalDescription = isOtherProduct && customProductDescription.trim()
        ? `[Custom Product Details: ${customProductDescription.trim()}]\n\n${formData.description.trim()}`
        : formData.description.trim();

      const payload = {
        ...formData,
        raised_by_role: isRaisedBySales ? "Sales" : (formData.customer_type === "Distributor" ? "Distributor" : "Customer"),
        raised_by_name: isRaisedBySales ? salesRepName : formData.customer_name,
        product_name: finalProductName,
        description: finalDescription,
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
          fileData.append("uploaded_by", formData.customer_name);
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

  // SUCCESS CONFIRMATION MODAL / SCREEN (Section 6)
  if (submittedComplaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white text-center space-y-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Complaint Successfully Registered!
            </h1>
            <p className="text-sm text-emerald-100 max-w-md mx-auto">
              Your complaint has been logged into Purechem's Quality Tracking System. Our Quality & Technical department has been alerted.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Reference Number Box */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Official Complaint Reference ID
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-purechem-navy tracking-wider">
                  {submittedComplaint.complaint_number}
                </span>
                <button
                  onClick={() => copyToClipboard(submittedComplaint.complaint_number)}
                  className="p-2 text-slate-500 hover:text-purechem-navy hover:bg-slate-200 rounded-lg transition-colors"
                  title="Copy Reference ID"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copiedId && (
                <p className="text-xs text-emerald-600 font-semibold animate-pulse">
                  ✓ Copied to clipboard!
                </p>
              )}
              <p className="text-xs text-slate-500">
                Please save this reference number. Confirmation has also been sent to{" "}
                <strong>{submittedComplaint.customer_email}</strong>.
              </p>
            </div>

            {/* Resolution Timer Announcement (Section 7) */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 text-orange-950">
              <div className="p-2 rounded-lg bg-orange-100 text-purechem-orange shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm text-orange-900">
                  Resolution Timer Started: West Africa Time (WAT)
                </div>
                <p className="text-orange-800 leading-relaxed">
                  Registered at: <strong>{new Date(submittedComplaint.complaint_open_time).toLocaleString()} WAT</strong>.
                  Purechem SLA targets resolution within <strong>{submittedComplaint.target_resolution_hours || 72} hours</strong>.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href={`/complaint/${submittedComplaint.id}`}
                className="flex-1 py-3 px-4 bg-purechem-navy hover:bg-purechem-navy-dark text-white font-bold rounded-xl text-center shadow transition-colors flex items-center justify-center gap-2 text-sm"
              >
                View Live Complaint Status & Timeline <ArrowRight className="w-4 h-4 text-purechem-orange" />
              </Link>
              <Link
                href="/portal"
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-center transition-colors text-sm"
              >
                Back to Dashboard
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
      <div className="mb-8">
        <Link href="/" className="text-xs font-semibold text-purechem-orange hover:underline mb-2 inline-block">
          ← Back to Support Home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PlusCircle className="w-7 h-7 text-purechem-orange" />
          Raise a Product Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Complete the form below to register your product issue. Purechem's Quality and Technical department will investigate immediately.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-10 rounded-2xl shadow-md border border-slate-200">
        {/* Identity Selector: Customer vs Sales Representative */}
        <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Who is registering this complaint?
          </label>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsRaisedBySales(false);
                setFormData((prev) => ({ ...prev, customer_type: "Customer" }));
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                !isRaisedBySales
                  ? "bg-purechem-navy text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              🏢 End Customer / Dealer / Distributor
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRaisedBySales(true);
                setFormData((prev) => ({ ...prev, customer_type: "Sales" }));
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isRaisedBySales
                  ? "bg-purechem-orange text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
              }`}
            >
              👔 Purechem Sales Representative (On Behalf of Client)
            </button>
          </div>

          {isRaisedBySales && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-orange-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Logging Sales Representative *
                </label>
                <select
                  value={salesRepName}
                  onChange={(e) => setSalesRepName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-orange-300 text-xs font-semibold bg-white"
                >
                  <option value="Femi Adeyemi (Lagos Mainland)">Femi Adeyemi (Lagos Mainland)</option>
                  <option value="Ibrahim Bello (Kano/North)">Ibrahim Bello (Kano/North)</option>
                  <option value="Nnamdi Okeke (Onitsha/East)">Nnamdi Okeke (Onitsha/East)</option>
                  <option value="Blessing Oladipo (Ibadan/West)">Blessing Oladipo (Ibadan/West)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Quick Customer Select (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "Alhaji Danladi Musa", company: "Kabor Furniture Works Kano", email: "danladi@kaborfurniture.ng", phone: "+2348035544332", type: "Distributor" },
                    { name: "Chief Emeka Eze", company: "Eze & Sons Construction Onitsha", email: "eze@ezebuilders.com", phone: "+2348067788990", type: "Dealer" },
                    { name: "Mr. Adebayo Ogunleye", company: "Ikeja Woodworking Hub Lagos", email: "adebayo@ikejawood.com", phone: "+2348023456789", type: "Customer" },
                  ].map((cust, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          customer_name: cust.name,
                          customer_company: cust.company,
                          customer_email: cust.email,
                          customer_phone: cust.phone,
                          customer_type: cust.type,
                        }))
                      }
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700"
                    >
                      + {cust.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 1: Customer Information (Section 2, 3) */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-purechem-orange" />
            1. Customer & Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adebayo Ogunleye"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ikeja Woodworking Hub Ltd"
                value={formData.customer_company}
                onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. contact@business.ng"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
              <span className="text-[11px] text-slate-500">Status update emails will be sent here.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nigerian Phone Number (+234) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +2348023456789 or 08023456789"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Type
              </label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              >
                <option value="Customer">End Customer / User / Fabricator</option>
                <option value="Distributor">Authorized Distributor</option>
                <option value="Dealer">Retail Dealer / Store</option>
                <option value="Sales">Sales Representative</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 2: Product Information (Section 4) */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-purechem-orange" />
            2. Purechem Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.product_category}
                onChange={(e) => {
                  setFormData({ ...formData, product_category: e.target.value });
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={isOtherProduct ? "Other Purechem Product" : formData.product_name}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              >
                {productsList.map((p) => (
                  <option key={p.id || p.product_code} value={p.product_name}>
                    {p.product_name} ({p.pack_size || p.product_code})
                  </option>
                ))}
                <option value="Other Purechem Product">Other Purechem Product (Specify below)</option>
              </select>
            </div>
          </div>

          {/* Conditional Manual Description / Specification for Other Product */}
          {isOtherProduct && (
            <div className="mt-4 p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Info className="w-4 h-4 text-purechem-orange" />
                Specify Custom / Other Purechem Product Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Specific Product Name / Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purechem Special Adhesive / Formulation X"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-purechem-orange bg-white"
                  />
                  <span className="text-[11px] text-slate-500">Enter name as stated on label or container</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Product Specification / Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 200L Drum, solvent based, purchased from Lagos dealer"
                    value={customProductDescription}
                    onChange={(e) => setCustomProductDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-purechem-orange bg-white"
                  />
                  <span className="text-[11px] text-slate-500">Provide any additional product notes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Batch Information (Section 4) */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purechem-orange" />
              3. Batch & Purchase Information
            </h3>
            <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              Optional if unavailable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                placeholder="e.g. B260901"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
              <span className="text-[10px] text-slate-500">Printed on drum/can label</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pack Size / Format
              </label>
              <input
                type="text"
                placeholder="e.g. 500g Can / 20kg Drum"
                value={formData.pack_size}
                onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Purchased / Affected
              </label>
              <input
                type="text"
                placeholder="e.g. 24 Cans or 5 Drums"
                value={formData.quantity_purchased}
                onChange={(e) => setFormData({ ...formData, quantity_purchased: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice / Receipt Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-LAG-88912"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange bg-white"
              />
            </div>
          </div>
        </div>

        {/* STEP 4: Complaint Type, Priority & Description (Section 4) */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purechem-orange" />
            4. Complaint Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaint Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.complaint_type}
                onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              >
                {complaintTypesList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaint Priority (Customer Assessment)
              </label>
              <select
                value={formData.customer_priority}
                onChange={(e) => setFormData({ ...formData, customer_priority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
              >
                <option value="Normal">Normal (Target: 72 Hours resolution)</option>
                <option value="Urgent">Urgent (Production line stopped / 48h resolution)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Please describe your complaint in detail <span className="text-rose-500">*</span>
            </label>
            <div className="text-[11px] text-slate-500 mb-2">
              Help us resolve faster by stating: What happened? When did problem occur? Where was it applied? Application temperature or substrate conditions?
            </div>
            <textarea
              required
              rows={5}
              placeholder="e.g. We opened the 500g cans for jointing 4-inch PVC drain pipes in Ikeja GRA. The viscosity was unusually thick and stringy, preventing uniform coating on the PVC pipe sockets..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purechem-orange focus:border-purechem-orange"
            />
          </div>
        </div>

        {/* STEP 5: Supporting Photos & Documents (Section 5) */}
        <div>
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purechem-orange" />
            5. Photo / Document Evidence Upload
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Attach batch label photo, product defect photo, application photo, or purchase invoice. (Supports JPG, PNG, PDF, DOCX, XLSX up to 25MB each).
          </p>

          <div className="border-2 border-dashed border-slate-300 hover:border-purechem-orange rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 relative">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Click to browse or drag and drop photos/documents
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Photographs of batch numbers and packaging help our QA lab fast-track testing
            </p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-700">Attached Evidence Files:</div>
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs border border-slate-200"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-purechem-orange shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            By submitting, you initiate Purechem's ISO 9001 quality review workflow. Server timestamp will be registered in West Africa Time (WAT).
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-purechem-orange hover:bg-purechem-orange-dark text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            {isSubmitting ? (
              <>Submitting & Starting Timer...</>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                SUBMIT COMPLAINT
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <React.Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-slate-500 text-sm">Loading complaint registration form...</div>}>
      <ComplaintFormContent />
    </React.Suspense>
  );
}
