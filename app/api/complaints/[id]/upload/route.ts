import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSupabaseConfigured, uploadAndSyncAttachmentToSupabase, syncTimelineToSupabase } from "@/lib/db/supabase";
import path from "node:path";
import fs from "node:fs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const id = params.id;

    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?").get(id, id) as any;
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "customer_evidence";
    const uploadedBy = (formData.get("uploaded_by") as string) || "User";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 25MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename and create unique storage name
    const ext = path.extname(file.name) || ".bin";
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${Date.now()}-${cleanBase}${ext}`;
    const attachmentId = `ATT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    let destinationPath = "";
    let fileUrl = `/uploads/${complaint.id}/${uniqueFileName}`;

    // 1. Try local disk write (works on persistent servers like Render and local dev)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", complaint.id);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      destinationPath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(destinationPath, buffer);
    } catch (diskErr: any) {
      console.warn("Local disk write skipped (likely serverless read-only):", diskErr.message);
    }

    // 2. Dual-upload to Supabase Storage & Supabase attachments table if configured
    if (isSupabaseConfigured) {
      try {
        const sbRes = await uploadAndSyncAttachmentToSupabase({
          id: attachmentId,
          complaint_id: complaint.id,
          file_name: file.name,
          file_buffer: buffer,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          attachment_category: category,
          uploaded_by: uploadedBy,
        });
        if (sbRes.success && sbRes.file_url) {
          fileUrl = sbRes.file_url; // Use CDN URL if available
        }
      } catch (sbErr: any) {
        console.warn("Supabase Storage attachment upload warning:", sbErr.message);
      }
    }

    // 3. Save into local SQLite for fast local retrieval
    db.prepare(`
      INSERT INTO attachments (
        id, complaint_id, file_name, stored_path, file_url, file_type, file_size, attachment_category, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attachmentId,
      complaint.id,
      file.name,
      destinationPath || fileUrl,
      fileUrl,
      file.type || "application/octet-stream",
      file.size,
      category,
      uploadedBy,
      now
    );

    // 4. Timeline event
    const timelineComment = `Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, 'Evidence File Uploaded', ?, ?, ?, 0, ?, 'User', ?)
    `).run(
      complaint.id,
      complaint.status,
      complaint.status,
      timelineComment,
      uploadedBy,
      now
    );

    if (isSupabaseConfigured) {
      syncTimelineToSupabase({
        complaint_id: complaint.id,
        action: "Evidence File Uploaded",
        old_status: complaint.status,
        new_status: complaint.status,
        comment: timelineComment,
        is_internal_only: false,
        performed_by: uploadedBy,
        performed_by_role: "User",
        created_at: now,
      }).catch((e) => console.warn("Supabase timeline warning:", e.message));
    }

    const newAttachment = db.prepare("SELECT * FROM attachments WHERE id = ?").get(attachmentId);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      attachment: newAttachment,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
