export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { calculateDuration, isComplaintOverdue, SLA_TARGETS, formatDurationMinutes } from "@/lib/timer/resolution";
import { sendNotificationEmail } from "@/lib/email/dispatcher";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const role = req.cookies.get("pcm_role")?.value || "customer";

    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (error || !complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

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

    const isStaffRequest =
      req.nextUrl.searchParams.get("include_internal") === "true" ||
      req.headers.get("referer")?.includes("/admin") ||
      (role && role !== "customer");

    let tlQuery = supabase.from("complaint_timeline").select("*").eq("complaint_id", complaint.id);
    if (!isStaffRequest) {
      tlQuery = tlQuery.eq("is_internal_only", false);
    }
    const { data: timeline } = await tlQuery.order("created_at", { ascending: true });

    let qcReport: any = null;
    if (complaint.batch_number && complaint.batch_number.trim()) {
      const cleanBatch = complaint.batch_number.trim();
      const { data: qc } = await supabase
        .from("qc_batch_reports")
        .select("*")
        .or(`batch_number.eq.${cleanBatch},batch_number.ilike.%${cleanBatch}%`)
        .maybeSingle();
      qcReport = qc;
    }

    const { data: attachments } = await supabase
      .from("attachments")
      .select("*")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: false });

    const { data: feedback } = await supabase
      .from("feedback")
      .select("*")
      .eq("complaint_id", complaint.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      complaint: {
        ...complaint,
        live_duration: duration,
        is_overdue: overdue ? 1 : 0,
      },
      timeline: timeline || [],
      qc_report: qcReport,
      attachments: attachments || [],
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const { data: existing, error: findErr } = await supabase
      .from("complaints")
      .select("*")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (findErr || !existing) {
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
      is_internal_only,
    } = body;

    const now = new Date().toISOString();
    const staffRole = performed_by_role || req.cookies.get("pcm_role")?.value || "admin";
    const staffName = performed_by || "Quality Manager";

    const updates: Record<string, any> = {
      updated_at: now,
    };

    const timelineEvents: any[] = [];

    if (status && status !== existing.status) {
      updates.status = status;

      if (status === "RESOLVED") {
        updates.resolved_at = now;
        const openMs = new Date(existing.complaint_open_time).getTime();
        const resolveMs = new Date(now).getTime();
        const diffMinutes = Math.max(1, Math.round((resolveMs - openMs) / 60000));
        updates.total_resolution_minutes = diffMinutes;
        updates.total_resolution_hours = +(diffMinutes / 60).toFixed(2);
        updates.resolution_time_formatted = formatDurationMinutes(diffMinutes);
      } else if (status === "CLOSED") {
        updates.closed_at = now;
      } else if (status === "ACKNOWLEDGED" && !existing.acknowledged_at) {
        updates.acknowledged_at = now;
      } else if (status === "INVESTIGATION" && !existing.investigation_started_at) {
        updates.investigation_started_at = now;
      }

      timelineEvents.push({
        action: `Status changed to ${status}`,
        old_status: existing.status,
        new_status: status,
        comment: comment || `Complaint status moved from ${existing.status} to ${status}`,
        is_internal_only: Boolean(is_internal_only),
      });

      sendNotificationEmail({
        complaintId: existing.id,
        complaintNumber: existing.complaint_number,
        recipientEmail: existing.customer_email,
        recipientName: existing.customer_name,
        type: status === "RESOLVED" ? "RESOLVED" : status === "CLOSED" ? "CLOSED" : status === "SAMPLE REQUIRED" ? "INFO_REQUIRED" : "STATUS_CHANGE",
        data: {
          customerName: existing.customer_name,
          companyName: existing.customer_company,
          productName: existing.product_name,
          batchNumber: existing.batch_number,
          status,
          complaintDate: existing.complaint_open_time,
          resolutionDate: updates.resolved_at,
          resolutionTime: updates.resolution_time_formatted,
          resolutionDetails: resolution_details || existing.resolution_details,
          comment: comment || "",
        },
      }).catch((e) => console.warn("Email dispatch error:", e.message));
    }

    if (assigned_to !== undefined && assigned_to !== existing.assigned_to) {
      updates.assigned_to = assigned_to;
      timelineEvents.push({
        action: "Assigned To Staff",
        comment: `Assigned to ${assigned_to || "Unassigned"}`,
        is_internal_only: true,
      });
    }

    if (assigned_department !== undefined && assigned_department !== existing.assigned_department) {
      updates.assigned_department = assigned_department;
    }

    if (admin_priority !== undefined && admin_priority !== existing.admin_priority) {
      updates.admin_priority = admin_priority;
    }

    if (resolution_details !== undefined) updates.resolution_details = resolution_details;
    if (root_cause !== undefined) updates.root_cause = root_cause;
    if (corrective_action !== undefined) updates.corrective_action = corrective_action;
    if (preventive_action !== undefined) updates.preventive_action = preventive_action;

    // Execute update in Supabase
    const { error: updErr } = await supabase
      .from("complaints")
      .update(updates)
      .eq("id", existing.id);

    if (updErr) {
      return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
    }

    // Insert timeline events in Supabase
    for (const evt of timelineEvents) {
      await supabase.from("complaint_timeline").insert({
        complaint_id: existing.id,
        action: evt.action,
        old_status: evt.old_status || existing.status,
        new_status: evt.new_status || updates.status || existing.status,
        comment: evt.comment,
        is_internal_only: evt.is_internal_only,
        performed_by: staffName,
        performed_by_role: staffRole,
        created_at: now,
      });
    }

    const { data: updatedComplaint } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", existing.id)
      .single();

    return NextResponse.json({
      success: true,
      message: "Complaint successfully updated",
      complaint: updatedComplaint,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
