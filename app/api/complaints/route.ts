import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateDuration, isComplaintOverdue, SLA_TARGETS } from "@/lib/timer/resolution";
import { sendNotificationEmail } from "@/lib/email/dispatcher";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase";

// Generate unique Complaint ID: PCM-NG-YYYYMMDD-XXXX
function generateComplaintNumber(db: any): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePrefix = `PCM-NG-${year}${month}${day}`;

  // Count existing complaints created today
  const row = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE complaint_number LIKE ?").get(`${datePrefix}%`) as { count: number };
  const sequence = String((row?.count || 0) + 1).padStart(4, "0");
  return `${datePrefix}-${sequence}`;
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const priority = searchParams.get("priority") || "";
    const product = searchParams.get("product") || "";
    const customerEmail = searchParams.get("customer_email") || "";
    const customerPhone = searchParams.get("customer_phone") || "";
    const overdueOnly = searchParams.get("overdue") === "true";
    const batchNumber = searchParams.get("batch") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM complaints WHERE 1=1";
    const params: any[] = [];

    if (search) {
      query += ` AND (complaint_number LIKE ? OR customer_name LIKE ? OR customer_company LIKE ? OR product_name LIKE ? OR batch_number LIKE ? OR description LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    if (category) {
      query += " AND product_category = ?";
      params.push(category);
    }

    if (priority) {
      query += " AND (customer_priority = ? OR admin_priority = ?)";
      params.push(priority, priority);
    }

    if (product) {
      query += " AND product_name LIKE ?";
      params.push(`%${product}%`);
    }

    if (batchNumber) {
      query += " AND batch_number LIKE ?";
      params.push(`%${batchNumber}%`);
    }

    // Role-based scoping for customer portal
    if (customerEmail && customerPhone) {
      query += " AND (customer_email = ? OR customer_phone = ?)";
      params.push(customerEmail, customerPhone);
    } else if (customerEmail) {
      query += " AND customer_email = ?";
      params.push(customerEmail);
    } else if (customerPhone) {
      query += " AND customer_phone = ?";
      params.push(customerPhone);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    // Calculate live timer durations & overdue states dynamically
    const complaints = rows.map((c) => {
      const isResolvedOrClosed = c.status === "RESOLVED" || c.status === "CLOSED";
      const duration = isResolvedOrClosed
        ? calculateDuration(c.complaint_open_time, c.resolved_at || c.closed_at || c.updated_at)
        : calculateDuration(c.complaint_open_time, new Date());

      const overdue = isComplaintOverdue(
        c.complaint_open_time,
        c.target_resolution_hours || 72,
        c.status,
        c.resolved_at
      );

      return {
        ...c,
        live_duration: duration,
        is_overdue: overdue ? 1 : 0,
      };
    });

    const filtered = overdueOnly ? complaints.filter((c) => c.is_overdue === 1) : complaints;

    // Total count query for pagination
    let countQuery = "SELECT COUNT(*) as total FROM complaints WHERE 1=1";
    const countParams = params.slice(0, params.length - 2); // omit limit and offset
    const totalRow = db.prepare(countQuery).get() as { total: number };

    return NextResponse.json({
      success: true,
      complaints: filtered,
      pagination: {
        page,
        limit,
        total: totalRow?.total || 0,
        pages: Math.ceil((totalRow?.total || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      customer_company,
      customer_email,
      customer_phone,
      customer_type,
      raised_by_role,
      raised_by_name,
      product_name,
      product_category,
      product_code,
      batch_number,
      manufacturing_date,
      expiry_date,
      pack_size,
      quantity_purchased,
      invoice_number,
      purchase_date,
      complaint_type,
      customer_priority,
      description,
    } = body;

    // Strict validation
    if (!customer_name || !customer_email || !customer_phone || !product_name || !complaint_type || !description) {
      return NextResponse.json(
        { success: false, error: "Please fill all required complaint fields." },
        { status: 400 }
      );
    }

    const db = getDb();
    const complaintId = `CMP-${Date.now().toString(36).toUpperCase()}`;
    const complaintNumber = generateComplaintNumber(db);
    const now = new Date().toISOString();

    const priority = customer_priority === "Urgent" ? "Urgent" : "Normal";
    const targetHours = priority === "Urgent" ? SLA_TARGETS.Urgent : SLA_TARGETS.Normal;

    db.prepare(`
      INSERT INTO complaints (
        id, complaint_number, customer_name, customer_company, customer_email, customer_phone, customer_type,
        raised_by_role, raised_by_name, product_name, product_category, product_code, batch_number,
        manufacturing_date, expiry_date, pack_size, quantity_purchased, invoice_number, purchase_date,
        complaint_type, customer_priority, admin_priority, description, status,
        complaint_open_time, target_resolution_hours, is_overdue, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, 'Medium', ?, 'OPEN',
        ?, ?, 0, ?, ?
      )
    `).run(
      complaintId,
      complaintNumber,
      customer_name.trim(),
      customer_company ? customer_company.trim() : "",
      customer_email.trim(),
      customer_phone.trim(),
      customer_type || "Customer",
      raised_by_role || "Customer",
      raised_by_name || customer_name.trim(),
      product_name.trim(),
      product_category || "Adhesives",
      product_code || "",
      batch_number ? batch_number.trim() : "",
      manufacturing_date || "",
      expiry_date || "",
      pack_size || "",
      quantity_purchased || "",
      invoice_number || "",
      purchase_date || "",
      complaint_type,
      priority,
      description.trim(),
      now, // Server-side timestamp ONLY
      targetHours,
      now,
      now
    );

    // Initial timeline entry
    const creatorLabel = raised_by_role === "Sales" ? `Sales Representative (${raised_by_name || "Sales"})` : customer_name;
    db.prepare(`
      INSERT INTO complaint_timeline (
        complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at
      ) VALUES (?, 'Complaint Registered', NULL, 'OPEN', ?, 0, ?, ?, ?)
    `).run(
      complaintId,
      `Complaint ${complaintNumber} registered into Purechem Quality System.`,
      creatorLabel,
      raised_by_role || "Customer",
      now
    );

    // Automated Email Dispatching
    sendNotificationEmail({
      complaintId,
      complaintNumber,
      recipientEmail: customer_email.trim(),
      recipientName: customer_name.trim(),
      type: "REGISTRATION",
      data: {
        customerName: customer_name.trim(),
        companyName: customer_company || "",
        productName: product_name.trim(),
        batchNumber: batch_number || "",
        status: "OPEN",
        complaintDate: now,
      },
    });

    // Dual-write to Supabase Cloud if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("complaints").insert({
          id: complaintId,
          complaint_number: complaintNumber,
          customer_name: customer_name.trim(),
          customer_company: customer_company ? customer_company.trim() : "",
          customer_email: customer_email.trim(),
          customer_phone: customer_phone.trim(),
          customer_type: customer_type || "Customer",
          raised_by_role: raised_by_role || "Customer",
          raised_by_name: raised_by_name || customer_name.trim(),
          product_name: product_name.trim(),
          product_category: product_category || "Adhesives",
          product_code: product_code || "",
          batch_number: batch_number ? batch_number.trim() : "",
          manufacturing_date: manufacturing_date || null,
          expiry_date: expiry_date || null,
          pack_size: pack_size || "",
          quantity_purchased: quantity_purchased || "",
          invoice_number: invoice_number || "",
          purchase_date: purchase_date || null,
          complaint_type,
          customer_priority: priority,
          admin_priority: "Medium",
          description: description.trim(),
          status: "OPEN",
          complaint_open_time: now,
          target_resolution_hours: targetHours,
          is_overdue: false,
        });

        await supabase.from("complaint_timeline").insert({
          complaint_id: complaintId,
          action: "Complaint Registered",
          old_status: null,
          new_status: "OPEN",
          comment: `Complaint ${complaintNumber} registered into Purechem Quality System.`,
          is_internal_only: false,
          performed_by: creatorLabel,
          performed_by_role: raised_by_role || "Customer",
        });
      } catch (sbErr: any) {
        console.warn("Supabase dual-write log:", sbErr.message);
      }
    }

    const newRecord = db.prepare("SELECT * FROM complaints WHERE id = ?").get(complaintId);

    return NextResponse.json({
      success: true,
      message: "Complaint successfully registered",
      complaint: newRecord,
      complaint_number: complaintNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
