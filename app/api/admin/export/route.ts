export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { formatWAT } from "@/lib/timer/resolution";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const { data: complaints, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = complaints || [];

    if (format === "csv") {
      const headers = [
        "Complaint ID",
        "Customer Name",
        "Company",
        "Phone",
        "Email",
        "Customer Type",
        "Raised By",
        "Product Name",
        "Category",
        "Batch Number",
        "Invoice Number",
        "Complaint Type",
        "Status",
        "Customer Priority",
        "Admin Priority",
        "Assigned Department",
        "Assigned To",
        "Open Time (WAT)",
        "Resolution Time (WAT)",
        "Total Resolution Duration",
        "Total Minutes",
        "Root Cause",
        "Corrective Action",
        "Preventive Action",
        "Resolution Details",
        "Description"
      ];

      const csvRows = [headers.join(",")];

      for (const c of rows) {
        const row = [
          `"${c.complaint_number}"`,
          `"${(c.customer_name || "").replace(/"/g, '""')}"`,
          `"${(c.customer_company || "").replace(/"/g, '""')}"`,
          `"${c.customer_phone || ""}"`,
          `"${c.customer_email || ""}"`,
          `"${c.customer_type || ""}"`,
          `"${c.raised_by_role || ""}"`,
          `"${(c.product_name || "").replace(/"/g, '""')}"`,
          `"${c.product_category || ""}"`,
          `"${c.batch_number || ""}"`,
          `"${c.invoice_number || ""}"`,
          `"${c.complaint_type || ""}"`,
          `"${c.status || ""}"`,
          `"${c.customer_priority || ""}"`,
          `"${c.admin_priority || ""}"`,
          `"${c.assigned_department || ""}"`,
          `"${c.assigned_to || ""}"`,
          `"${formatWAT(c.complaint_open_time)}"`,
          `"${c.resolved_at ? formatWAT(c.resolved_at) : "-"}"`,
          `"${c.resolution_time_formatted || "-"}"`,
          `"${c.total_resolution_minutes || 0}"`,
          `"${(c.root_cause || "").replace(/"/g, '""')}"`,
          `"${(c.corrective_action || "").replace(/"/g, '""')}"`,
          `"${(c.preventive_action || "").replace(/"/g, '""')}"`,
          `"${(c.resolution_details || "").replace(/"/g, '""')}"`,
          `"${(c.description || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\r\n");
      const filename = `purechem-complaints-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Purechem Manufacturing Nigeria Ltd";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Complaints Register", {
        views: [{ state: "frozen", ySplit: 1 }]
      });

      worksheet.columns = [
        { header: "Complaint ID", key: "complaint_number", width: 22 },
        { header: "Customer Name", key: "customer_name", width: 25 },
        { header: "Company", key: "customer_company", width: 25 },
        { header: "Phone", key: "customer_phone", width: 16 },
        { header: "Email", key: "customer_email", width: 26 },
        { header: "Customer Type", key: "customer_type", width: 14 },
        { header: "Product Name", key: "product_name", width: 24 },
        { header: "Category", key: "product_category", width: 16 },
        { header: "Batch Number", key: "batch_number", width: 16 },
        { header: "Complaint Type", key: "complaint_type", width: 24 },
        { header: "Status", key: "status", width: 14 },
        { header: "Priority", key: "admin_priority", width: 12 },
        { header: "Assigned Dept", key: "assigned_department", width: 18 },
        { header: "Assigned Staff", key: "assigned_to", width: 20 },
        { header: "Registered (WAT)", key: "open_wat", width: 20 },
        { header: "Resolved (WAT)", key: "resolved_wat", width: 20 },
        { header: "Duration", key: "duration", width: 16 },
        { header: "Root Cause", key: "root_cause", width: 30 },
        { header: "Corrective Action", key: "corrective_action", width: 30 },
        { header: "Description", key: "description", width: 40 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A2540" }
      };

      for (const c of rows) {
        worksheet.addRow({
          complaint_number: c.complaint_number,
          customer_name: c.customer_name,
          customer_company: c.customer_company || "—",
          customer_phone: c.customer_phone,
          customer_email: c.customer_email,
          customer_type: c.customer_type || "Customer",
          product_name: c.product_name,
          product_category: c.product_category,
          batch_number: c.batch_number || "—",
          complaint_type: c.complaint_type,
          status: c.status,
          admin_priority: c.admin_priority || "Medium",
          assigned_department: c.assigned_department || "—",
          assigned_to: c.assigned_to || "—",
          open_wat: formatWAT(c.complaint_open_time),
          resolved_wat: c.resolved_at ? formatWAT(c.resolved_at) : "—",
          duration: c.resolution_time_formatted || "—",
          root_cause: c.root_cause || "—",
          corrective_action: c.corrective_action || "—",
          description: c.description,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `purechem-complaints-${new Date().toISOString().slice(0, 10)}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported export format" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
