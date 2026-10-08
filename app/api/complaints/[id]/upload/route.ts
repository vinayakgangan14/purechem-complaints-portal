import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
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

    const uploadsDir = path.join(process.cwd(), "public", "uploads", complaint.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean filename and create unique storage name
    const ext = path.extname(file.name) || ".bin";
    const cleanBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${Date.now()}-${cleanBase}${ext}`;
    const destinationPath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(destinationPath, buffer);

    const fileUrl = `/uploads/${complaint.id}/${uniqueFileName}`;
    const attachmentId = `ATT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO attachments (
        id, complaint_id, file_name, stored_path, file_url, file_type, file_size, attachment_category, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attachmentId,
      complaint.id,
      file.name,
      destinationPath,
      fileUrl,
      file.type || "application/octet-stream",
      file.size,
      category,
      uploadedBy,
      now
    );

    // Timeline event
    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, 'Evidence File Uploaded', ?, ?, ?, 0, ?, 'User', ?)
    `).run(
      complaint.id,
      complaint.status,
      complaint.status,
      `Uploaded document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      uploadedBy,
      now
    );

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
