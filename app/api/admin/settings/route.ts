import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // 1. System Settings
    const settingsRows = db.prepare("SELECT key, value FROM system_settings").all() as any[];
    const settings: Record<string, string> = {};
    settingsRows.forEach((r) => {
      settings[r.key] = r.value;
    });

    // 2. Categories
    const categories = db.prepare("SELECT * FROM product_categories ORDER BY name ASC").all();

    // 3. Products
    const products = db.prepare("SELECT * FROM products ORDER BY product_name ASC").all();

    // 4. Complaint Types
    const complaintTypes = db.prepare("SELECT * FROM complaint_types ORDER BY name ASC").all();

    // 5. Notifications Outbox log (last 50)
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY sent_at DESC LIMIT 50").all();

    // 6. Users list
    const users = db.prepare("SELECT id, name, email, phone, company, role, customer_type FROM users ORDER BY role DESC").all();

    // 7. Audit logs (last 50)
    const auditLogs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50").all();

    return NextResponse.json({
      success: true,
      settings,
      categories,
      products,
      complaintTypes,
      notifications,
      users,
      auditLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { action, payload } = body;
    const now = new Date().toISOString();

    if (action === "update_settings") {
      const updateStmt = db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)");
      for (const [k, v] of Object.entries(payload)) {
        updateStmt.run(k, String(v), now);
      }
      return NextResponse.json({ success: true, message: "Settings updated successfully" });
    }

    if (action === "add_product") {
      const { product_code, product_name, category_name, pack_size, application, description } = payload;
      db.prepare(`
        INSERT INTO products (product_code, product_name, category_name, pack_size, application, description, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(product_code, product_name, category_name, pack_size || "", application || "", description || "", now);
      return NextResponse.json({ success: true, message: "Product added to master database" });
    }

    if (action === "add_category") {
      const { name, description } = payload;
      db.prepare(`
        INSERT INTO product_categories (name, code, description, active, created_at)
        VALUES (?, ?, ?, 1, ?)
      `).run(name, name.toUpperCase().replace(/\s+/g, "_"), description || "", now);
      return NextResponse.json({ success: true, message: "Product category added" });
    }

    if (action === "add_complaint_type") {
      const { name, description } = payload;
      db.prepare(`
        INSERT INTO complaint_types (name, description, active, created_at)
        VALUES (?, ?, 1, ?)
      `).run(name, description || "", now);
      return NextResponse.json({ success: true, message: "Complaint type added" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
