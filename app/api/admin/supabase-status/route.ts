import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Check local database counts as baseline
    let localComplaintsCount = 0;
    let localQcCount = 0;
    try {
      const db = getDb();
      const compRow = db.prepare("SELECT COUNT(*) as c FROM complaints").get() as any;
      const qcRow = db.prepare("SELECT COUNT(*) as c FROM qc_batch_reports").get() as any;
      localComplaintsCount = compRow?.c || 0;
      localQcCount = qcRow?.c || 0;
    } catch (e: any) {
      console.warn("Local SQLite read:", e.message);
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: "Supabase environment variables are not yet configured in this deployment.",
        instructions: {
          step1: "Create a project on https://supabase.com",
          step2: "Go to Project Settings -> API in your Supabase dashboard.",
          step3: "Copy Project URL, anon public key, and service_role secret key.",
          step4: "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to your Vercel or Render Environment Variables.",
          step5: "Run the schema SQL in your Supabase SQL Editor from supabase-schema.sql in the project root.",
        },
        envStatus: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "Set" : "Missing",
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? "Set" : "Missing",
        },
        localDatabase: {
          status: "Active (Local SQLite)",
          complaints_recorded: localComplaintsCount,
          qc_batches_recorded: localQcCount,
        },
      });
    }

    // Test real connection to Supabase
    const { data: compData, error: compErr } = await supabase
      .from("complaints")
      .select("id", { count: "exact", head: true });

    const { data: qcData, error: qcErr } = await supabase
      .from("qc_batch_reports")
      .select("id", { count: "exact", head: true });

    if (compErr) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        error: compErr.message,
        message:
          compErr.code === "PGRST205" || compErr.message.includes("does not exist")
            ? "Connected to Supabase, but the tables have not been created yet. Please execute supabase-schema.sql in your Supabase SQL Editor."
            : "Failed to connect to Supabase database: " + compErr.message,
        envStatus: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "Set" : "Missing",
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? "Set" : "Missing",
        },
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      message: "Supabase Cloud Database is actively connected and collecting data!",
      dataCollection: {
        complaints_in_supabase: compData?.length ?? 0,
        qc_batches_in_supabase: qcData?.length ?? 0,
        local_complaints: localComplaintsCount,
        local_qc_batches: localQcCount,
      },
      supabaseUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
