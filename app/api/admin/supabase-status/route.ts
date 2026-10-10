export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseUrl } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const [compRes, attRes, qcRes, tlRes] = await Promise.all([
      supabase.from("complaints").select("id", { count: "exact", head: true }),
      supabase.from("attachments").select("id", { count: "exact", head: true }),
      supabase.from("qc_batch_reports").select("id", { count: "exact", head: true }),
      supabase.from("complaint_timeline").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      success: true,
      connected: true,
      configured: true,
      message: "Purechem Portal is connected directly to Supabase Cloud PostgreSQL.",
      complaints_in_supabase: compRes.count || 0,
      attachments_in_supabase: attRes.count || 0,
      qc_batches_in_supabase: qcRes.count || 0,
      timeline_in_supabase: tlRes.count || 0,
      supabaseUrl,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message,
    }, { status: 500 });
  }
}
