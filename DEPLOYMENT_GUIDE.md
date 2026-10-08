# Purechem Manufacturing Nigeria Ltd — Step-by-Step Production Deployment Guide

This guide walks you through deploying the portal to **Supabase** (for cloud database & storage) and **Vercel** (for serverless hosting), targeting zero or minimal initial hosting costs.

---

## 📋 Pre-Flight Checklist
- [x] All 11 Purechem product lines pre-configured
- [x] SQL migration schema created (`supabase-schema.sql`)
- [x] Environment template created (`.env.example`)
- [x] Next.js production build tested and verified

---

## 🗄️ Phase 1: Set Up Supabase (Data Capturing & PostgreSQL)

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com/) and click **Sign Up** (or log in with GitHub/Google).
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `purechem-complaints`
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select `EU (Frankfurt)` or `EU (London)` or `US East` (closest low latency to Nigeria).
   - **Pricing Plan**: Free Tier ($0/month).
4. Click **Create new project** and wait ~2 minutes for initialization.

---

### Step 2: Run the Database Schema & Seed Script
1. In the Supabase left sidebar, click the **SQL Editor** icon (`>_`).
2. Click **New Query**.
3. Open the file [`supabase-schema.sql`](./supabase-schema.sql) in this repository.
4. Copy its entire contents and paste them into the Supabase SQL Editor.
5. Click the green **Run** button (or press `Ctrl + Enter`).
6. You will see: `Success. No rows returned.`
7. In the left sidebar, click **Table Editor**. You will now see all 11 relational tables (`complaints`, `products`, `users`, `complaint_timeline`, `attachments`, etc.) pre-seeded with Purechem's exact 11 product lines and Nigerian customer service settings!

---

### Step 3: Create File Storage Bucket for Complaint Photos
1. In the Supabase left sidebar, click **Storage**.
2. Click **New Bucket**.
3. Enter Name: `complaint-attachments`.
4. Toggle **Public Bucket** to `ON` (so photos and invoices can be rendered on tickets).
5. Click **Save**.

---

### Step 4: Retrieve Supabase API Credentials
1. In the Supabase left sidebar, click **Project Settings** (gear icon) → **API**.
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** → `anon` `public` key
   - **Project API Keys** → `service_role` key (reveal and copy)
3. In Project Settings, click **Database**:
   - Scroll to **Connection String** → Select **URI**.
   - Copy the connection string (replace `[YOUR-PASSWORD]` with your actual database password).

---

## 🌐 Phase 2: Push Code to GitHub

Open PowerShell in your project folder (`C:\Users\HP\.gemini\antigravity\scratch\purechem-portal`):

```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\purechem-portal

# Initialize Git
git init

# Add all files
git add .

# Commit changes
git commit -m "Purechem Manufacturing Nigeria Customer Complaint Portal with exact 11 products"

# Create a new repository on your GitHub account (e.g. named purechem-complaints-portal)
# Then link and push:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/purechem-complaints-portal.git
git branch -M main
git push -u origin main
```

---

## 🚀 Phase 3: Deploy to Vercel (Hosting)

### Step 1: Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com/) and log in (recommended: log in with GitHub).
2. On your Vercel Dashboard, click **Add New...** → **Project**.
3. Locate `purechem-complaints-portal` from your GitHub repository list and click **Import**.

---

### Step 2: Configure Environment Variables in Vercel
Under the **Environment Variables** section, add the following variables:

| Variable Name | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `https://complaints.purechemmanufacturing.com` | Or your temporary `https://purechem-complaints.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Copied from Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Copied from Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Copied from Supabase API settings |
| `DATABASE_URL` | `postgresql://postgres:...` | Copied from Supabase Database settings |

---

### Step 3: Deploy!
1. Click **Deploy**.
2. Vercel will automatically build the Next.js application, bundle static pages, configure serverless API routes, and deploy within ~60 seconds.
3. You will receive a live production URL:
   `https://purechem-complaints-portal.vercel.app`

---

## 🏷️ Phase 4: Configure Custom Domain (Purechem Website)

Purechem Manufacturing can host the portal as:
`complaints.purechemmanufacturing.com`

1. In your **Vercel Project**, go to **Settings** → **Domains**.
2. Enter: `complaints.purechemmanufacturing.com` and click **Add**.
3. Vercel will show the required DNS record:
   - **Type**: `CNAME`
   - **Name**: `complaints`
   - **Value**: `cname.vercel-dns.com`
4. Log into your Domain DNS Manager (cPanel, GoDaddy, Cloudflare, or Namecheap where `purechemmanufacturing.com` is hosted).
5. Add the `CNAME` record.
6. Vercel will automatically generate a free SSL certificate (HTTPS) within 5–10 minutes.

---

## 🧪 Phase 5: Verification in Production

Once live:
1. Open `https://complaints.purechemmanufacturing.com` (or your Vercel URL).
2. Click **Raise a Complaint**.
3. Verify that the product dropdown displays the exact Purechem products:
   - *TOP BOND White Glue*
   - *TOPGIT*
   - *TOPGUM & Craft Glue*
   - *812M/GS1100 Beer Bottel labelling adhesive*
   - *Construction Chemicals & Grinding Aids*
   - *Tile Adhesive & Grout*
   - *Waterproofing Solutions*
   - *Wires and Cables*
   - *Solvent Base Adhesive PU*
   - *Solvent Free Adhesive PU*
   - *Inkbinder PU*
4. Submit a test complaint and verify that the ticket is created in Supabase with exact server timestamp in West Africa Time (WAT).
5. Open `/admin` to verify KPI cards and batch traceability.
