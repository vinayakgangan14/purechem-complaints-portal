export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateDuration, isComplaintOverdue, SLA_TARGETS } from "@/lib/timer/resolution";
import { sendNotificationEmail } from "@/lib/email/dispatcher";
import { isSupabaseConfigured, syncComplaintToSupabase, syncTimelineToSupabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;
    const role = req.cookies.get("pcm_role")?.value || "customer";

    // Find complaint by id OR complaint_number
    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ? OR complaint_number = ?
    `).get(id, id) as any;

    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Live or final timer calculations
    const isResolvedOrClosed = complaint.status === "RESOLVED" || complaint.status === "CLOSED";
    const duration = isResolvedOrClosed
      ? calculateDuration(complaint.complaint_open_time, complaint.resolved_at || complaint.closed_at || complaint.updated_at)
      : calculateDuration(complaint.complaint_open_time, new Date());

    const overdue = isComplaintOverdue(
      complaint.complaint_open_time,
      complaint.target_resolution_hours || 72,
      complaint.status,
      complaint.resolved_at
    );

    // Section 14: Strict separation of internal notes vs customer communication
    const isStaffRequest =
      req.nextUrl.searchParams.get("include_internal") === "true" ||
      req.headers.get("referer")?.includes("/admin") ||
      (role && role !== "customer");

    let timelineQuery = "SELECT * FROM complaint_timeline WHERE complaint_id = ?";
    if (!isStaffRequest) {
      timelineQuery += " AND is_internal_only = 0";
    }
    timelineQuery += " ORDER BY created_at ASC";
    const timeline = db.prepare(timelineQuery).all(complaint.id);

    // Factory QC Batch Report (if batch_number is present)
    let qcReport: any = null;
    if (complaint.batch_number && complaint.batch_number.trim()) {
      qcReport = db.prepare(
        "SELECT * FROM qc_batch_reports WHERE batch_number = ? OR batch_number LIKE ?"
      ).get(complaint.batch_number.trim(), `%${complaint.batch_number.trim()}%`);
    }

    // Attachments
    const attachments = db.prepare("SELECT * FROM attachments WHERE complaint_id = ? ORDER BY created_at DESC").all(complaint.id);

    // Feedback
    const feedback = db.prepare("SELECT * FROM feedback WHERE complaint_id = ?").get(complaint.id);

    return NextResponse.json({
      success: true,
      complaint: {
        ...complaint,
        live_duration: duration,
        is_overdue: overdue ? 1 : 0,
      },
      timeline,
      qc_report: qcReport,
      attachments,
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;
    const body = await req.json();

    const existing = db.prepare("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?").get(id, id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const {
      status,
      assigned_to,
      assigned_department,
      admin_priority,
      resolution_details,
      root_cause,
      corrective_action,
      preventive_action,
      comment,
      performed_by,
      performed_by_role,
    } = body;

    const now = new Date().toISOString();
    let oldStatus = existing.status;
    let newStatus = status || existing.status;

    let resolvedAt = existing.resolved_at;
    let closedAt = existing.closed_at;
    let totalMinutes = existing.total_resolution_minutes;
    let totalHours = existing.total_resolution_hours;
    let formattedDuration = existing.resolution_time_formatted;

    // Handle transitions to RESOLVED (Section 8, 29)
    if (newStatus === "RESOLVED" && oldStatus !== "RESOLVED") {
      resolvedAt = now; // Strictly server timestamp
      const duration = calculateDuration(existing.complaint_open_time, resolvedAt);
      totalMinutes = duration.totalMinutes;
      totalHours = duration.totalHours;
      formattedDuration = duration.formatted;
    }

    // Handle transition to CLOSED
    if (newStatus === "CLOSED" && oldStatus !== "CLOSED") {
      closedAt = now;
      if (!resolvedAt) {
        resolvedAt = now;
        const duration = calculateDuration(existing.complaint_open_time, closedAt);
        totalMinutes = duration.totalMinutes;
        totalHours = duration.totalHours;
        formattedDuration = duration.formatted;
      }
    }

    let targetHours = existing.target_resolution_hours;
    if (admin_priority && admin_priority !== existing.admin_priority) {
      if (admin_priority === "Critical") targetHours = SLA_TARGETS.Critical;
      else if (admin_priority === "High") targetHours = SLA_TARGETS.High;
      else if (admin_priority === "Medium") targetHours = SLA_TARGETS.Medium;
      else if (admin_priority === "Low") targetHours = SLA_TARGETS.Low;
    }

    // Update Complaint Row
    db.prepare(`
      UPDATE complaints SET
        status = ?,
        assigned_to = COALESCE(?, assigned_to),
        assigned_department = COALESCE(?, assigned_department),
        admin_priority = COALESCE(?, admin_priority),
        target_resolution_hours = ?,
        resolved_at = ?,
        closed_at = ?,
        total_resolution_minutes = ?,
        total_resolution_hours = ?,
        resolution_time_formatted = ?,
        resolution_details = COALESCE(?, resolution_details),
        root_cause = COALESCE(?, root_cause),
        corrective_action = COALESCE(?, corrective_action),
        preventive_action = COALESCE(?, preventive_action),
        updated_at = ?
      WHERE id = ?
    `).run(
      newStatus,
      assigned_to !== undefined ? assigned_to : null,
      assigned_department !== undefined ? assigned_department : null,
      admin_priority !== undefined ? admin_priority : null,
      targetHours,
      resolvedAt,
      closedAt,
      totalMinutes,
      totalHours,
      formattedDuration,
      resolution_details !== undefined ? resolution_details : null,
      root_cause !== undefined ? root_cause : null,
      corrective_action !== undefined ? corrective_action : null,
      preventive_action !== undefined ? preventive_action : null,
      now,
      existing.id
    );

    // Timeline logging
    const actionLabel =
      newStatus !== oldStatus
        ? `Status Changed: ${newStatus}`
        : assigned_to
        ? `Assigned to ${assigned_to}`
        : "Complaint Details Updated";

    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      existing.id,
      actionLabel,
      oldStatus,
      newStatus,
      comment || `Updated to ${newStatus}`,
      performed_by || "Purechem Staff",
      performed_by_role || "Staff",
      now
    );

    // Audit Log (Section 30)
    db.prepare(`
      INSERT INTO audit_logs (
        entity_type, entity_id, action, user_name, user_role, old_values, new_values, created_at
      ) VALUES ('complaint', ?, 'UPDATE', ?, ?, ?, ?, ?)
    `).run(
      existing.id,
      performed_by || "Purechem Staff",
      performed_by_role || "Staff",
      JSON.stringify({ status: oldStatus, assigned_to: existing.assigned_to, priority: existing.admin_priority }),
      JSON.stringify({ status: newStatus, assigned_to, priority: admin_priority, resolution_details }),
      now
    );

    // Email Triggers
    if (newStatus !== oldStatus) {
      let emailType: any = "STATUS_CHANGE";
      if (newStatus === "CUSTOMER INFORMATION REQUIRED" || newStatus === "SAMPLE REQUIRED") {
        emailType = "INFO_REQUIRED";
      } else if (newStatus === "RESOLVED") {
        emailType = "RESOLVED";
      } else if (newStatus === "CLOSED") {
        emailType = "CLOSED";
      }

      sendNotificationEmail({
        complaintId: existing.id,
        complaintNumber: existing.complaint_number,
        recipientEmail: existing.customer_email,
        recipientName: existing.customer_name,
        type: emailType,
        data: {
          customerName: existing.customer_name,
          companyName: existing.customer_company,
          productName: existing.product_name,
          batchNumber: existing.batch_number,
          status: newStatus,
          complaintDate: existing.complaint_open_time,
          resolutionDate: resolvedAt,
          resolutionTime: formattedDuration,
          resolutionDetails: resolution_details || existing.resolution_details,
          comment: comment || undefined,
        },
      });
    }

    const updated = db.prepare("SELECT * FROM complaints WHERE id = ?").get(existing.id);

    if (isSupabaseConfigured && updated) {
      syncComplaintToSupabase(updated).catch((e) => console.warn("Supabase complaint update:", e.message));
      syncTimelineToSupabase({
        complaint_id: existing.id,
        action: actionLabel,
        old_status: oldStatus,
        new_status: newStatus,
        comment: comment || `Updated to ${newStatus}`,
        is_internal_only: false,
        performed_by: performed_by || "Purechem Staff",
        performed_by_role: performed_by_role || "Staff",
        created_at: now,
      }).catch((e) => console.warn("Supabase timeline update:", e.message));
    }

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
