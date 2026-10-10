export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateDuration, isComplaintOverdue } from "@/lib/timer/resolution";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { complaint_id, verification } = body;

    if (!complaint_id || !verification) {
      return NextResponse.json(
        { success: false, error: "Please enter your Complaint ID and registered Email or Phone number." },
        { status: 400 }
      );
    }

    const cleanId = complaint_id.trim();
    const cleanVerify = verification.trim().toLowerCase();

    // Look up complaint matching ID/Number AND email or phone
    const complaint = db.prepare(`
      SELECT * FROM complaints 
      WHERE (complaint_number = ? OR id = ?)
        AND (LOWER(customer_email) = ? OR customer_phone LIKE ?)
    `).get(cleanId, cleanId, cleanVerify, `%${cleanVerify}%`) as any;

    if (!complaint) {
      return NextResponse.json(
        {
          success: false,
          error: "No matching complaint found with the provided Reference Number and contact verification details.",
        },
        { status: 404 }
      );
    }

    // Calculate live or finalized timer
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

    // Fetch customer-safe timeline (ONLY is_internal_only = 0)
    const timeline = db.prepare(`
      SELECT id, action, old_status, new_status, comment, performed_by_role, created_at
      FROM complaint_timeline
      WHERE complaint_id = ? AND is_internal_only = 0
      ORDER BY created_at ASC
    `).all(complaint.id);

    // Publicly sanitized complaint data
    const publicData = {
      id: complaint.id,
      complaint_number: complaint.complaint_number,
      customer_name: complaint.customer_name,
      customer_company: complaint.customer_company,
      product_name: complaint.product_name,
      product_category: complaint.product_category,
      batch_number: complaint.batch_number,
      complaint_type: complaint.complaint_type,
      status: complaint.status,
      complaint_open_time: complaint.complaint_open_time,
      resolved_at: complaint.resolved_at,
      closed_at: complaint.closed_at,
      resolution_details: complaint.resolution_details,
      resolution_time_formatted: complaint.resolution_time_formatted,
      live_duration: duration,
      is_overdue: overdue ? 1 : 0,
    };

    return NextResponse.json({
      success: true,
      complaint: publicData,
      timeline,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
