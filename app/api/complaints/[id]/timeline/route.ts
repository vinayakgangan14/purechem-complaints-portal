export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured, syncTimelineToSupabase } from "@/lib/db/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;
    const body = await req.json();
    const { action: customAction, comment, is_internal_only, performed_by, performed_by_role } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty" }, { status: 400 });
    }

    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?").get(id, id) as any;
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const isInternal = is_internal_only ? 1 : 0;
    const action = customAction || (isInternal ? "Internal QA Lab Note" : "Customer Communication");
    const staffRole = performed_by_role || req.cookies.get("pcm_role")?.value || "Quality";
    const staffName = performed_by || (staffRole === "quality_manager" || staffRole === "Quality" ? "Dr. Chioma Okonkwo (QC)" : "Purechem Staff");

    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      complaint.id,
      action,
      complaint.status,
      complaint.status,
      comment.trim(),
      isInternal,
      staffName,
      staffRole,
      now
    );

    if (isSupabaseConfigured) {
      syncTimelineToSupabase({
        complaint_id: complaint.id,
        action,
        old_status: complaint.status,
        new_status: complaint.status,
        comment: comment.trim(),
        is_internal_only: Boolean(isInternal),
        performed_by: staffName,
        performed_by_role: staffRole,
        created_at: now,
      }).catch((e) => console.warn("Supabase timeline warning:", e.message));
    }

    const inserted = db.prepare("SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY id DESC LIMIT 1").get(complaint.id);

    return NextResponse.json({ success: true, message: "Timeline entry recorded", entry: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
