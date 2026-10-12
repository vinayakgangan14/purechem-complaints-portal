export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { calculateDuration, getComplaintSlaStatus, formatDurationMinutes } from "@/lib/timer/resolution";
import { sendNotificationEmail } from "@/lib/email/dispatcher";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const role = req.cookies.get("pcm_role")?.value || "quality_manager";

    const { data: complaint, error } = await supabase
      .from("complaints")
      .select("*")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (error || !complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const isResolvedOrClosed = complaint.status === "RESOLVED" || complaint.status === "CLOSED" || complaint.status === "REJECTED";
    const timerStart = complaint.acknowledged_at || complaint.complaint_open_time;
    const duration = isResolvedOrClosed
      ? calculateDuration(timerStart, complaint.resolved_at || complaint.closed_at || complaint.updated_at)
      : calculateDuration(timerStart, new Date());

    const sla = getComplaintSlaStatus(complaint);

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
        is_overdue: sla.isCritical ? 1 : 0,
        is_response_overdue: sla.isResponseOverdue ? 1 : 0,
        is_resolution_overdue: sla.isResolutionOverdue ? 1 : 0,
        sla_status: sla,
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
      workflow_action, // "qc_accept" | "qc_reject" | "dept_resolve" | "qc_final_close"
      status,
      assigned_to,
      assigned_department,
      admin_priority,
      resolution_details,
      root_cause,
      corrective_action,
      preventive_action,
      rejection_reason,
      comment,
      performed_by,
      performed_by_role,
      is_internal_only,
    } = body;

    const now = new Date().toISOString();
    const staffRole = performed_by_role || req.cookies.get("pcm_role")?.value || "quality_manager";
    const staffName = performed_by || "Rajesh Poojari (QC Manager)";

    const updates: Record<string, any> = {
      updated_at: now,
    };

    const timelineEvents: any[] = [];

    // WORKFLOW TRANSITION A: Rajesh Poojari REJECTS Complaint
    if (workflow_action === "qc_reject" || status === "REJECTED") {
      updates.status = "REJECTED";
      updates.resolved_at = now;
      updates.closed_at = now;
      const rejectNote = rejection_reason || comment || "Counter sample checked found ok and rejected.";
      updates.resolution_details = `[QC REJECTION]: ${rejectNote}`;
      updates.root_cause = "Counter retention sample checked in QC lab — confirmed compliant. Complaint rejected.";

      timelineEvents.push({
        action: "Complaint Rejected by Rajesh Poojari (QC Manager)",
        old_status: existing.status,
        new_status: "REJECTED",
        comment: rejectNote,
        is_internal_only: false,
      });

      sendNotificationEmail({
        complaintId: existing.id,
        complaintNumber: existing.complaint_number,
        recipientEmail: existing.customer_email,
        recipientName: existing.customer_name,
        type: "STATUS_CHANGE",
        data: {
          customerName: existing.customer_name,
          companyName: existing.customer_company,
          productName: existing.product_name,
          batchNumber: existing.batch_number,
          status: "REJECTED",
          complaintDate: existing.complaint_open_time,
          comment: rejectNote,
        },
      }).catch(console.warn);
    }
    // WORKFLOW TRANSITION B: Rajesh Poojari ACCEPTS & ASSIGNS Complaint (TIMER STARTS!)
    else if (workflow_action === "qc_accept" || (status === "ACCEPTED" && existing.status !== "ACCEPTED")) {
      updates.status = "ACCEPTED";
      updates.acknowledged_at = now; // TIMER STARTS NOW
      updates.assigned_department = assigned_department || "Production";
      updates.assigned_to = assigned_to || "Vinayak Gangan";
      if (admin_priority) updates.admin_priority = admin_priority;

      const assignComment = comment || `Validated and accepted by Rajesh Poojari (QC Manager). Resolution timer officially started. Assigned to ${updates.assigned_department} (${updates.assigned_to}).`;

      timelineEvents.push({
        action: `Complaint Accepted & Assigned to ${updates.assigned_department} (${updates.assigned_to})`,
        old_status: existing.status,
        new_status: "ACCEPTED",
        comment: assignComment,
        is_internal_only: false,
      });

      sendNotificationEmail({
        complaintId: existing.id,
        complaintNumber: existing.complaint_number,
        recipientEmail: existing.customer_email,
        recipientName: existing.customer_name,
        type: "STATUS_CHANGE",
        data: {
          customerName: existing.customer_name,
          companyName: existing.customer_company,
          productName: existing.product_name,
          batchNumber: existing.batch_number,
          status: "ACCEPTED",
          complaintDate: existing.complaint_open_time,
          comment: `Your complaint has been validated by QC and assigned to our ${updates.assigned_department} technical team for prompt investigation.`,
        },
      }).catch(console.warn);
    }
    // WORKFLOW TRANSITION C: Department Submits Investigation & Resolution
    else if (workflow_action === "dept_resolve" || status === "UNDER_FINAL_REVIEW") {
      updates.status = "UNDER_FINAL_REVIEW";
      if (root_cause) updates.root_cause = root_cause;
      if (corrective_action) updates.corrective_action = corrective_action;
      if (preventive_action) updates.preventive_action = preventive_action;
      if (resolution_details) updates.resolution_details = resolution_details;

      const subComment = comment || `Investigation completed by ${staffName} (${existing.assigned_department}). Submitted to Rajesh Poojari for final QC review.`;

      timelineEvents.push({
        action: `Department Investigation Submitted by ${staffName}`,
        old_status: existing.status,
        new_status: "UNDER_FINAL_REVIEW",
        comment: subComment,
        is_internal_only: false,
      });
    }
    // WORKFLOW TRANSITION D: Rajesh Poojari Final Review & Official Closure
    else if (workflow_action === "qc_final_close" || status === "CLOSED" || status === "RESOLVED") {
      updates.status = "CLOSED";
      updates.resolved_at = now;
      updates.closed_at = now;

      const timerStart = existing.acknowledged_at || existing.complaint_open_time;
      const openMs = new Date(timerStart).getTime();
      const closeMs = new Date(now).getTime();
      const diffMinutes = Math.max(1, Math.round((closeMs - openMs) / 60000));
      updates.total_resolution_minutes = diffMinutes;
      updates.total_resolution_hours = +(diffMinutes / 60).toFixed(2);
      updates.resolution_time_formatted = formatDurationMinutes(diffMinutes);

      const closeRemarks = comment || resolution_details || "Final QC verification completed. Corrective action approved by Rajesh Poojari.";
      updates.resolution_details = `[FINAL QC APPROVAL by Rajesh Poojari]: ${closeRemarks}`;

      timelineEvents.push({
        action: "Final QC Review Approved & Closed by Rajesh Poojari",
        old_status: existing.status,
        new_status: "CLOSED",
        comment: closeRemarks,
        is_internal_only: false,
      });

      sendNotificationEmail({
        complaintId: existing.id,
        complaintNumber: existing.complaint_number,
        recipientEmail: existing.customer_email,
        recipientName: existing.customer_name,
        type: "RESOLVED",
        data: {
          customerName: existing.customer_name,
          companyName: existing.customer_company,
          productName: existing.product_name,
          batchNumber: existing.batch_number,
          status: "CLOSED",
          complaintDate: existing.complaint_open_time,
          resolutionDate: now,
          resolutionTime: updates.resolution_time_formatted,
          resolutionDetails: closeRemarks,
        },
      }).catch(console.warn);
    }
    // General update fallback
    else {
      if (status && status !== existing.status) updates.status = status;
      if (assigned_to !== undefined) updates.assigned_to = assigned_to;
      if (assigned_department !== undefined) updates.assigned_department = assigned_department;
      if (admin_priority !== undefined) updates.admin_priority = admin_priority;
      if (resolution_details !== undefined) updates.resolution_details = resolution_details;
      if (root_cause !== undefined) updates.root_cause = root_cause;
      if (corrective_action !== undefined) updates.corrective_action = corrective_action;
      if (preventive_action !== undefined) updates.preventive_action = preventive_action;

      if (comment) {
        timelineEvents.push({
          action: "Case Details Updated",
          old_status: existing.status,
          new_status: updates.status || existing.status,
          comment,
          is_internal_only: Boolean(is_internal_only),
        });
      }
    }

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
