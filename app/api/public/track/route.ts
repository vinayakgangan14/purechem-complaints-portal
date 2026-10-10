export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { calculateDuration, isComplaintOverdue } from "@/lib/timer/resolution";

export async function POST(req: NextRequest) {
  try {
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

    // Query matching ID or complaint_number in Supabase
    const { data: matches, error } = await supabase
      .from("complaints")
      .select("*")
      .or(`complaint_number.eq.${cleanId},id.eq.${cleanId}`);

    if (error || !matches || matches.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No matching complaint found with the provided Reference Number.",
        },
        { status: 404 }
      );
    }

    const complaint = matches.find((c: any) => {
      const emailMatch = c.customer_email && c.customer_email.toLowerCase() === cleanVerify;
      const phoneMatch = c.customer_phone && c.customer_phone.includes(cleanVerify);
      return emailMatch || phoneMatch;
    });

    if (!complaint) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact verification details did not match the registered complaint. Please verify your email or phone.",
        },
        { status: 403 }
      );
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

    const { data: timeline } = await supabase
      .from("complaint_timeline")
      .select("id, action, old_status, new_status, comment, performed_by_role, created_at")
      .eq("complaint_id", complaint.id)
      .eq("is_internal_only", false)
      .order("created_at", { ascending: true });

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
      timeline: timeline || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
