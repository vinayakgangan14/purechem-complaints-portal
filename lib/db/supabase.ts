import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: {
        persistSession: false,
      },
    })
  : null;

const BUCKET_NAME = "complaint-attachments";

/**
 * Ensures the attachments bucket exists in Supabase Storage.
 */
export async function ensureAttachmentsBucket(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn("Supabase listBuckets error:", error.message);
      return false;
    }
    const exists = buckets?.some((b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
      if (createErr && !createErr.message.includes("already exists")) {
        console.warn("Could not create Supabase storage bucket:", createErr.message);
      }
    }
    return true;
  } catch (err: any) {
    console.warn("ensureAttachmentsBucket exception:", err.message);
    return false;
  }
}

/**
 * Upload an attachment file to Supabase Storage and record in Supabase attachments table.
 */
export async function uploadAndSyncAttachmentToSupabase(params: {
  id?: string;
  complaint_id: string;
  file_name: string;
  file_buffer: Buffer;
  file_type: string;
  file_size: number;
  attachment_category?: string;
  uploaded_by?: string;
}): Promise<{ success: boolean; file_url?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    await ensureAttachmentsBucket();

    const ext = path.extname(params.file_name) || ".bin";
    const cleanBase = path.basename(params.file_name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `${params.complaint_id}/${Date.now()}-${cleanBase}${ext}`;

    // Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, params.file_buffer, {
        contentType: params.file_type || "application/octet-stream",
        upsert: true,
      });

    let publicUrl = "";
    if (uploadError) {
      console.warn("Supabase Storage upload warning:", uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      publicUrl = urlData?.publicUrl || "";
    }

    const attachmentId = params.id || `ATT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    // Insert into Supabase attachments table
    const { error: dbError } = await supabase.from("attachments").upsert({
      id: attachmentId,
      complaint_id: params.complaint_id,
      file_name: params.file_name,
      stored_path: storagePath,
      file_url: publicUrl || `/uploads/${params.complaint_id}/${params.file_name}`,
      file_type: params.file_type,
      file_size: params.file_size,
      attachment_category: params.attachment_category || "customer_evidence",
      uploaded_by: params.uploaded_by || "User",
      created_at: now,
    });

    if (dbError) {
      console.warn("Supabase attachments table insert error:", dbError.message);
      return { success: false, error: dbError.message };
    }

    return { success: true, file_url: publicUrl };
  } catch (err: any) {
    console.error("uploadAndSyncAttachmentToSupabase error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Upsert a complaint record to Supabase Cloud PostgreSQL.
 */
export async function syncComplaintToSupabase(complaint: any): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // Format values strictly matching Postgres types
    const payload: any = {
      id: complaint.id,
      complaint_number: complaint.complaint_number,
      customer_name: complaint.customer_name,
      customer_company: complaint.customer_company || "",
      customer_email: complaint.customer_email,
      customer_phone: complaint.customer_phone,
      customer_type: complaint.customer_type || "Customer",
      raised_by_role: complaint.raised_by_role || "Customer",
      raised_by_name: complaint.raised_by_name || complaint.customer_name,
      product_name: complaint.product_name,
      product_category: complaint.product_category || "Adhesives",
      product_code: complaint.product_code || "",
      batch_number: complaint.batch_number || "",
      manufacturing_date: complaint.manufacturing_date || null,
      expiry_date: complaint.expiry_date || null,
      pack_size: complaint.pack_size || "",
      quantity_purchased: complaint.quantity_purchased || "",
      invoice_number: complaint.invoice_number || "",
      purchase_date: complaint.purchase_date || null,
      complaint_type: complaint.complaint_type,
      customer_priority: complaint.customer_priority || "Normal",
      admin_priority: complaint.admin_priority || "Medium",
      description: complaint.description,
      status: complaint.status || "OPEN",
      assigned_to: complaint.assigned_to || null,
      assigned_department: complaint.assigned_department || null,
      complaint_open_time: complaint.complaint_open_time || complaint.created_at || new Date().toISOString(),
      acknowledged_at: complaint.acknowledged_at || null,
      investigation_started_at: complaint.investigation_started_at || null,
      resolved_at: complaint.resolved_at || null,
      closed_at: complaint.closed_at || null,
      total_resolution_minutes: complaint.total_resolution_minutes || null,
      total_resolution_hours: complaint.total_resolution_hours || null,
      resolution_time_formatted: complaint.resolution_time_formatted || null,
      resolution_details: complaint.resolution_details || null,
      root_cause: complaint.root_cause || null,
      corrective_action: complaint.corrective_action || null,
      preventive_action: complaint.preventive_action || null,
      target_resolution_hours: complaint.target_resolution_hours || 72,
      is_overdue: complaint.is_overdue ? 1 : 0, // Ensure integer (0 or 1)
      created_at: complaint.created_at || new Date().toISOString(),
      updated_at: complaint.updated_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("complaints").upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Supabase complaint upsert error:", error.message, error.details);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("syncComplaintToSupabase exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Upsert a timeline entry to Supabase.
 */
export async function syncTimelineToSupabase(entry: any): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const payload = {
      complaint_id: entry.complaint_id,
      action: entry.action,
      old_status: entry.old_status || null,
      new_status: entry.new_status || null,
      comment: entry.comment || null,
      is_internal_only: Boolean(entry.is_internal_only),
      performed_by: entry.performed_by || "System",
      performed_by_role: entry.performed_by_role || "User",
      created_at: entry.created_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("complaint_timeline").insert(payload);
    if (error) {
      console.warn("Supabase timeline insert error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Upsert a QC Batch Report to Supabase.
 */
export async function syncQcBatchToSupabase(batch: any): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const payload = {
      id: batch.id || undefined,
      batch_number: batch.batch_number,
      product_name: batch.product_name,
      product_code: batch.product_code || null,
      production_line: batch.production_line || null,
      manufacturing_date: batch.manufacturing_date || null,
      expiry_date: batch.expiry_date || null,
      viscosity_reading: batch.viscosity_reading || null,
      solid_content: batch.solid_content || null,
      specific_gravity: batch.specific_gravity || null,
      ph_value: batch.ph_value || null,
      colour_appearance: batch.colour_appearance || null,
      tack_free_time: batch.tack_free_time || null,
      qc_status: batch.qc_status || "PASSED",
      tested_by: batch.tested_by || "QC Analyst",
      tested_date: batch.tested_date || new Date().toISOString(),
      remarks: batch.remarks || null,
      coa_pdf_url: batch.coa_pdf_url || null,
      created_at: batch.created_at || new Date().toISOString(),
      updated_at: batch.updated_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("qc_batch_reports").upsert(payload, { onConflict: "batch_number" });
    if (error) {
      console.warn("Supabase QC Batch upsert error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sync ALL local records (Complaints, Attachments, Timeline, QC Batches) from local SQLite to Supabase Cloud.
 */
export async function syncAllLocalDataToSupabase(getDbFn: () => any): Promise<{
  success: boolean;
  complaintsSynced: number;
  attachmentsSynced: number;
  timelineSynced: number;
  qcBatchesSynced: number;
  errors: string[];
}> {
  if (!supabase) {
    return {
      success: false,
      complaintsSynced: 0,
      attachmentsSynced: 0,
      timelineSynced: 0,
      qcBatchesSynced: 0,
      errors: ["Supabase credentials not configured in environment variables."],
    };
  }

  const errors: string[] = [];
  let complaintsSynced = 0;
  let attachmentsSynced = 0;
  let timelineSynced = 0;
  let qcBatchesSynced = 0;

  try {
    const db = getDbFn();

    // 1. Sync Complaints
    const complaints = db.prepare("SELECT * FROM complaints").all() as any[];
    for (const c of complaints) {
      const res = await syncComplaintToSupabase(c);
      if (res.success) {
        complaintsSynced++;
      } else {
        errors.push(`Complaint ${c.complaint_number}: ${res.error}`);
      }
    }

    // 2. Sync Timeline
    const timeline = db.prepare("SELECT * FROM complaint_timeline").all() as any[];
    for (const t of timeline) {
      const res = await syncTimelineToSupabase(t);
      if (res.success) {
        timelineSynced++;
      }
    }

    // 3. Sync Attachments (Including uploading physical files from disk to Supabase Storage!)
    const attachments = db.prepare("SELECT * FROM attachments").all() as any[];
    for (const a of attachments) {
      try {
        let fileBuffer: Buffer | null = null;
        if (a.stored_path && fs.existsSync(a.stored_path)) {
          fileBuffer = fs.readFileSync(a.stored_path);
        } else {
          // Check public/uploads fallback
          const fallbackPath = path.join(process.cwd(), "public", "uploads", a.complaint_id, path.basename(a.stored_path || a.file_name));
          if (fs.existsSync(fallbackPath)) {
            fileBuffer = fs.readFileSync(fallbackPath);
          }
        }

        if (fileBuffer) {
          const res = await uploadAndSyncAttachmentToSupabase({
            id: a.id,
            complaint_id: a.complaint_id,
            file_name: a.file_name,
            file_buffer: fileBuffer,
            file_type: a.file_type || "application/octet-stream",
            file_size: a.file_size || fileBuffer.length,
            attachment_category: a.attachment_category,
            uploaded_by: a.uploaded_by,
          });
          if (res.success) {
            attachmentsSynced++;
          } else {
            errors.push(`Attachment ${a.file_name}: ${res.error}`);
          }
        } else {
          // Insert metadata row if file binary isn't on disk
          const { error } = await supabase.from("attachments").upsert({
            id: a.id,
            complaint_id: a.complaint_id,
            file_name: a.file_name,
            stored_path: a.stored_path || "",
            file_url: a.file_url || "",
            file_type: a.file_type || "application/octet-stream",
            file_size: a.file_size || 0,
            attachment_category: a.attachment_category || "customer_evidence",
            uploaded_by: a.uploaded_by || "User",
            created_at: a.created_at || new Date().toISOString(),
          });
          if (!error) attachmentsSynced++;
        }
      } catch (attErr: any) {
        errors.push(`Attachment ${a.file_name}: ${attErr.message}`);
      }
    }

    // 4. Sync QC Batch Reports
    try {
      const qcBatches = db.prepare("SELECT * FROM qc_batch_reports").all() as any[];
      for (const q of qcBatches) {
        const res = await syncQcBatchToSupabase(q);
        if (res.success) {
          qcBatchesSynced++;
        }
      }
    } catch (e: any) {
      console.warn("QC batches table read in SQLite:", e.message);
    }

    return {
      success: errors.length === 0 || complaintsSynced > 0,
      complaintsSynced,
      attachmentsSynced,
      timelineSynced,
      qcBatchesSynced,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      complaintsSynced,
      attachmentsSynced,
      timelineSynced,
      qcBatchesSynced,
      errors: [err.message],
    };
  }
}
