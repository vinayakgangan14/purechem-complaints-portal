import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;
    const body = await req.json();
    const { rating, resolution_satisfaction, comments, customer_name } = body;

    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?").get(id, id) as any;
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    if (!rating || !resolution_satisfaction) {
      return NextResponse.json(
        { success: false, error: "Rating and satisfaction response are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO feedback (complaint_id, rating, resolution_satisfaction, comments, customer_name, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      complaint.id,
      parseInt(rating, 10),
      resolution_satisfaction,
      comments ? comments.trim() : "",
      customer_name || complaint.customer_name,
      now
    );

    // Also record on timeline
    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, 'Customer Feedback Submitted', ?, ?, ?, 0, ?, 'Customer', ?)
    `).run(
      complaint.id,
      complaint.status,
      complaint.status,
      `Rating: ${rating}/5 Stars. Satisfactory: ${resolution_satisfaction}. Comments: "${comments || "None"}"`,
      customer_name || complaint.customer_name,
      now
    );

    return NextResponse.json({ success: true, message: "Thank you! Your feedback has been recorded." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
