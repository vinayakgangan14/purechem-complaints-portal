import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs";

let DatabaseCtor;
try {
  const sqliteModule = await import("node:sqlite");
  DatabaseCtor = sqliteModule.DatabaseSync;
} catch (e) {
  const betterSqlite = await import("better-sqlite3");
  DatabaseCtor = betterSqlite.default || betterSqlite;
}

const supabaseUrl = "https://qgyjqwefauomhltbjtjy.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneWpxd2VmYXVvbWhsdGJqdGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ2NzYxOSwiZXhwIjoyMTA3MDQzNjE5fQ.hh-QdJ7bPPZLnkv9roH8wXYh25bi6AyrycR7vzXXm-k";

const supabase = createClient(supabaseUrl, serviceKey);
const dbPath = path.join(process.cwd(), "data", "purechem.db");
const db = new DatabaseCtor(dbPath);

async function main() {
  console.log("=== PUSHING LOCAL DATA TO SUPABASE CLOUD ===");

  // 1. Sync Complaints
  const complaints = db.prepare("SELECT * FROM complaints").all();
  console.log(`Found ${complaints.length} complaints in local SQLite.`);

  let compSuccess = 0;
  for (const c of complaints) {
    const payload = {
      id: c.id,
      complaint_number: c.complaint_number,
      customer_name: c.customer_name,
      customer_company: c.customer_company || "",
      customer_email: c.customer_email,
      customer_phone: c.customer_phone,
      customer_type: c.customer_type || "Customer",
      raised_by_role: c.raised_by_role || "Customer",
      raised_by_name: c.raised_by_name || c.customer_name,
      product_name: c.product_name,
      product_category: c.product_category || "Adhesives",
      product_code: c.product_code || "",
      batch_number: c.batch_number || "",
      manufacturing_date: c.manufacturing_date || null,
      expiry_date: c.expiry_date || null,
      pack_size: c.pack_size || "",
      quantity_purchased: c.quantity_purchased || "",
      invoice_number: c.invoice_number || "",
      purchase_date: c.purchase_date || null,
      complaint_type: c.complaint_type,
      customer_priority: c.customer_priority || "Normal",
      admin_priority: c.admin_priority || "Medium",
      description: c.description,
      status: c.status || "OPEN",
      assigned_to: c.assigned_to || null,
      assigned_department: c.assigned_department || null,
      complaint_open_time: c.complaint_open_time || c.created_at || new Date().toISOString(),
      acknowledged_at: c.acknowledged_at || null,
      investigation_started_at: c.investigation_started_at || null,
      resolved_at: c.resolved_at || null,
      closed_at: c.closed_at || null,
      total_resolution_minutes: c.total_resolution_minutes || null,
      total_resolution_hours: c.total_resolution_hours || null,
      resolution_time_formatted: c.resolution_time_formatted || null,
      resolution_details: c.resolution_details || null,
      root_cause: c.root_cause || null,
      corrective_action: c.corrective_action || null,
      preventive_action: c.preventive_action || null,
      target_resolution_hours: c.target_resolution_hours || 72,
      is_overdue: c.is_overdue ? 1 : 0,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || new Date().toISOString(),
    };

    const { error } = await supabase.from("complaints").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error(`Failed complaint ${c.complaint_number}:`, error.message);
    } else {
      compSuccess++;
    }
  }
  console.log(`✅ ${compSuccess} / ${complaints.length} complaints synced to Supabase!`);

  // 2. Sync Timeline
  const timeline = db.prepare("SELECT * FROM complaint_timeline").all();
  let timeSuccess = 0;
  for (const t of timeline) {
    const payload = {
      complaint_id: t.complaint_id,
      action: t.action,
      old_status: t.old_status || null,
      new_status: t.new_status || null,
      comment: t.comment || null,
      is_internal_only: Boolean(t.is_internal_only),
      performed_by: t.performed_by || "System",
      performed_by_role: t.performed_by_role || "User",
      created_at: t.created_at || new Date().toISOString(),
    };
    const { error } = await supabase.from("complaint_timeline").insert(payload);
    if (!error) timeSuccess++;
  }
  console.log(`✅ ${timeSuccess} / ${timeline.length} timeline logs synced!`);

  // 3. Sync Attachments & Upload Images to Supabase Storage Bucket!
  const attachments = db.prepare("SELECT * FROM attachments").all();
  console.log(`Found ${attachments.length} attachments in local SQLite.`);

  let attSuccess = 0;
  for (const a of attachments) {
    let fileBuffer = null;
    let localPath = a.stored_path;

    if (localPath && fs.existsSync(localPath)) {
      fileBuffer = fs.readFileSync(localPath);
    } else {
      const fallback = path.join(process.cwd(), "public", "uploads", a.complaint_id, path.basename(a.stored_path || a.file_name));
      if (fs.existsSync(fallback)) {
        fileBuffer = fs.readFileSync(fallback);
      }
    }

    let publicUrl = a.file_url;
    if (fileBuffer) {
      const storagePath = `${a.complaint_id}/${path.basename(a.stored_path || a.file_name)}`;
      const { error: upErr } = await supabase.storage.from("complaint-attachments").upload(storagePath, fileBuffer, {
        contentType: a.file_type || "image/jpeg",
        upsert: true,
      });

      if (!upErr) {
        const { data: urlData } = supabase.storage.from("complaint-attachments").getPublicUrl(storagePath);
        publicUrl = urlData?.publicUrl || publicUrl;
        console.log(`Uploaded ${a.file_name} to Supabase Storage: ${publicUrl}`);
      } else {
        console.warn(`Storage upload warning for ${a.file_name}:`, upErr.message);
      }
    }

    const { error: dbErr } = await supabase.from("attachments").upsert({
      id: a.id,
      complaint_id: a.complaint_id,
      file_name: a.file_name,
      stored_path: a.stored_path || "",
      file_url: publicUrl,
      file_type: a.file_type || "application/octet-stream",
      file_size: a.file_size || 0,
      attachment_category: a.attachment_category || "customer_evidence",
      uploaded_by: a.uploaded_by || "User",
      created_at: a.created_at || new Date().toISOString(),
    });

    if (!dbErr) {
      attSuccess++;
    } else {
      console.error(`Attachment insert failed:`, dbErr.message);
    }
  }
  console.log(`✅ ${attSuccess} / ${attachments.length} attachments synced!`);

  // 4. Sync QC Batch Reports
  const qcBatches = db.prepare("SELECT * FROM qc_batch_reports").all();
  let qcSuccess = 0;
  for (const q of qcBatches) {
    const { error } = await supabase.from("qc_batch_reports").upsert({
      batch_number: q.batch_number,
      product_name: q.product_name,
      viscosity: q.viscosity || "Standard",
      colour: q.colour || "Standard",
      solids: q.solids || "Standard",
      qc_status: q.qc_status || "Passed",
      manufacturing_date: q.manufacturing_date || null,
      expiry_date: q.expiry_date || null,
      tested_by: q.tested_by || "Dr. Chioma Okonkwo (QC)",
      testing_date: q.testing_date || new Date().toISOString().split("T")[0],
      remarks: q.remarks || null,
      created_at: q.created_at || new Date().toISOString(),
      updated_at: q.updated_at || new Date().toISOString(),
    }, { onConflict: "batch_number" });
    if (!error) qcSuccess++;
  }
  console.log(`✅ ${qcSuccess} / ${qcBatches.length} QC batch reports synced!`);

  console.log("=== SYNCHRONIZATION COMPLETE! ===");
}

main().catch(console.error);
