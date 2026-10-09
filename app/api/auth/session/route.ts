import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

    const db = getDb();
    let user = null;
    if (email) {
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }

    // If no user found or user's role does not match the active role cookie, find staff member for that role
    if (!user || user.role !== role) {
      user = db.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").get(role);
    }

    if (!user) {
      // Default fallback
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

    const db = getDb();
    const effectiveRole = role || "customer";
    let targetEmail = email;

    // If switching role without explicit email, use the standard staff email for that role
    if (!targetEmail && effectiveRole && ROLE_DEFAULT_EMAILS[effectiveRole]) {
      targetEmail = ROLE_DEFAULT_EMAILS[effectiveRole];
    }

    let existingUser = targetEmail ? db.prepare("SELECT * FROM users WHERE email = ?").get(targetEmail) : null;

    if (!existingUser && targetEmail) {
      const id = `USR-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, name, email, phone, company, role, customer_type, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        name || (effectiveRole === "customer" ? "Customer" : `${effectiveRole} Staff`),
        targetEmail,
        phone || "+234",
        company || "Purechem",
        effectiveRole,
        customer_type || "Customer",
        now,
        now
      );
      existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    } else if (existingUser && role) {
      existingUser.role = role;
    }

    if (!existingUser) {
      existingUser = db.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").get(effectiveRole);
    }

    const response = NextResponse.json({ success: true, user: existingUser });
    response.cookies.set("pcm_role", effectiveRole, { path: "/" });
    if (existingUser?.email) {
      response.cookies.set("pcm_email", existingUser.email, { path: "/" });
    } else if (targetEmail) {
      response.cookies.set("pcm_email", targetEmail, { path: "/" });
    }
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

