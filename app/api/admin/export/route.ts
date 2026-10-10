export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { formatWAT } from "@/lib/timer/resolution";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const complaints = db.prepare(`
      SELECT * FROM complaints ORDER BY created_at DESC
    `).all() as any[];

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

      for (const c of complaints) {
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
          `"${formatWAT(c.resolved_at)}"`,
          `"${c.resolution_time_formatted || ""}"`,
          c.total_resolution_minutes || "",
          `"${(c.root_cause || "").replace(/"/g, '""')}"`,
          `"${(c.corrective_action || "").replace(/"/g, '""')}"`,
          `"${(c.preventive_action || "").replace(/"/g, '""')}"`,
          `"${(c.resolution_details || "").replace(/"/g, '""')}"`,
          `"${(c.description || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Purechem_Complaints_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (format === "excel" || format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Purechem Manufacturing Nigeria Ltd";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Complaints Register");

      worksheet.columns = [
        { header: "Complaint ID", key: "id", width: 22 },
        { header: "Customer Name", key: "customer", width: 24 },
        { header: "Company", key: "company", width: 26 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Email", key: "email", width: 26 },
        { header: "Product", key: "product", width: 28 },
        { header: "Category", key: "category", width: 20 },
        { header: "Batch Number", key: "batch", width: 15 },
        { header: "Complaint Type", key: "type", width: 20 },
        { header: "Status", key: "status", width: 18 },
        { header: "Priority", key: "priority", width: 12 },
        { header: "Department", key: "dept", width: 16 },
        { header: "Assigned To", key: "assigned", width: 20 },
        { header: "Registered (WAT)", key: "open_time", width: 22 },
        { header: "Resolved (WAT)", key: "resolved_time", width: 22 },
        { header: "Resolution Time", key: "duration", width: 24 },
        { header: "Root Cause", key: "rca", width: 30 },
        { header: "Corrective Action", key: "capa", width: 30 },
        { header: "Resolution Details", key: "resolution", width: 30 },
      ];

      // Styling header row with Purechem Navy
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A2540" },
      };

      for (const c of complaints) {
        worksheet.addRow({
          id: c.complaint_number,
          customer: c.customer_name,
          company: c.customer_company || "N/A",
          phone: c.customer_phone,
          email: c.customer_email,
          product: c.product_name,
          category: c.product_category,
          batch: c.batch_number || "N/A",
          type: c.complaint_type,
          status: c.status,
          priority: c.admin_priority || c.customer_priority,
          dept: c.assigned_department || "Unassigned",
          assigned: c.assigned_to || "Unassigned",
          open_time: formatWAT(c.complaint_open_time),
          resolved_time: formatWAT(c.resolved_at),
          duration: c.resolution_time_formatted || "In Progress",
          rca: c.root_cause || "—",
          capa: c.corrective_action || "—",
          resolution: c.resolution_details || "—",
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Purechem_Complaints_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported format" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
