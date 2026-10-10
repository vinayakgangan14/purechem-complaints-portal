export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const batch = searchParams.get("batch");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = "SELECT * FROM qc_batch_reports WHERE 1=1";
    const params: any[] = [];

    if (batch) {
      query += " AND (batch_number = ? OR batch_number LIKE ?)";
      params.push(batch, `%${batch}%`);
    }

    if (status && status !== "ALL") {
      query += " AND qc_status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (batch_number LIKE ? OR product_name LIKE ? OR remarks LIKE ? OR tested_by LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    query += " ORDER BY testing_date DESC, created_at DESC";

    const batches = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      batches,
      count: batches.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
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

    const stmt = db.prepare(`
      INSERT INTO qc_batch_reports (
        product_name, batch_number, viscosity, colour, solids, qc_status,
        manufacturing_date, expiry_date, tested_by, testing_date, remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(batch_number) DO UPDATE SET
        product_name = excluded.product_name,
        viscosity = excluded.viscosity,
        colour = excluded.colour,
        solids = excluded.solids,
        qc_status = excluded.qc_status,
        manufacturing_date = excluded.manufacturing_date,
        expiry_date = excluded.expiry_date,
        tested_by = excluded.tested_by,
        testing_date = excluded.testing_date,
        remarks = excluded.remarks,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      product_name.trim(),
      cleanBatch,
      viscosity?.trim() || "Standard",
      colour?.trim() || "Standard",
      solids?.trim() || "Standard",
      qc_status || "Passed",
      manufacturing_date || null,
      expiry_date || null,
      tested_by?.trim() || "Dr. Chioma Okonkwo (QC)",
      testDate,
      remarks?.trim() || "Daily factory test verified.",
      now,
      now
    );

    const saved = db.prepare("SELECT * FROM qc_batch_reports WHERE batch_number = ?").get(cleanBatch);

    // Dual-write to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("qc_batch_reports").upsert({
          product_name: product_name.trim(),
          batch_number: cleanBatch,
          viscosity: viscosity?.trim() || "Standard",
          colour: colour?.trim() || "Standard",
          solids: solids?.trim() || "Standard",
          qc_status: qc_status || "Passed",
          manufacturing_date: manufacturing_date || null,
          expiry_date: expiry_date || null,
          tested_by: tested_by?.trim() || "Dr. Chioma Okonkwo (QC)",
          testing_date: testDate,
          remarks: remarks?.trim() || "Daily factory test verified.",
        }, { onConflict: "batch_number" });
      } catch (sbErr: any) {
        console.warn("Supabase QC dual-write:", sbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `QC test report for batch ${cleanBatch} logged successfully.`,
      batch: saved,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
