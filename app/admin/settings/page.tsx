"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Mail,
  Clock,
  Package,
  Layers,
  ShieldCheck,
  Check,
  AlertCircle,
  PlusCircle,
  Eye,
  Send,
  Building,
} from "lucide-react";
import { formatWAT } from "@/lib/timer/resolution";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "emails" | "products" | "sla" | "outbox">("general");
  const [settings, setSettings] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Product Modal/Form State
  const [newProdCode, setNewProdCode] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Adhesives");
  const [newProdPack, setNewProdPack] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");

  // New Category State
  const [newCatName, setNewCatName] = useState("");

  // Email Preview Modal
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings || {});
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setComplaintTypes(data.complaintTypes || []);
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", payload: settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdCode || !newProdName) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_product",
          payload: {
            product_code: newProdCode,
            product_name: newProdName,
            category_name: newProdCategory,
            pack_size: newProdPack,
            description: newProdDesc,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewProdCode("");
        setNewProdName("");
        setNewProdPack("");
        setNewProdDesc("");
        loadSettingsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_category",
          payload: { name: newCatName },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName("");
        loadSettingsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purechem-orange uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" /> Administration & Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Master Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure notification email routes, SLA response thresholds, products catalog, and inspect email outbox logs.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Settings successfully updated and applied!
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        {[
          { id: "general", label: "General & Branding", icon: Building },
          { id: "emails", label: "Configurable Email Routing (Sec. 16)", icon: Mail },
          { id: "sla", label: "SLA Targets & Timezone (Sec. 19, 20)", icon: Clock },
          { id: "products", label: "Product Master & Categories", icon: Package },
          { id: "outbox", label: `Notifications Outbox (${notifications.length})`, icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-purechem-navy text-white shadow"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purechem-orange" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Company Information & Lagos Office</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.company_name || ""}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Helpline Phone Numbers</label>
              <input
                type="text"
                value={settings.phone_hotline || ""}
                onChange={(e) => setSettings({ ...settings, phone_hotline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Factory & Corporate Address</label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-purechem-navy text-white rounded-xl text-xs font-bold shadow">
            Save Company Details
          </button>
        </form>
      )}

      {/* TAB 2: EMAIL ROUTING (SECTION 16) */}
      {activeTab === "emails" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-slate-900">Configurable Notification Emails (Section 16)</h2>
            <p className="text-xs text-slate-500">
              Emails are not hard-coded. Define custom target inboxes for complaint dispatches across Purechem divisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Complaint Email *</label>
              <input
                type="email"
                required
                value={settings.primary_complaint_email || ""}
                onChange={(e) => setSettings({ ...settings, primary_complaint_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compliance / Audit CC Email</label>
              <input
                type="email"
                value={settings.cc_complaint_email || ""}
                onChange={(e) => setSettings({ ...settings, cc_complaint_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quality Department Email</label>
              <input
                type="email"
                value={settings.quality_dept_email || ""}
                onChange={(e) => setSettings({ ...settings, quality_dept_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Department Email</label>
              <input
                type="email"
                value={settings.sales_dept_email || ""}
                onChange={(e) => setSettings({ ...settings, sales_dept_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Executive Management Email</label>
              <input
                type="email"
                value={settings.management_email || ""}
                onChange={(e) => setSettings({ ...settings, management_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 bg-purechem-navy text-white rounded-xl text-xs font-bold shadow">
            Save Email Routing Configuration
          </button>
        </form>
      )}

      {/* TAB 3: SLA & TIMEZONE (SECTIONS 19 & 20) */}
      {activeTab === "sla" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-sm font-bold text-slate-900">SLA Resolution Target Times & Timezone</h2>
            <p className="text-xs text-slate-500">
              When complaint time exceeds target hours, status dynamically highlights OVERDUE in red.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Normal Priority SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours_normal || "72"}
                onChange={(e) => setSettings({ ...settings, sla_hours_normal: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Default: 72 Hours (3 Calendar Days)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Urgent / High Priority SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours_urgent || "48"}
                onChange={(e) => setSettings({ ...settings, sla_hours_urgent: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Default: 48 Hours (2 Calendar Days)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Critical SLA (Hours)</label>
              <input
                type="number"
                value={settings.sla_hours_critical || "24"}
                onChange={(e) => setSettings({ ...settings, sla_hours_critical: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
              <span className="text-[10px] text-slate-400">Default: 24 Hours (Emergency Line Stoppage)</span>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Operational Timezone</label>
              <input
                type="text"
                disabled
                value={settings.timezone || "Africa/Lagos (WAT / UTC+1)"}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-mono"
              />
              <span className="text-[10px] text-slate-400">Timestamps stored in UTC, formatted in West Africa Time</span>
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 bg-purechem-navy text-white rounded-xl text-xs font-bold shadow">
            Save SLA Thresholds
          </button>
        </form>
      )}

      {/* TAB 4: PRODUCT MASTER & CATEGORIES (SECTIONS 4 & 33) */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Add Product Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-purechem-orange" />
              Add Product to Master Database
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCM-ADH-005"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TOP BOND Rapid Wood Glue 1kg"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pack Size</label>
                <input
                  type="text"
                  placeholder="e.g. 1kg Jar / 20kg Bucket"
                  value={newProdPack}
                  onChange={(e) => setNewProdPack(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Application Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fast setting water-resistant carpentry adhesive"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-purechem-navy hover:bg-purechem-navy-dark text-white rounded-xl font-bold"
                >
                  + Add Product to Master
                </button>
              </div>
            </form>
          </div>

          {/* Current Products Master Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Active Products Register ({products.length} Products)
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Pack Size</th>
                    <th className="py-2.5 px-3">Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-purechem-navy">{p.product_code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.product_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.pack_size || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{p.application || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS OUTBOX INSPECTOR (SECTIONS 15 & 34) */}
      {activeTab === "outbox" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Email Notifications Outbox Log</h2>
                <p className="text-xs text-slate-500">
                  Every automated email generated by the system is archived here for audit and inspection.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Sent Time (WAT)</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Inspect Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{formatWAT(n.sent_at)}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{n.recipient_name}</div>
                        <div className="text-[11px] text-slate-400">{n.recipient_email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {n.notification_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{n.subject}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {n.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedEmail(n)}
                          className="px-2.5 py-1 bg-purechem-navy text-white rounded font-bold text-[11px] hover:bg-purechem-navy-dark transition-colors"
                        >
                          View HTML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Preview Modal */}
          {selectedEmail && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">{selectedEmail.subject}</h3>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5 bg-slate-50 p-3 rounded-lg">
                  <div>To: <strong>{selectedEmail.recipient_email}</strong> ({selectedEmail.recipient_name})</div>
                  <div>Sent: {formatWAT(selectedEmail.sent_at)}</div>
                </div>
                <div
                  className="border border-slate-200 rounded-xl p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
