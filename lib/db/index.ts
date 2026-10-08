import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "purechem.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode & foreign keys for high concurrency & integrity
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize tables
  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    -- Users / Staff table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      company TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      customer_type TEXT DEFAULT 'Customer',
      password_hash TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Product Categories
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Products Master
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_code TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      category_name TEXT NOT NULL,
      pack_size TEXT,
      application TEXT,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Complaint Types
    CREATE TABLE IF NOT EXISTS complaint_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Complaints
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complaint_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_company TEXT,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_type TEXT DEFAULT 'Customer',
      raised_by_role TEXT DEFAULT 'Customer',
      raised_by_name TEXT,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_category TEXT NOT NULL,
      product_code TEXT,
      batch_number TEXT,
      manufacturing_date TEXT,
      expiry_date TEXT,
      pack_size TEXT,
      quantity_purchased TEXT,
      invoice_number TEXT,
      purchase_date TEXT,
      complaint_type TEXT NOT NULL,
      customer_priority TEXT DEFAULT 'Normal',
      admin_priority TEXT DEFAULT 'Medium',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_to TEXT,
      assigned_department TEXT,
      complaint_open_time TEXT NOT NULL,
      acknowledged_at TEXT,
      investigation_started_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      total_resolution_minutes INTEGER,
      total_resolution_hours REAL,
      resolution_time_formatted TEXT,
      resolution_details TEXT,
      root_cause TEXT,
      corrective_action TEXT,
      preventive_action TEXT,
      target_resolution_hours INTEGER DEFAULT 72,
      is_overdue INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Complaint Timeline (Audit log of actions & status transitions)
    CREATE TABLE IF NOT EXISTS complaint_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      comment TEXT,
      is_internal_only INTEGER DEFAULT 0,
      performed_by TEXT NOT NULL,
      performed_by_role TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    -- Attachments
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      stored_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      attachment_category TEXT DEFAULT 'customer_evidence',
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    -- Email Notifications Outbox
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      notification_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      sent_at TEXT NOT NULL
    );

    -- Customer Feedback
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL UNIQUE,
      rating INTEGER NOT NULL,
      resolution_satisfaction TEXT NOT NULL,
      comments TEXT,
      customer_name TEXT,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    -- System Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      created_at TEXT NOT NULL
    );

    -- Configurable System Settings
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Indexes for high-speed search and query performance
    CREATE INDEX IF NOT EXISTS idx_complaints_number ON complaints(complaint_number);
    CREATE INDEX IF NOT EXISTS idx_complaints_email ON complaints(customer_email);
    CREATE INDEX IF NOT EXISTS idx_complaints_phone ON complaints(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_product ON complaints(product_name);
    CREATE INDEX IF NOT EXISTS idx_complaints_batch ON complaints(batch_number);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
    CREATE INDEX IF NOT EXISTS idx_timeline_complaint ON complaint_timeline(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_complaint ON attachments(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_complaint ON notifications(complaint_id);
  `);
}
