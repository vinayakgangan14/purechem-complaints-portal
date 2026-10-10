export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase, uploadAndSyncAttachmentToSupabase } from "@/lib/db/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const { data: complaint, error: compErr } = await supabase
      .from("complaints")
      .select("id, complaint_number")
      .or(`id.eq.${id},complaint_number.eq.${id}`)
      .maybeSingle();

    if (compErr || !complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "customer_evidence";
    const uploadedBy = (formData.get("uploaded_by") as string) || "User";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 25MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const attachmentId = `ATT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const uploadRes = await uploadAndSyncAttachmentToSupabase({
      id: attachmentId,
      complaint_id: complaint.id,
      file_name: file.name,
      file_buffer: buffer,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      attachment_category: category,
      uploaded_by: uploadedBy,
    });

    if (!uploadRes.success) {
      return NextResponse.json({ success: false, error: uploadRes.error || "Upload failed" }, { status: 500 });
    }

    const timelineComment = `Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    await supabase.from("complaint_timeline").insert({
      complaint_id: complaint.id,
      action: "Document / Evidence Uploaded",
      old_status: null,
      new_status: null,
      comment: timelineComment,
      is_internal_only: false,
      performed_by: uploadedBy,
      performed_by_role: "User",
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      attachment: {
        id: attachmentId,
        complaint_id: complaint.id,
        file_name: file.name,
        file_url: uploadRes.file_url,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        attachment_category: category,
        uploaded_by: uploadedBy,
        created_at: now,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
