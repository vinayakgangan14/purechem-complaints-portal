import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const role = req.cookies.get("pcm_role")?.value || "customer";
    const email = req.cookies.get("pcm_email")?.value;

    const db = getDb();
    let user = null;
    if (email) {
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }

    if (!user) {
      // Default fallback by role
      user = db.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").get(role) || {
        id: "USR-GUEST",
        name: "Guest User",
        email: "guest@purechem.ng",
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
    let existingUser = email ? db.prepare("SELECT * FROM users WHERE email = ?").get(email) : null;

    if (!existingUser && email) {
      const id = `USR-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, name, email, phone, company, role, customer_type, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        name || "New Customer",
        email,
        phone || "+234",
        company || "Independent",
        role || "customer",
        customer_type || "Customer",
        now,
        now
      );
      existingUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    } else if (existingUser && role) {
      // If switching role
      existingUser.role = role;
    }

    const response = NextResponse.json({ success: true, user: existingUser });
    response.cookies.set("pcm_role", role || existingUser?.role || "customer", { path: "/" });
    if (email) {
      response.cookies.set("pcm_email", email, { path: "/" });
    }
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
