import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { formatWAT } from "@/lib/timer/resolution";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const searchBatch = searchParams.get("batch") || "";

    // 1. Group complaints by Batch Number where batch is not null or empty
    const batchAggregates = db.prepare(`
      SELECT 
        batch_number,
        product_name,
        product_category,
        COUNT(*) as total_complaints,
        COUNT(DISTINCT customer_email) as distinct_customers,
        MAX(created_at) as latest_complaint_date,
        MIN(created_at) as first_complaint_date
      FROM complaints
      WHERE batch_number IS NOT NULL AND TRIM(batch_number) != ''
      GROUP BY batch_number, product_name
      ORDER BY total_complaints DESC
    `).all() as any[];

    // 2. Identify Potential Recurring Issues (>= 2 complaints for same batch)
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

    // 3. If specific batch is requested, return full trace history
    let specificTrace: any[] = [];
    if (searchBatch) {
      specificTrace = db.prepare(`
        SELECT * FROM complaints 
        WHERE batch_number LIKE ? 
        ORDER BY created_at DESC
      `).all(`%${searchBatch}%`) as any[];
    }

    return NextResponse.json({
      success: true,
      batchAggregates,
      recurringAlerts,
      specificTrace,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
