export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, syncAllLocalDataToSupabase } from "@/lib/db/supabase";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Check local database counts as baseline
    let localComplaintsCount = 0;
    let localQcCount = 0;
    let localAttachmentsCount = 0;
    try {
      const db = getDb();
      const compRow = db.prepare("SELECT COUNT(*) as c FROM complaints").get() as any;
      const qcRow = db.prepare("SELECT COUNT(*) as c FROM qc_batch_reports").get() as any;
      const attRow = db.prepare("SELECT COUNT(*) as c FROM attachments").get() as any;
      localComplaintsCount = compRow?.c || 0;
      localQcCount = qcRow?.c || 0;
      localAttachmentsCount = attRow?.c || 0;
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
          step4: "Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to your .env.local file or Vercel / Render Environment Variables.",
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
          attachments_recorded: localAttachmentsCount,
        },
      });
    }

    // Test real connection to Supabase with 4s timeout
    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), 4000)
    );

    const testQuery = async () => {
      try {
        const [compRes, qcRes, attRes] = await Promise.all([
          supabase.from("complaints").select("*", { count: "exact", head: true }),
          supabase.from("qc_batch_reports").select("*", { count: "exact", head: true }),
          supabase.from("attachments").select("*", { count: "exact", head: true }),
        ]);
        return { isTimeout: false, compRes, qcRes, attRes };
      } catch (err: any) {
        return { isTimeout: false, error: err.message };
      }
    };

    const outcome = await Promise.race([testQuery(), timeoutPromise]);

    if (outcome.isTimeout) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        error: "Supabase connection timed out after 4 seconds.",
        message: "Could not reach Supabase endpoint within 4 seconds. Please verify your Project URL.",
        envStatus: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "Set" : "Missing",
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? "Set" : "Missing",
        },
      });
    }

    const { compRes, qcRes, attRes, error: fetchErr } = outcome as any;

    if (fetchErr) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        error: fetchErr,
        message: "Failed to connect to Supabase: " + fetchErr,
        envStatus: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnonKey ? "Set" : "Missing",
          SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? "Set" : "Missing",
        },
      });
    }

    const compCount = compRes?.count;
    const compErr = compRes?.error;
    const qcCount = qcRes?.count;
    const attCount = attRes?.count;

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
        complaints_in_supabase: compCount ?? 0,
        qc_batches_in_supabase: qcCount ?? 0,
        attachments_in_supabase: attCount ?? 0,
        local_complaints: localComplaintsCount,
        local_qc_batches: localQcCount,
        local_attachments: localAttachmentsCount,
      },
      supabaseUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.",
        },
        { status: 400 }
      );
    }

    const result = await syncAllLocalDataToSupabase(getDb);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Successfully synchronized ${result.complaintsSynced} complaints, ${result.attachmentsSynced} attachments, ${result.timelineSynced} timeline logs, and ${result.qcBatchesSynced} QC batches to Supabase!`
        : "Sync completed with warnings.",
      details: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
