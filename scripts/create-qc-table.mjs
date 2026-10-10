import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:Vinayak@2646@db.qgyjqwefauomhltbjtjy.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected directly to Supabase Postgres!");

  await client.query(`
    CREATE TABLE IF NOT EXISTS qc_batch_reports (
      id BIGSERIAL PRIMARY KEY,
      batch_number TEXT NOT NULL UNIQUE,
      product_name TEXT NOT NULL,
      viscosity TEXT DEFAULT 'Standard',
      colour TEXT DEFAULT 'Standard',
      solids TEXT DEFAULT 'Standard',
      qc_status TEXT DEFAULT 'Passed',
      manufacturing_date TEXT,
      expiry_date TEXT,
      tested_by TEXT DEFAULT 'Dr. Chioma Okonkwo (QC)',
      testing_date TEXT,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE qc_batch_reports ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'QC batch reports full access' AND tablename = 'qc_batch_reports') THEN
        CREATE POLICY "QC batch reports full access" ON qc_batch_reports FOR ALL USING (true);
      END IF;
    END $$;
  `);

  console.log("qc_batch_reports table created and secured successfully in Supabase!");
  await client.end();
}

run().catch(console.error);
