export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchBatch = searchParams.get("batch") || "";

    const { data: rows, error } = await supabase
      .from("complaints")
      .select("*")
      .not("batch_number", "is", null);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const validRows = (rows || []).filter((r: any) => r.batch_number && r.batch_number.trim() !== "");

    // Group complaints by Batch Number & Product Name
    const map: Record<string, {
      batch_number: string;
      product_name: string;
      product_category: string;
      total_complaints: number;
      distinct_customers: Set<string>;
      latest_complaint_date: string;
      first_complaint_date: string;
    }> = {};

    validRows.forEach((r: any) => {
      const key = `${r.batch_number}__${r.product_name}`;
      if (!map[key]) {
        map[key] = {
          batch_number: r.batch_number,
          product_name: r.product_name,
          product_category: r.product_category || "Adhesives",
          total_complaints: 0,
          distinct_customers: new Set<string>(),
          latest_complaint_date: r.created_at,
          first_complaint_date: r.created_at,
        };
      }
      map[key].total_complaints++;
      if (r.customer_email) map[key].distinct_customers.add(r.customer_email);
      if (new Date(r.created_at) > new Date(map[key].latest_complaint_date)) {
        map[key].latest_complaint_date = r.created_at;
      }
      if (new Date(r.created_at) < new Date(map[key].first_complaint_date)) {
        map[key].first_complaint_date = r.created_at;
      }
    });

    const batchAggregates = Object.values(map)
      .map((b) => ({
        batch_number: b.batch_number,
        product_name: b.product_name,
        product_category: b.product_category,
        total_complaints: b.total_complaints,
        distinct_customers: b.distinct_customers.size,
        latest_complaint_date: b.latest_complaint_date,
        first_complaint_date: b.first_complaint_date,
      }))
      .sort((a, b) => b.total_complaints - a.total_complaints);

    const recurringAlerts = batchAggregates
      .filter((b) => b.total_complaints >= 2)
      .map((b) => ({
        batch_number: b.batch_number,
        product_name: b.product_name,
        total_complaints: b.total_complaints,
        distinct_customers: b.distinct_customers,
        message: `POTENTIAL RECURRING ISSUE: ${b.total_complaints} complaints received for ${b.product_name} (Batch ${b.batch_number}) across ${b.distinct_customers} customer accounts.`,
        level: b.total_complaints >= 3 ? "CRITICAL" : "WARNING",
      }));

    let specificTrace: any[] = [];
    let qcReport: any = null;

    if (searchBatch) {
      const cleanSearch = searchBatch.trim();
      const { data: trace } = await supabase
        .from("complaints")
        .select("*")
        .ilike("batch_number", `%${cleanSearch}%`)
        .order("created_at", { ascending: false });

      specificTrace = trace || [];

      const { data: qc } = await supabase
        .from("qc_batch_reports")
        .select("*")
        .or(`batch_number.eq.${cleanSearch},batch_number.ilike.%${cleanSearch}%`)
        .maybeSingle();

      qcReport = qc;
    }

    return NextResponse.json({
      success: true,
      batchAggregates,
      recurringAlerts,
      specificTrace,
      qcReport,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
