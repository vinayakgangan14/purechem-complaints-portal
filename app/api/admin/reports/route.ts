export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { calculateDuration, isComplaintOverdue } from "@/lib/timer/resolution";

export async function GET(req: NextRequest) {
  try {
    const { data: rows, error } = await supabase.from("complaints").select("*");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const complaints = rows || [];

    const totalComplaints = complaints.length;
    const openComplaints = complaints.filter((c: any) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
    const resolvedComplaints = complaints.filter((c: any) => c.status === "RESOLVED").length;
    const closedComplaints = complaints.filter((c: any) => c.status === "CLOSED").length;
    const underInvestigation = complaints.filter((c: any) =>
      ["INVESTIGATION", "SAMPLE REQUIRED", "UNDER TESTING", "ROOT CAUSE ANALYSIS"].includes(c.status)
    ).length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);
    const newToday = complaints.filter((c: any) => (c.created_at || "").startsWith(todayStr)).length;
    const newThisMonth = complaints.filter((c: any) => (c.created_at || "").startsWith(thisMonthStr)).length;

    let overdueCount = 0;
    const resolvedDurations: number[] = [];

    complaints.forEach((c: any) => {
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

    const productMap: Record<string, number> = {};
    complaints.forEach((c: any) => {
      const p = c.product_name || "Unspecified";
      productMap[p] = (productMap[p] || 0) + 1;
    });
    const productStats = Object.entries(productMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const categoryMap: Record<string, number> = {};
    complaints.forEach((c: any) => {
      const cat = c.product_category || "Adhesives";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryStats = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const typeMap: Record<string, number> = {};
    complaints.forEach((c: any) => {
      const t = c.complaint_type || "Other";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const typeStats = Object.entries(typeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const departmentMap: Record<string, { total: number; resolved: number }> = {};
    complaints.forEach((c: any) => {
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
      rate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
    }));

    const monthlyMap: Record<string, number> = {};
    complaints.forEach((c: any) => {
      const m = (c.created_at || "").slice(0, 7) || thisMonthStr;
      monthlyMap[m] = (monthlyMap[m] || 0) + 1;
    });
    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      kpis: {
        totalComplaints,
        openComplaints,
        resolvedComplaints,
        closedComplaints,
        underInvestigation,
        newToday,
        newThisMonth,
        overdueCount,
        avgResolutionHours: avgHours,
        maxResolutionHours: maxHours,
        minResolutionHours: minHours,
        resolutionRate: totalComplaints > 0 ? Math.round(((resolvedComplaints + closedComplaints) / totalComplaints) * 100) : 0,
      },
      productStats,
      categoryStats,
      typeStats,
      departmentStats,
      monthlyTrend,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
