import path from "node:path";
import fs from "node:fs";

let DatabaseSyncClass: any = null;
try {
  // Dynamic require prevents ERR_UNKNOWN_BUILTIN_MODULE during Next.js build page collection
  // node:sqlite is natively built-in in Node.js 22+
  const sqliteModule = require("node:sqlite");
  DatabaseSyncClass = sqliteModule.DatabaseSync;
} catch (e) {
  // Safely caught during build collection if builder is on Node < 22
}

let dbInstance: any = null;

export function getDb(): any {
  if (dbInstance) {
    return dbInstance;
  }

  if (!DatabaseSyncClass) {
    try {
      const sqliteModule = require("node:sqlite");
      DatabaseSyncClass = sqliteModule.DatabaseSync;
    } catch (e) {
      throw new Error(
        "node:sqlite is only available on Node.js 22+. Please set NODE_VERSION=22.12.0 in Render environment variables."
      );
    }
  }

  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "purechem.db");
  const db = new DatabaseSyncClass(dbPath);

  // Enable WAL mode & foreign keys for high concurrency & integrity
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize tables
  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: any) {
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

  // Auto-seed if tables are empty
  try {
    const prodRow = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
    if (!prodRow || prodRow.count === 0) {
      seedMasterData(db);
    }
  } catch (e) {
    console.error("Auto-seeding check failed", e);
  }
}

function seedMasterData(db: any) {
  const now = new Date().toISOString();

  // 1. Categories
  const categories = [
    "Adhesives",
    "Construction Chemicals",
    "Paint Chemicals",
    "Resin",
    "Polyester Resin",
    "Polyurethane",
    "Water-Based Adhesives",
    "Solvent-Based Adhesives",
    "PVC Adhesives",
    "Industrial Glue",
    "Electrical Wires & Cables",
    "Other Purechem Products"
  ];
  const insertCat = db.prepare("INSERT OR IGNORE INTO product_categories (name, code, description, active, created_at) VALUES (?, ?, ?, 1, ?)");
  for (const cat of categories) {
    insertCat.run(cat, cat.toUpperCase().replace(/\s+/g, "_"), `Category for ${cat}`, now);
  }

  // 2. Purechem Official Product Catalog
  const products = [
    { code: "PCM-ADH-001", name: "TOP BOND White Glue", category: "Water-Based Adhesives", pack: "500g, 1kg, 4kg, 20kg", app: "Woodworking, Carpentry, Furniture, Paper & Packaging", desc: "Premium polyvinyl acetate water-based synthetic wood glue" },
    { code: "PCM-PVC-001", name: "TOPGIT", category: "PVC Adhesives", pack: "50g, 100g, 250g, 500g", app: "PVC Plumbing & Conduit Joinery", desc: "Heavy-duty solvent weld cement for high-pressure PVC pipes" },
    { code: "PCM-GUM-001", name: "TOPGUM & Craft Glue", category: "Adhesives", pack: "120ml Bottle, 250ml Jar", app: "Stationery, School, Office, Paper Craft", desc: "Non-toxic multipurpose clear stationery and craft liquid glue" },
    { code: "PCM-IND-001", name: "812M/GS1100 Beer Bottel labelling adhesive", category: "Industrial Glue", pack: "25kg Drum, 200kg Drum", app: "High-speed glass bottle labeling in breweries", desc: "West Africa's leading high-speed brewery bottle labeling adhesive" },
    { code: "PCM-CON-001", name: "Construction Chemicals & Grinding Aids", category: "Construction Chemicals", pack: "25kg Bag, 200L Drum, Bulk", app: "Cement Manufacturing, Concrete Admixtures, Structural Repair", desc: "Specialized grinding aids and chemical additives for construction" },
    { code: "PCM-CON-002", name: "Tile Adhesive & Grout", category: "Construction Chemicals", pack: "20kg Bag, 25kg Bag", app: "Ceramic & Porcelain Tile Installation, Joint Filling", desc: "Polymer-modified cementitious tile adhesive and waterproof grout" },
    { code: "PCM-CON-003", name: "Waterproofing Solutions", category: "Construction Chemicals", pack: "20L Pail, 25kg Slurry Pack", app: "Basements, Roof Slabs, Water Tanks, Retaining Walls", desc: "Advanced 2-component acrylic polymer and cementitious waterproofing systems" },
    { code: "PCM-CAB-001", name: "Wires and Cables", category: "Electrical Wires & Cables", pack: "100m Coils, Wooden Drums", app: "Residential, Commercial & Industrial Wiring", desc: "Premium ISO-certified pure copper electrical wires and power cables" },
    { code: "PCM-PUR-001", name: "Solvent Base Adhesive PU", category: "Polyurethane", pack: "15L Can, 200L Drum", app: "Footwear, Automotive, Inflatables, Leather Bonding", desc: "High-strength solvent-based polyurethane contact adhesive" },
    { code: "PCM-PUR-002", name: "Solvent Free Adhesive PU", category: "Polyurethane", pack: "25kg Pail, 200kg Drum", app: "Lamination, Sports Flooring, Running Tracks", desc: "Eco-friendly, VOC-free moisture curing polyurethane binder" },
    { code: "PCM-PUR-003", name: "Inkbinder PU", category: "Polyurethane", pack: "200kg Drum", app: "Flexographic & Gravure Printing Inks", desc: "High molecular weight polyurethane resin binder for flexo/gravure packaging inks" }
  ];
  const insertProd = db.prepare("INSERT OR REPLACE INTO products (product_code, product_name, category_name, pack_size, application, description, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)");
  for (const p of products) {
    insertProd.run(p.code, p.name, p.category, p.pack, p.app, p.desc, now);
  }

  // 3. Complaint Types
  const complaintTypes = [
    "Product Quality",
    "Product Performance",
    "Packaging Issue",
    "Leakage",
    "Short Quantity",
    "Colour Variation",
    "Viscosity Issue",
    "Adhesion Issue",
    "Drying/Curing Issue",
    "Settling",
    "Gel Formation",
    "Odour Issue",
    "Contamination",
    "Wrong Product Supplied",
    "Damaged Material",
    "Delivery Issue",
    "Documentation Issue",
    "Other"
  ];
  const insertType = db.prepare("INSERT OR IGNORE INTO complaint_types (name, description, active, created_at) VALUES (?, ?, 1, ?)");
  for (const t of complaintTypes) {
    insertType.run(t, `Complaint relating to ${t}`, now);
  }

  // 4. System Settings
  const settings = [
    { key: "company_name", value: "Purechem Manufacturing Nigeria Ltd" },
    { key: "primary_complaint_email", value: "complaints@purechemmanufacturing.com" },
    { key: "cc_complaint_email", value: "compliance@purechemmanufacturing.com" },
    { key: "quality_dept_email", value: "quality@purechemmanufacturing.com" },
    { key: "sales_dept_email", value: "sales@purechemmanufacturing.com" },
    { key: "management_email", value: "director@purechemmanufacturing.com" },
    { key: "timezone", value: "Africa/Lagos" },
    { key: "sla_hours_normal", value: "72" },
    { key: "sla_hours_urgent", value: "48" },
    { key: "sla_hours_critical", value: "24" },
    { key: "phone_hotline", value: "+234 912 154 0036 / +234 915 065 5555" },
    { key: "address", value: "Afprint Compound – 2nd Gate, 122/132 Oshodi Apapa Expressway, Isolo, Lagos, Nigeria" }
  ];
  const insertSetting = db.prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)");
  for (const s of settings) {
    insertSetting.run(s.key, s.value, now);
  }

  // 5. Users
  const users = [
    { id: "USR-001", name: "Engr. Babatunde Alabi", email: "admin@purechemmanufacturing.com", phone: "+2348031234567", company: "Purechem Manufacturing Ltd", role: "super_admin", type: "Other" },
    { id: "USR-002", name: "Dr. Chioma Okonkwo", email: "quality@purechemmanufacturing.com", phone: "+2348029876543", company: "Purechem Quality Assurance", role: "quality_manager", type: "Other" },
    { id: "USR-003", name: "Amina Yusuf", email: "cs@purechemmanufacturing.com", phone: "+2348051122334", company: "Purechem Customer Care", role: "customer_service", type: "Other" },
    { id: "USR-004", name: "Femi Adeyemi", email: "sales@purechemmanufacturing.com", phone: "+2348187766554", company: "Purechem Commercial Sales", role: "sales", type: "Sales" },
    { id: "USR-005", name: "Mr. Kunle Sanusi", email: "management@purechemmanufacturing.com", phone: "+2348099887766", company: "Purechem Executive Board", role: "management", type: "Other" },
    { id: "USR-006", name: "Alhaji Danladi Musa", email: "danladi@kaborfurniture.ng", phone: "+2348035544332", company: "Kabor Furniture Works Kano", role: "customer", type: "Distributor" },
    { id: "USR-007", name: "Chief Emeka Eze", email: "eze@ezebuilders.com", phone: "+2348067788990", company: "Eze & Sons Construction Onitsha", role: "customer", type: "Dealer" },
    { id: "USR-008", name: "Mr. Adebayo Ogunleye", email: "adebayo@ikejawood.com", phone: "+2348023456789", company: "Ikeja Woodworking Hub Lagos", role: "customer", type: "Customer" }
  ];
  const insertUser = db.prepare("INSERT OR REPLACE INTO users (id, name, email, phone, company, role, customer_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)");
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.phone, u.company, u.role, u.type, now, now);
  }

  // 6. Sample Initial Complaints
  const t1 = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO complaints (
      id, complaint_number, customer_name, customer_company, customer_email, customer_phone, customer_type,
      raised_by_role, raised_by_name, product_name, product_category, product_code, batch_number,
      manufacturing_date, expiry_date, pack_size, quantity_purchased, invoice_number, purchase_date,
      complaint_type, customer_priority, admin_priority, description, status, assigned_to, assigned_department,
      complaint_open_time, target_resolution_hours, is_overdue, created_at, updated_at
    ) VALUES (
      'CMP-001', 'PCM-NG-20261008-0001', 'Mr. Adebayo Ogunleye', 'Ikeja Woodworking Hub Lagos', 'adebayo@ikejawood.com', '+2348023456789', 'Customer',
      'Customer', 'Mr. Adebayo Ogunleye', 'TOPGIT', 'PVC Adhesives', 'PCM-PVC-001', 'B260901',
      '2026-09-01', '2028-09-01', '500g', '24 Cans', 'INV-LAG-88912', '2026-09-28',
      'Viscosity Issue', 'Urgent', 'High',
      'We opened the latest delivery of TOPGIT cans for our drainage installation project in Ikeja GRA. The solvent viscosity is unusually thick and stringy, making smooth brush application difficult on 4-inch PVC pipes.',
      'OPEN', NULL, 'Quality',
      ?, 48, 0, ?, ?
    )
  `).run(t1, t1, t1);

  db.prepare(`
    INSERT INTO complaint_timeline (complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at)
    VALUES ('CMP-001', 'Complaint Registered', NULL, 'OPEN', 'Complaint submitted via Customer Portal with batch B260901 details.', 0, 'Mr. Adebayo Ogunleye', 'Customer', ?)
  `).run(t1);

  const t2 = new Date(Date.now() - 28 * 3600 * 1000).toISOString();
  const t2_ack = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
  const t2_test = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO complaints (
      id, complaint_number, customer_name, customer_company, customer_email, customer_phone, customer_type,
      raised_by_role, raised_by_name, product_name, product_category, product_code, batch_number,
      manufacturing_date, expiry_date, pack_size, quantity_purchased, invoice_number, purchase_date,
      complaint_type, customer_priority, admin_priority, description, status, assigned_to, assigned_department,
      complaint_open_time, acknowledged_at, investigation_started_at, target_resolution_hours, is_overdue, created_at, updated_at
    ) VALUES (
      'CMP-002', 'PCM-NG-20261007-0002', 'Chief Emeka Eze', 'Eze & Sons Construction Onitsha', 'eze@ezebuilders.com', '+2348067788990', 'Dealer',
      'Sales', 'Femi Adeyemi (Sales Rep)', 'TOPGIT', 'PVC Adhesives', 'PCM-PVC-001', 'B260901',
      '2026-09-01', '2028-09-01', '500g', '60 Cans', 'INV-ONT-45120', '2026-09-25',
      'Viscosity Issue', 'Normal', 'High',
      'Client reported high thickness and rapid gelling during conduit fitting in Onitsha commercial project. Sales rep verified 3 cans in Onitsha warehouse show gel separation.',
      'UNDER TESTING', 'Dr. Chioma Okonkwo', 'Quality',
      ?, ?, ?, 48, 0, ?, ?
    )
  `).run(t2, t2_ack, t2_test, t2, now);

  db.prepare(`
    INSERT INTO complaint_timeline (complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at)
    VALUES 
    ('CMP-002', 'Complaint Registered by Sales Rep', NULL, 'OPEN', 'Raised on behalf of Chief Emeka Eze following phone complaint.', 0, 'Femi Adeyemi', 'Sales', ?),
    ('CMP-002', 'Complaint Acknowledged', 'OPEN', 'ACKNOWLEDGED', 'Awaiting retention sample from factory warehouse.', 0, 'Amina Yusuf', 'Customer Service', ?),
    ('CMP-002', 'Assigned to Quality', 'ACKNOWLEDGED', 'ASSIGNED', 'Assigned to Dr. Chioma Okonkwo for solvent retention verification.', 0, 'Amina Yusuf', 'Customer Service', ?),
    ('CMP-002', 'Sample Testing Commenced', 'ASSIGNED', 'UNDER TESTING', 'Brookfield viscometer test underway in Lagos QA Lab. Batch retention sample requested.', 0, 'Dr. Chioma Okonkwo', 'Quality Manager', ?)
  `).run(t2, t2_ack, t2_ack, t2_test);

  const t4_start = new Date(Date.now() - 96 * 3600 * 1000).toISOString();
  const t4_end = new Date(Date.now() - 44 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO complaints (
      id, complaint_number, customer_name, customer_company, customer_email, customer_phone, customer_type,
      raised_by_role, raised_by_name, product_name, product_category, product_code, batch_number,
      manufacturing_date, expiry_date, pack_size, quantity_purchased, invoice_number, purchase_date,
      complaint_type, customer_priority, admin_priority, description, status, assigned_to, assigned_department,
      complaint_open_time, resolved_at, total_resolution_minutes, total_resolution_hours, resolution_time_formatted,
      resolution_details, root_cause, corrective_action, preventive_action, target_resolution_hours, is_overdue, created_at, updated_at
    ) VALUES (
      'CMP-004', 'PCM-NG-20261004-0004', 'Quality Lead - Nigerian Breweries', 'Nigerian Breweries Plc Iganmu', 'packaging@nbplc.com', '+2348039900112', 'Customer',
      'Customer', 'Engr. Tunde Williams', '812M/GS1100 Beer Bottel labelling adhesive', 'Industrial Glue', 'PCM-IND-001', 'BB260710',
      '2026-07-10', '2027-07-10', '25kg Drum', '50 Drums', 'INV-NB-7789', '2026-09-02',
      'Drying/Curing Issue', 'Urgent', 'Critical',
      'On high-speed bottling line 3 (50,000 bottles/hour), label adhesion tack time was lagging by 1.8 seconds, causing minor label skewing on cold condensation bottles.',
      'RESOLVED', 'Dr. Chioma Okonkwo', 'Quality',
      ?, ?, 3120, 52.0, '2 Days 4 Hours 0 Minutes 0 Seconds',
      'Technical Service team visited Iganmu plant. Adjusted glue pot temperature to 28°C and optimized tack formulation. Line 3 running smoothly at 52,000 bph with 100% adhesion.',
      'Glue temperature in cold room supply was below recommended 25°C threshold.',
      'Installed digital temperature controller on delivery glue reservoir.',
      'Added standard operating guideline placard at all brewery customer filling stations.',
      48, 0, ?, ?
    )
  `).run(t4_start, t4_end, t4_start, t4_end);

  db.prepare(`
    INSERT INTO complaint_timeline (complaint_id, action, old_status, new_status, comment, is_internal_only, performed_by, performed_by_role, created_at)
    VALUES 
    ('CMP-004', 'Complaint Registered', NULL, 'OPEN', 'Emergency technical assistance requested for bottling line 3.', 0, 'Engr. Tunde Williams', 'Customer', ?),
    ('CMP-004', 'Emergency On-Site Visit', 'OPEN', 'INVESTIGATION', 'Technical engineer dispatched to Iganmu brewery.', 0, 'Dr. Chioma Okonkwo', 'Quality Manager', ?),
    ('CMP-004', 'Complaint Resolved', 'INVESTIGATION', 'RESOLVED', 'Resolution verified on bottling line. Formal CAPA report provided.', 0, 'Dr. Chioma Okonkwo', 'Quality Manager', ?)
  `).run(t4_start, t4_start, t4_end);

  db.prepare(`
    INSERT OR REPLACE INTO feedback (complaint_id, rating, resolution_satisfaction, comments, customer_name, submitted_at)
    VALUES ('CMP-004', 5, 'Yes', 'Exceptional turnaround time by Purechem engineering team. Bottle labeling line reached full target output with zero downtime.', 'Engr. Tunde Williams', ?)
  `).run(t4_end);
}
