export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

const ROLE_DEFAULT_EMAILS: Record<string, string> = {
  super_admin: "admin@purechemmanufacturing.com",
  quality_manager: "quality@purechemmanufacturing.com",
  customer_service: "cs@purechemmanufacturing.com",
  sales: "sales@purechemmanufacturing.com",
  management: "management@purechemmanufacturing.com",
  customer: "adebayo@ikejawood.com",
};

export async function GET(req: NextRequest) {
  try {
    const role = req.cookies.get("pcm_role")?.value || "customer";
    const email = req.cookies.get("pcm_email")?.value;

    let user = null;
    if (email) {
      const { data } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
      user = data;
    }

    if (!user || user.role !== role) {
      const { data } = await supabase.from("users").select("*").eq("role", role).limit(1).maybeSingle();
      user = data;
    }

    if (!user) {
      user = {
        id: "USR-GUEST",
        name: "Guest User",
        email: ROLE_DEFAULT_EMAILS[role] || "guest@purechem.ng",
        phone: "+2348000000000",
        company: "Independent Customer",
        role: role,
        customer_type: "Customer",
      };
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role, name, phone, company, customer_type } = body;

    const effectiveRole = role || "customer";
    let targetEmail = email;

    if (!targetEmail) {
      targetEmail = ROLE_DEFAULT_EMAILS[effectiveRole] || "guest@purechem.ng";
    }

    let { data: user } = await supabase.from("users").select("*").eq("email", targetEmail).maybeSingle();

    if (!user) {
      const now = new Date().toISOString();
      const newUserId = `USR-${Date.now().toString(36).toUpperCase()}`;
      const newUser = {
        id: newUserId,
        name: name || (effectiveRole === "customer" ? "Customer User" : "Staff Member"),
        email: targetEmail,
        phone: phone || "+2348000000000",
        company: company || (effectiveRole === "customer" ? "Direct Client" : "Purechem Ltd"),
        role: effectiveRole,
        customer_type: customer_type || (effectiveRole === "customer" ? "Customer" : "Staff"),
        created_at: now,
        updated_at: now,
      };

      await supabase.from("users").insert(newUser);
      user = newUser;
    }

    const res = NextResponse.json({ success: true, user });
    res.cookies.set("pcm_role", user.role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    res.cookies.set("pcm_email", user.email, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
