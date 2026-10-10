export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { rating, resolution_satisfaction, comments, customer_name } = body;

    const { data: complaint, error: compErr } = await supabase
      .from("complaints")
      .select("id, status, customer_name")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (compErr || !complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    if (!rating || !resolution_satisfaction) {
      return NextResponse.json(
        { success: false, error: "Rating and satisfaction response are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { error: fbErr } = await supabase.from("feedback").upsert({
      complaint_id: complaint.id,
      rating: parseInt(rating, 10),
      resolution_satisfaction,
      comments: comments ? comments.trim() : "",
      customer_name: customer_name || complaint.customer_name,
      submitted_at: now,
    }, { onConflict: "complaint_id" });

    if (fbErr) {
      return NextResponse.json({ success: false, error: fbErr.message }, { status: 500 });
    }

    await supabase.from("complaint_timeline").insert({
      complaint_id: complaint.id,
      action: "Customer Feedback Submitted",
      old_status: complaint.status,
      new_status: complaint.status,
      comment: `Rating: ${rating}/5 Stars. Satisfactory: ${resolution_satisfaction}. Comments: "${comments || "None"}"`,
      is_internal_only: false,
      performed_by: customer_name || complaint.customer_name,
      performed_by_role: "Customer",
      created_at: now,
    });

    return NextResponse.json({ success: true, message: "Thank you! Your feedback has been recorded." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
