import { createClient, SupabaseClient } from "@supabase/supabase-js";
import path from "node:path";

const DEFAULT_SUPABASE_URL = "https://qgyjqwefauomhltbjtjy.supabase.co";
const DEFAULT_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneWpxd2VmYXVvbWhsdGJqdGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ2NzYxOSwiZXhwIjoyMTA3MDQzNjE5fQ.hh-QdJ7bPPZLnkv9roH8wXYh25bi6AyrycR7vzXXm-k";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneWpxd2VmYXVvbWhsdGJqdGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Njc2MTksImV4cCI6MjEwNzA0MzYxOX0.tvec3H3C6bcDU_fHNPBrjEES8n1T94M99BWLqXoNxU8";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SERVICE_KEY;

export const isSupabaseConfigured = true;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export function getSupabase(): SupabaseClient {
  return supabase;
}

const BUCKET_NAME = "complaint-attachments";

export async function ensureAttachmentsBucket(): Promise<boolean> {
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
  try {
    await ensureAttachmentsBucket();

    const ext = path.extname(params.file_name) || ".bin";
    const cleanBase = path.basename(params.file_name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `${params.complaint_id}/${Date.now()}-${cleanBase}${ext}`;

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

export async function syncComplaintToSupabase(complaint: any): Promise<{ success: boolean; error?: string }> {
  try {
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
      is_overdue: complaint.is_overdue ? 1 : 0,
      created_at: complaint.created_at || new Date().toISOString(),
      updated_at: complaint.updated_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("complaints").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase complaint upsert error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function syncTimelineToSupabase(entry: any): Promise<{ success: boolean; error?: string }> {
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

export async function syncQcBatchToSupabase(batch: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      batch_number: batch.batch_number,
      product_name: batch.product_name,
      viscosity: batch.viscosity || null,
      colour: batch.colour || null,
      solids: batch.solids || null,
      qc_status: batch.qc_status || "Passed",
      manufacturing_date: batch.manufacturing_date || null,
      expiry_date: batch.expiry_date || null,
      tested_by: batch.tested_by || "Dr. Chioma Okonkwo (QC)",
      testing_date: batch.testing_date || new Date().toISOString().split("T")[0],
      remarks: batch.remarks || null,
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
