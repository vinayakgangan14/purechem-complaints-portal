export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const [settingsRes, catRes, prodRes, typesRes, notifRes, usersRes, auditRes] = await Promise.all([
      supabase.from("system_settings").select("key, value"),
      supabase.from("product_categories").select("*").order("name", { ascending: true }),
      supabase.from("products").select("*").order("product_name", { ascending: true }),
      supabase.from("complaint_types").select("*").order("name", { ascending: true }),
      supabase.from("notifications").select("*").order("sent_at", { ascending: false }).limit(50),
      supabase.from("users").select("id, name, email, phone, company, role, customer_type").order("role", { ascending: false }),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const settings: Record<string, string> = {};
    if (settingsRes.data) {
      settingsRes.data.forEach((r: any) => {
        settings[r.key] = r.value;
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      categories: catRes.data || [],
      products: prodRes.data || [],
      complaintTypes: typesRes.data || [],
      notifications: notifRes.data || [],
      users: usersRes.data || [],
      auditLogs: auditRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const now = new Date().toISOString();

    if (action === "update_settings") {
      for (const [k, v] of Object.entries(payload)) {
        await supabase.from("system_settings").upsert({
          key: k,
          value: String(v),
          updated_at: now,
        }, { onConflict: "key" });
      }
      return NextResponse.json({ success: true, message: "Settings updated successfully" });
    }

    if (action === "add_product") {
      const { product_code, product_name, category_name, pack_size, application, description } = payload;
      const { error } = await supabase.from("products").insert({
        product_code,
        product_name,
        category_name,
        pack_size: pack_size || "",
        application: application || "",
        description: description || "",
        active: true,
        created_at: now,
      });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Product added to master database" });
    }

    if (action === "add_category") {
      const { name, description } = payload;
      const { error } = await supabase.from("product_categories").insert({
        name,
        code: name.toUpperCase().replace(/\s+/g, "_"),
        description: description || "",
        active: true,
        created_at: now,
      });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Product category added" });
    }

    if (action === "add_complaint_type") {
      const { name, description } = payload;
      const { error } = await supabase.from("complaint_types").insert({
        name,
        description: description || "",
        active: true,
        created_at: now,
      });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Complaint type added" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
