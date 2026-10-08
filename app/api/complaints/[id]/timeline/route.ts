import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;
    const body = await req.json();
    const { comment, is_internal_only, performed_by, performed_by_role } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: "Comment text cannot be empty" }, { status: 400 });
    }

    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?").get(id, id) as any;
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const isInternal = is_internal_only ? 1 : 0;
    const action = isInternal ? "Internal Note Added" : "Customer Communication";

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
      performed_by || "Purechem Staff",
      performed_by_role || "Staff",
      now
    );

    return NextResponse.json({ success: true, message: "Timeline entry recorded" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
