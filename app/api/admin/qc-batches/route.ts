export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = supabase.from("qc_batch_reports").select("*");

    if (batch) {
      query = query.or(`batch_number.eq.${batch},batch_number.ilike.%${batch}%`);
    }

    if (status && status !== "ALL") {
      query = query.eq("qc_status", status);
    }

    if (search) {
      query = query.or(`batch_number.ilike.%${search}%,product_name.ilike.%${search}%,remarks.ilike.%${search}%,tested_by.ilike.%${search}%`);
    }

    const { data: batches, error } = await query.order("testing_date", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      batches: batches || [],
      count: batches?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      product_name,
      batch_number,
      viscosity,
      colour,
      solids,
      qc_status,
      manufacturing_date,
      expiry_date,
      tested_by,
      testing_date,
      remarks,
    } = body;

    if (!product_name || !product_name.trim()) {
      return NextResponse.json({ success: false, error: "Product name is required." }, { status: 400 });
    }
    if (!batch_number || !batch_number.trim()) {
      return NextResponse.json({ success: false, error: "Batch number is required." }, { status: 400 });
    }

    const cleanBatch = batch_number.trim().toUpperCase();
    const now = new Date().toISOString();
    const testDate = testing_date || now.split("T")[0];

    const payload = {
      product_name: product_name.trim(),
      batch_number: cleanBatch,
      viscosity: viscosity || "Standard",
      colour: colour || "Standard",
      solids: solids || "Standard",
      qc_status: qc_status || "Passed",
      manufacturing_date: manufacturing_date || null,
      expiry_date: expiry_date || null,
      tested_by: tested_by || "Dr. Chioma Okonkwo (QC)",
      testing_date: testDate,
      remarks: remarks || "",
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("qc_batch_reports").upsert(payload, { onConflict: "batch_number" });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `QC Batch Report for ${cleanBatch} saved successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
