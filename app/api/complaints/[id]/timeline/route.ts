export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { action: customAction, comment, is_internal_only, performed_by, performed_by_role } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty" }, { status: 400 });
    }

    const { data: complaint, error: compErr } = await supabase
      .from("complaints")
      .select("id, status")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (compErr || !complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const isInternal = Boolean(is_internal_only);
    const action = customAction || (isInternal ? "Internal QA Lab Note" : "Customer Communication");
    const staffRole = performed_by_role || req.cookies.get("pcm_role")?.value || "Quality";
    const staffName = performed_by || (staffRole === "quality_manager" || staffRole === "Quality" ? "Dr. Chioma Okonkwo (QC)" : "Purechem Staff");

    const { data: inserted, error: insErr } = await supabase
      .from("complaint_timeline")
      .insert({
        complaint_id: complaint.id,
        action,
        old_status: complaint.status,
        new_status: complaint.status,
        comment: comment.trim(),
        is_internal_only: isInternal,
        performed_by: staffName,
        performed_by_role: staffRole,
        created_at: now,
      })
      .select()
      .single();

    if (insErr) {
      return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timeline: inserted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
