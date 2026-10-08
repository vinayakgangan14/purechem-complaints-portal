-- ========================================================================
-- PURECHEM MANUFACTURING NIGERIA LTD — SUPABASE POSTGRESQL PRODUCTION DDL
-- Web Portal: Customer Complaint Registration & Tracking System
-- Target: Supabase Cloud PostgreSQL Database
-- ========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EXISTING TABLES IF RE-INITIALIZING (OPTIONAL)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS feedback CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS attachments CASCADE;
-- DROP TABLE IF EXISTS complaint_timeline CASCADE;
-- DROP TABLE IF EXISTS complaints CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS product_categories CASCADE;
-- DROP TABLE IF EXISTS complaint_types CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;

-- 3. USERS / STAFF TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  company TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'sales', 'customer_service', 'quality_manager', 'management', 'super_admin'
  customer_type TEXT DEFAULT 'Customer', -- 'Customer', 'Distributor', 'Dealer', 'Sales', 'Other'
  password_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTS MASTER CATALOG
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  product_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  pack_size TEXT,
  application TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLAINT DEFECT TYPES
CREATE TABLE IF NOT EXISTS complaint_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPLAINTS TABLE (CENTRAL AUDIT REGISTER)
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  complaint_number TEXT NOT NULL UNIQUE, -- e.g. PCM-NG-YYYYMMDD-XXXX
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_type TEXT DEFAULT 'Customer',
  raised_by_role TEXT DEFAULT 'Customer', -- 'Customer', 'Sales', 'Admin'
  raised_by_name TEXT,
  product_id BIGINT,
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
  complaint_open_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  investigation_started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  total_resolution_minutes INTEGER,
  total_resolution_hours NUMERIC(10,2),
  resolution_time_formatted TEXT,
  resolution_details TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  target_resolution_hours INTEGER DEFAULT 72,
  is_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPLAINT TIMELINE (STATE MACHINE AUDIT)
CREATE TABLE IF NOT EXISTS complaint_timeline (
  id BIGSERIAL PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  comment TEXT,
  is_internal_only BOOLEAN DEFAULT FALSE,
  performed_by TEXT NOT NULL,
  performed_by_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ATTACHMENTS
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  attachment_category TEXT DEFAULT 'customer_evidence',
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS OUTBOX
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT DEFAULT 'SENT',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CUSTOMER SATISFACTION FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  complaint_id TEXT NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  resolution_satisfaction TEXT NOT NULL,
  comments TEXT,
  customer_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_email ON complaints(customer_email);
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_phone ON complaints(customer_phone);
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_batch ON complaints(batch_number);
CREATE INDEX IF NOT EXISTS idx_supabase_complaint_created ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_supabase_timeline_cid ON complaint_timeline(complaint_id);
CREATE INDEX IF NOT EXISTS idx_supabase_attachments_cid ON attachments(complaint_id);

-- 15. SEED PURECHEM CATEGORIES
INSERT INTO product_categories (name, code, description) VALUES
  ('Water-Based Adhesives', 'WATER_BASED', 'Synthetic white wood glues and woodworking adhesives'),
  ('PVC Adhesives', 'PVC_ADHESIVES', 'Pressure-rated PVC solvent weld cements'),
  ('Adhesives', 'ADHESIVES', 'Consumer, stationery and craft adhesives'),
  ('Industrial Glue', 'INDUSTRIAL_GLUE', 'Brewery glass bottle labeling and industrial packaging adhesives'),
  ('Construction Chemicals', 'CONSTRUCTION_CHEM', 'Grinding aids, concrete admixtures, and cement additives'),
  ('Electrical Wires & Cables', 'WIRES_CABLES', 'Pure copper electrical building wires and industrial cables'),
  ('Polyurethane', 'POLYURETHANE', 'Solvent-base, solvent-free PU adhesives, and inkbinders'),
  ('Polyester Resin', 'POLYESTER_RESIN', 'Orthophthalic and fiberglass moulding resins'),
  ('Other', 'OTHER', 'Other specialized industrial chemical formulations')
ON CONFLICT (name) DO NOTHING;

-- 16. SEED PURECHEM'S EXACT 11 PRODUCT LINES
INSERT INTO products (product_code, product_name, category_name, pack_size, application, description) VALUES
  ('PCM-ADH-001', 'TOP BOND White Glue', 'Water-Based Adhesives', '500g, 1kg, 4kg, 20kg', 'Woodworking, Carpentry, Furniture, Paper & Packaging', 'Premium polyvinyl acetate water-based synthetic wood glue'),
  ('PCM-PVC-001', 'TOPGIT', 'PVC Adhesives', '50g, 100g, 250g, 500g', 'PVC Plumbing & Conduit Joinery', 'Heavy-duty solvent weld cement for high-pressure PVC pipes'),
  ('PCM-GUM-001', 'TOPGUM & Craft Glue', 'Adhesives', '120ml Bottle, 250ml Jar', 'Stationery, School, Office, Paper Craft', 'Non-toxic multipurpose clear stationery and craft liquid glue'),
  ('PCM-IND-001', '812M/GS1100 Beer Bottel labelling adhesive', 'Industrial Glue', '25kg Drum, 200kg Drum', 'High-speed glass bottle labeling in breweries', 'West Africa''s leading high-speed brewery bottle labeling adhesive'),
  ('PCM-CON-001', 'Construction Chemicals & Grinding Aids', 'Construction Chemicals', '25kg Bag, 200L Drum, Bulk', 'Cement Manufacturing, Concrete Admixtures, Structural Repair', 'Specialized grinding aids and chemical additives for construction'),
  ('PCM-CON-002', 'Tile Adhesive & Grout', 'Construction Chemicals', '20kg Bag, 25kg Bag', 'Ceramic & Porcelain Tile Installation, Joint Filling', 'Polymer-modified cementitious tile adhesive and waterproof grout'),
  ('PCM-CON-003', 'Waterproofing Solutions', 'Construction Chemicals', '20L Pail, 25kg Slurry Pack', 'Basements, Roof Slabs, Water Tanks, Retaining Walls', 'Advanced 2-component acrylic polymer and cementitious waterproofing systems'),
  ('PCM-CAB-001', 'Wires and Cables', 'Electrical Wires & Cables', '100m Coils, Wooden Drums', 'Residential, Commercial & Industrial Wiring', 'Premium ISO-certified pure copper electrical wires and power cables'),
  ('PCM-PUR-001', 'Solvent Base Adhesive PU', 'Polyurethane', '15L Can, 200L Drum', 'Footwear, Automotive, Inflatables, Leather Bonding', 'High-strength solvent-based polyurethane contact adhesive'),
  ('PCM-PUR-002', 'Solvent Free Adhesive PU', 'Polyurethane', '25kg Pail, 200kg Drum', 'Lamination, Sports Flooring, Running Tracks', 'Eco-friendly, VOC-free moisture curing polyurethane binder'),
  ('PCM-PUR-003', 'Inkbinder PU', 'Polyurethane', '200kg Drum', 'Flexographic & Gravure Printing Inks', 'High molecular weight polyurethane resin binder for flexo/gravure packaging inks')
ON CONFLICT (product_code) DO UPDATE SET
  product_name = EXCLUDED.product_name,
  category_name = EXCLUDED.category_name,
  pack_size = EXCLUDED.pack_size,
  application = EXCLUDED.application,
  description = EXCLUDED.description;

-- 17. SEED COMPLAINT TYPES
INSERT INTO complaint_types (name, description) VALUES
  ('Product Quality', 'Chemical or structural quality deviation'),
  ('Product Performance', 'Failure to meet expected strength or tack performance'),
  ('Packaging Issue', 'Can, drum, or bottle packaging variance'),
  ('Leakage', 'Liquid material leakage in transit or storage'),
  ('Short Quantity', 'Underfilled container volume'),
  ('Colour Variation', 'Shade or opacity deviation'),
  ('Viscosity Issue', 'Material is too thick, stringy, or too watery'),
  ('Adhesion Issue', 'Poor bond strength on target substrate'),
  ('Drying/Curing Issue', 'Abnormal tack or cure time'),
  ('Settling', 'Heavy phase separation or sediment at bottom'),
  ('Gel Formation', 'Premature gelling or lump formation'),
  ('Odour Issue', 'Unusual chemical smell'),
  ('Contamination', 'Foreign particulate matter in container'),
  ('Wrong Product Supplied', 'Mismatch between invoice and delivery'),
  ('Damaged Material', 'Physical transit damage'),
  ('Delivery Issue', 'Logistics delay or dispatch error'),
  ('Documentation Issue', 'Invoice or batch certificate variance'),
  ('Other', 'Other specified customer issue')
ON CONFLICT (name) DO NOTHING;

-- 18. SEED SYSTEM SETTINGS
INSERT INTO system_settings (key, value) VALUES
  ('company_name', 'Purechem Manufacturing Nigeria Ltd'),
  ('primary_complaint_email', 'complaints@purechemmanufacturing.com'),
  ('cc_complaint_email', 'compliance@purechemmanufacturing.com'),
  ('quality_dept_email', 'quality@purechemmanufacturing.com'),
  ('sales_dept_email', 'sales@purechemmanufacturing.com'),
  ('management_email', 'director@purechemmanufacturing.com'),
  ('timezone', 'Africa/Lagos'),
  ('sla_hours_normal', '72'),
  ('sla_hours_urgent', '48'),
  ('sla_hours_critical', '24'),
  ('phone_hotline', '+234 912 154 0036 / +234 915 065 5555'),
  ('address', 'Afprint Compound – 2nd Gate, 122/132 Oshodi Apapa Expressway, Isolo, Lagos, Nigeria')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 19. SEED DEFAULT STAFF USERS
INSERT INTO users (id, name, email, phone, company, role, customer_type) VALUES
  ('USR-001', 'Engr. Babatunde Alabi', 'admin@purechemmanufacturing.com', '+2348031234567', 'Purechem Manufacturing Ltd', 'super_admin', 'Other'),
  ('USR-002', 'Dr. Chioma Okonkwo', 'quality@purechemmanufacturing.com', '+2348029876543', 'Purechem Quality Assurance', 'quality_manager', 'Other'),
  ('USR-003', 'Amina Yusuf', 'cs@purechemmanufacturing.com', '+2348051122334', 'Purechem Customer Care', 'customer_service', 'Other'),
  ('USR-004', 'Femi Adeyemi', 'sales@purechemmanufacturing.com', '+2348187766554', 'Purechem Commercial Sales', 'sales', 'Sales'),
  ('USR-005', 'Mr. Kunle Sanusi', 'management@purechemmanufacturing.com', '+2348099887766', 'Purechem Executive Board', 'management', 'Other')
ON CONFLICT (email) DO NOTHING;

-- 20. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow public to INSERT new complaints
CREATE POLICY "Public complaint registration" ON complaints
  FOR INSERT WITH CHECK (true);

-- Allow public to SELECT complaints for tracking
CREATE POLICY "Public complaint tracking" ON complaints
  FOR SELECT USING (true);

-- Allow staff full access
CREATE POLICY "Full access for authenticated or service role" ON complaints
  FOR ALL USING (true);

CREATE POLICY "Public timeline read" ON complaint_timeline
  FOR SELECT USING (is_internal_only = FALSE);

CREATE POLICY "Staff timeline full" ON complaint_timeline
  FOR ALL USING (true);

CREATE POLICY "Public feedback insert" ON feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Feedback select" ON feedback
  FOR SELECT USING (true);
