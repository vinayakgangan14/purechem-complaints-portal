import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateDuration, isComplaintOverdue } from "@/lib/timer/resolution";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const complaints = db.prepare("SELECT * FROM complaints").all() as any[];

    // 1. KPI Cards
    const totalComplaints = complaints.length;
    const openComplaints = complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
    const resolvedComplaints = complaints.filter((c) => c.status === "RESOLVED").length;
    const closedComplaints = complaints.filter((c) => c.status === "CLOSED").length;
    const underInvestigation = complaints.filter((c) =>
      ["INVESTIGATION", "SAMPLE REQUIRED", "UNDER TESTING", "ROOT CAUSE ANALYSIS"].includes(c.status)
    ).length;

    // Today & this month
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);
    const newToday = complaints.filter((c) => c.created_at.startsWith(todayStr)).length;
    const newThisMonth = complaints.filter((c) => c.created_at.startsWith(thisMonthStr)).length;

    // Overdue count
    let overdueCount = 0;
    const resolvedDurations: number[] = [];

    complaints.forEach((c) => {
      const isOverdue = isComplaintOverdue(
        c.complaint_open_time,
        c.target_resolution_hours || 72,
        c.status,
        c.resolved_at
      );
      if (isOverdue && c.status !== "RESOLVED" && c.status !== "CLOSED") {
        overdueCount++;
      }

      if (c.total_resolution_minutes) {
        resolvedDurations.push(c.total_resolution_minutes);
      }
    });

    const avgResolutionMinutes =
      resolvedDurations.length > 0
        ? Math.round(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length)
        : 0;
    const maxResolutionMinutes = resolvedDurations.length > 0 ? Math.max(...resolvedDurations) : 0;
    const minResolutionMinutes = resolvedDurations.length > 0 ? Math.min(...resolvedDurations) : 0;

    const avgHours = (avgResolutionMinutes / 60).toFixed(1);
    const maxHours = (maxResolutionMinutes / 60).toFixed(1);
    const minHours = (minResolutionMinutes / 60).toFixed(1);

    // 2. Breakdown by Product
    const productMap: Record<string, number> = {};
    complaints.forEach((c) => {
      productMap[c.product_name] = (productMap[c.product_name] || 0) + 1;
    });
    const productStats = Object.entries(productMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Breakdown by Category
    const categoryMap: Record<string, number> = {};
    complaints.forEach((c) => {
      categoryMap[c.product_category] = (categoryMap[c.product_category] || 0) + 1;
    });
    const categoryStats = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Breakdown by Complaint Type
    const typeMap: Record<string, number> = {};
    complaints.forEach((c) => {
      typeMap[c.complaint_type] = (typeMap[c.complaint_type] || 0) + 1;
    });
    const typeStats = Object.entries(typeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 5. Department Performance
    const departmentMap: Record<string, { total: number; resolved: number }> = {};
    complaints.forEach((c) => {
      const dept = c.assigned_department || "Unassigned";
      if (!departmentMap[dept]) departmentMap[dept] = { total: 0, resolved: 0 };
      departmentMap[dept].total++;
      if (c.status === "RESOLVED" || c.status === "CLOSED") {
        departmentMap[dept].resolved++;
      }
    });

    const departmentStats = Object.entries(departmentMap).map(([dept, data]) => ({
      department: dept,
      total: data.total,
      resolved: data.resolved,
      rate: Math.round((data.resolved / data.total) * 100),
    }));

    // 6. Monthly Trend (last 6 months)
    const monthMap: Record<string, number> = {};
    complaints.forEach((c) => {
      const m = c.created_at.slice(0, 7);
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    const monthlyStats = Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      kpis: {
        totalComplaints,
        openComplaints,
        newToday,
        newThisMonth,
        underInvestigation,
        overdueComplaints: overdueCount,
        resolvedComplaints,
        closedComplaints,
        avgResolutionHours: `${avgHours} hrs`,
        maxResolutionHours: `${maxHours} hrs`,
        minResolutionHours: `${minHours} hrs`,
      },
      productStats,
      categoryStats,
      typeStats,
      departmentStats,
      monthlyStats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
