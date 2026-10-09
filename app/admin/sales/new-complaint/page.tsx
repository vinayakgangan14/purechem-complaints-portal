"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PhoneForwarded,
  PlusCircle,
  Building,
  User,
  Package,
  Calendar,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
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

export default function SalesRaiseComplaintPage() {
  const router = useRouter();
  const [salesReps, setSalesReps] = useState([
    "Femi Adeyemi (Lagos Mainland)",
    "Ibrahim Bello (Kano/North)",
    "Nnamdi Okeke (Onitsha/East)",
    "Blessing Oladipo (Ibadan/West)",
  ]);
  const [selectedSalesRep, setSelectedSalesRep] = useState("Femi Adeyemi (Lagos Mainland)");

  // Pre-configured Customers list for quick selection
  const sampleCustomers = [
    { name: "Alhaji Danladi Musa", company: "Kabor Furniture Works Kano", email: "danladi@kaborfurniture.ng", phone: "+2348035544332", type: "Distributor" },
    { name: "Chief Emeka Eze", company: "Eze & Sons Construction Onitsha", email: "eze@ezebuilders.com", phone: "+2348067788990", type: "Dealer" },
    { name: "Mr. Adebayo Ogunleye", company: "Ikeja Woodworking Hub Lagos", email: "adebayo@ikejawood.com", phone: "+2348023456789", type: "Customer" },
  ];

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
    pack_size: "500g, 1kg, 4kg, 20kg",
    quantity_purchased: "",
    invoice_number: "",
    complaint_type: "Product Quality",
    customer_priority: "Normal",
    description: "",
  });

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [productsList, setProductsList] = useState<any[]>(DEFAULT_PRODUCTS);
  const [typesList, setTypesList] = useState<string[]>(DEFAULT_COMPLAINT_TYPES);

  // Other product custom fields
  const [isOtherProduct, setIsOtherProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");
  const [customProductDescription, setCustomProductDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdResult, setCreatedResult] = useState<any>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        if (data.categories?.length) setCategories(data.categories.map((c: any) => c.name));
        if (data.products?.length) setProductsList(data.products);
        if (data.complaintTypes?.length) setTypesList(data.complaintTypes.map((t: any) => t.name));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPredefinedCustomer = (cust: any) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: cust.name,
      customer_company: cust.company,
      customer_email: cust.email,
      customer_phone: cust.phone,
      customer_type: cust.type,
    }));
  };

  const handleProductSelect = (name: string) => {
    if (name === "Other Purechem Product" || name === "Other") {
      setIsOtherProduct(true);
      setFormData((prev) => ({
        ...prev,
        product_name: "Other Purechem Product",
        product_code: "PCM-OTHER",
      }));
      return;
    }

    setIsOtherProduct(false);
    const matched = productsList.find((p) => p.product_name === name);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        product_name: matched.product_name,
        product_category: matched.category_name,
        product_code: matched.product_code,
        pack_size: matched.pack_size || prev.pack_size,
      }));
    } else {
      setFormData((prev) => ({ ...prev, product_name: name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.description) {
      setErrorMessage("Please complete all required customer and complaint fields.");
      return;
    }

    if (isOtherProduct && !customProductName.trim()) {
      setErrorMessage("Please enter the specific name of the Purechem Product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalProductName = isOtherProduct ? customProductName.trim() : formData.product_name;
      const finalDescription = isOtherProduct && customProductDescription.trim()
        ? `[Custom Product Details: ${customProductDescription.trim()}]\n\n${formData.description.trim()}`
        : formData.description.trim();

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          product_name: finalProductName,
          description: finalDescription,
          raised_by_role: "Sales",
          raised_by_name: selectedSalesRep,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCreatedResult(data.complaint);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdResult) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Complaint Raised by Sales</h2>
          <p className="text-xs text-slate-500">
            Registered on behalf of <strong>{createdResult.customer_name}</strong> by {selectedSalesRep}.
          </p>

          <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
            <div className="text-xs font-bold text-slate-500 uppercase">Complaint Reference ID</div>
            <div className="text-2xl font-mono font-black text-purechem-navy mt-1">
              {createdResult.complaint_number}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Server Timer Started in WAT • Target SLA: {createdResult.target_resolution_hours} Hours
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Link
              href={`/admin/complaints/${createdResult.id}`}
              className="px-6 py-2.5 bg-purechem-navy text-white text-xs font-bold rounded-xl shadow"
            >
              Open in Investigation Desk →
            </Link>
            <button
              onClick={() => {
                setCreatedResult(null);
                setFormData((prev) => ({ ...prev, description: "", batch_number: "" }));
              }}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Raise Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
          <PhoneForwarded className="w-4 h-4" /> Commercial Sales Function (Section 25)
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Raise Complaint on Behalf of Customer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          For field sales representatives handling phone, WhatsApp, or in-person distributor complaints.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        {/* Sales Officer Identity */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
          <label className="block text-xs font-bold text-emerald-950 mb-1">
            Logging Sales Representative:
          </label>
          <select
            value={selectedSalesRep}
            onChange={(e) => setSelectedSalesRep(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-900 bg-white"
          >
            {salesReps.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>
          <span className="block text-[11px] text-emerald-800 mt-1">
            This ticket will permanently record `Raised By: Sales ({selectedSalesRep})` in the audit log.
          </span>
        </div>

        {/* Quick Customer Selection */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Customer Fill (Existing Distributors/Clients):
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleCustomers.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPredefinedCustomer(c)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                + {c.name} ({c.company})
              </button>
            ))}
          </div>
        </div>

        {/* Customer Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Contact Name *</label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Store Name</label>
            <input
              type="text"
              value={formData.customer_company}
              onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email *</label>
            <input
              type="email"
              required
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Phone (+234) *</label>
            <input
              type="tel"
              required
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
            <select
              value={isOtherProduct ? "Other Purechem Product" : formData.product_name}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            >
              {productsList.map((p) => (
                <option key={p.id || p.product_code} value={p.product_name}>
                  {p.product_name} ({p.pack_size || p.product_code})
                </option>
              ))}
              <option value="Other Purechem Product">Other Purechem Product (Specify below)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number (From Label)</label>
            <input
              type="text"
              placeholder="e.g. B260901"
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
            />
          </div>

          {/* Conditional Manual Description / Specification for Other Product */}
          {isOtherProduct && (
            <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Specify Custom / Other Purechem Product
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Product Name / Brand <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purechem Special PU Grade 200"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Product Details / Specifications
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Batch supplied from Isolo factory"
                    value={customProductDescription}
                    onChange={(e) => setCustomProductDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-amber-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Complaint Type *</label>
            <select
              value={formData.complaint_type}
              onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            >
              {typesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Priority</label>
            <select
              value={formData.customer_priority}
              onChange={(e) => setFormData({ ...formData, customer_priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            >
              <option value="Normal">Normal (72h SLA)</option>
              <option value="Urgent">Urgent (48h SLA)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complaint Description (Customer's Verbal / Written Report) *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Customer reported that upon opening 6 cans on site, adhesive had turned into a gelatinous lump..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow transition-colors text-sm flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            {isSubmitting ? "Submitting on Behalf of Customer..." : "Register Complaint For Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
