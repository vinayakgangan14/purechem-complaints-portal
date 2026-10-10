export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { calculateDuration, isComplaintOverdue, SLA_TARGETS } from "@/lib/timer/resolution";
import { sendNotificationEmail } from "@/lib/email/dispatcher";

export async function GET(req: NextRequest) {
  try {
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

    let query = supabase.from("complaints").select("*", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (category) query = query.eq("product_category", category);
    if (priority) query = query.or(`customer_priority.eq.${priority},admin_priority.eq.${priority}`);
    if (product) query = query.ilike("product_name", `%${product}%`);
    if (batchNumber) query = query.ilike("batch_number", `%${batchNumber}%`);

    if (customerEmail && customerPhone) {
      query = query.or(`customer_email.eq.${customerEmail},customer_phone.eq.${customerPhone}`);
    } else if (customerEmail) {
      query = query.eq("customer_email", customerEmail);
    } else if (customerPhone) {
      query = query.eq("customer_phone", customerPhone);
    }

    if (search) {
      query = query.or(`complaint_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_company.ilike.%${search}%,product_name.ilike.%${search}%,batch_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false });

    const { data: rows, count, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const complaints = (rows || []).map((c: any) => {
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

    const filtered = overdueOnly ? complaints.filter((c: any) => c.is_overdue === 1) : complaints;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      complaints: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
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

    if (!customer_name || !customer_email || !customer_phone || !product_name || !complaint_type || !description) {
      return NextResponse.json(
        { success: false, error: "Please fill all required complaint fields." },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `PCM-NG-${year}${month}${day}`;

    const { count } = await supabase
      .from("complaints")
      .select("id", { count: "exact", head: true })
      .like("complaint_number", `${datePrefix}%`);

    const sequence = String((count || 0) + 1).padStart(4, "0");
    const complaintNumber = `${datePrefix}-${sequence}`;
    const complaintId = `CMP-${Date.now().toString(36).toUpperCase()}`;
    const nowIso = now.toISOString();

    const priority = customer_priority === "Urgent" ? "Urgent" : "Normal";
    const targetHours = priority === "Urgent" ? SLA_TARGETS.Urgent : SLA_TARGETS.Normal;

    const newRecord = {
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
      complaint_open_time: nowIso,
      target_resolution_hours: targetHours,
      is_overdue: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { error: insErr } = await supabase.from("complaints").insert(newRecord);
    if (insErr) {
      return NextResponse.json({ success: false, error: insErr.message }, { status: 500 });
    }

    const creatorLabel = raised_by_role === "Sales" ? `Sales Representative (${raised_by_name || "Sales"})` : customer_name;
    await supabase.from("complaint_timeline").insert({
      complaint_id: complaintId,
      action: "Complaint Registered",
      old_status: null,
      new_status: "OPEN",
      comment: `Complaint ${complaintNumber} registered into Purechem Quality System.`,
      is_internal_only: false,
      performed_by: creatorLabel,
      performed_by_role: raised_by_role || "Customer",
      created_at: nowIso,
    });

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
        complaintDate: nowIso,
      },
    }).catch((e) => console.warn("Email warning:", e.message));

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
