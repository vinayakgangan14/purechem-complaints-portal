# Purechem Manufacturing Nigeria Ltd — Customer Complaint & Management Portal

> **Official Quality Assurance, Customer Complaint Registration & Tracking System**  
> Tailored for the Nigerian market, distributors, builders, and Purechem internal technical teams.  
> **Headquarters:** Afprint Compound – 2nd Gate, 122/132 Oshodi Apapa Expressway, Isolo, Lagos, Nigeria.  
> **Quality Helplines:** +234 912 154 0036 / +234 915 065 5555  
> **Website:** [purechemmanufacturing.com](https://www.purechemmanufacturing.com/)

---

## 🌟 Executive Summary & Features Delivered

The portal is a production-grade, secure, mobile-responsive full-stack platform built with **Next.js 14**, **React**, **TypeScript**, **Tailwind CSS**, and **`node:sqlite`** (ACID relational database engine with zero external native compilation requirements).

### 1. Customer Experience (Frictionless Access)
- **Friction-Free Registration**: Customers enter their contact details (Full Name, Company, Email, Phone with Nigerian `+234` format) directly on ticket submission without tedious password or SMS barriers.
- **Instant Reference ID**: Unique reference codes formatted as `PCM-NG-YYYYMMDD-XXXX` (e.g., `PCM-NG-20261008-0001`).
- **Live Server-Side Timer**: Timers start automatically based strictly on the server database timestamp (West Africa Time — WAT / UTC+1).
- **Public Complaint Tracking**: Customers can track their complaint status and verified timeline anonymously at `/track` using their Reference ID + Phone/Email verification.
- **Evidence Uploads**: Multi-file attachment support for product photos, batch labels, purchase invoices, and lab tests (JPG, PNG, PDF, DOCX, XLSX up to 25MB).
- **Customer Satisfaction Rating**: 5-star rating widget with satisfaction choices (`Yes`, `Partially`, `No`) and open feedback once tickets are resolved.

### 2. Commercial Sales Functionality
- **"Raise on Behalf of Customer"**: Field sales officers who receive complaints via phone or WhatsApp field visits can submit tickets pre-tagged as `Raised by: Sales (Rep Name)`.

### 3. Internal Enterprise Quality & Admin Workspace
- **10 Core KPI Cards**: Total Complaints, Open, New Today, This Month, Under Investigation, Overdue (highlighted in RED), Resolved, Closed, Average Resolution Time, and Max Resolution Time.
- **11-Step ISO & CAPA Workflow**:
  `OPEN` → `ACKNOWLEDGED` → `ASSIGNED` → `INVESTIGATION` → `CUSTOMER INFORMATION REQUIRED` → `SAMPLE REQUIRED` → `UNDER TESTING` → `ROOT CAUSE ANALYSIS` → `ACTION IN PROGRESS` → `RESOLVED` → `CLOSED`.
- **Strict Separation of Notes**:
  - **Internal Notes**: Visible exclusively to authorized Purechem personnel (Brookfield viscometer readings, retention sample audits).
  - **Customer Communications**: Formally broadcast to the customer tracking timeline.
- **CAPA Management**: Dedicated fields for Root Cause Analysis (RCA), Immediate Corrective Action, Long-Term Preventive Action, and Resolution Summaries.
- **Resolution Timer Calculation**: Stops automatically at the exact second a ticket is marked `RESOLVED`, calculating days, hours, minutes, seconds, and total minutes.
- **Batch Traceability & Recurring Defect Alerts**: Automatically flags clusters of 2+ complaints on the same batch number (e.g. `TOPGIT PVC Cement Batch B260901`) with prominent warning banners.
- **SLA & Escalation Engine**: Automated overdue detection (Normal: 72h, Urgent: 48h, Critical: 24h).
- **Excel (.xlsx) & CSV Exports**: Instant export of the full audit register with formatted resolution times and root causes.
- **Notifications Outbox**: Full historical inspector of generated notification emails.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js 22+ (Tested on Node.js v24.20.0 LTS)
- PowerShell or Bash shell

### 2. Running Locally

```bash
# Navigate to project directory
cd C:\Users\HP\.gemini\antigravity\scratch\purechem-portal

# Install dependencies (already installed)
npm install

# Seed realistic Nigerian sample data (products, categories, multi-stage complaints)
npm run seed

# Run unit tests for timer mathematics & WAT timezone
npm run test:timer

# Start development server
npm run dev

# Or build & start production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧭 Sitemap & User Persona Guide

| Persona | URL | Key Capabilities |
|---|---|---|
| **Public Customer** | `/` | Home portal, instant lookup, QR scan preview, Nigerian contact info |
| **New Complaint** | `/complaint/new` | Full registration form, batch details, file upload, QR code pre-filling |
| **Anonymous Tracking**| `/track` | Reference ID + Phone/Email verification, live progress, customer feedback |
| **Customer Portal** | `/portal` | Customer dashboard, KPI metrics, personal complaint history |
| **Admin Command Center**| `/admin` | 10 KPI cards, recurring batch alerts, Pareto charts, recent tickets |
| **Complaints Register**| `/admin/complaints`| Advanced table with multi-criteria filters, search, Excel & CSV export |
| **Investigation Desk**| `/admin/complaints/[id]` | Status workflow (11 steps), department assignment, internal notes, CAPA, resolution |
| **Sales Rep Portal** | `/admin/sales/new-complaint` | Raise tickets on behalf of customers received via phone/WhatsApp |
| **Batch Traceability**| `/admin/batch-trace` | Trace batch history, detect recurring quality issues across customer accounts |
| **Analytics & Reports**| `/admin/reports` | Turnaround times, product-wise complaints, department SLA compliance |
| **System Settings** | `/admin/settings` | Configurable emails (Primary, CC, QA, Sales), SLA hours, Product Master, email outbox |

---

## 📦 QR Code Packaging Integration (Section 39)

Purechem labels on TOP BOND buckets, TOPGIT PVC cans, and resin drums can embed dynamic URLs:
```
https://complaints.purechemmanufacturing.com/complaint/new?product_code=PCM-PVC-003&batch=B260901
```
When scanned on an Android phone or iPhone, the portal automatically selects the product, pack size, and batch number!

---

## 🛡️ Enterprise Security & Integrity

1. **Server-Side Timers**: Client device clock manipulation cannot alter registration or resolution timestamps.
2. **Strict RBAC Scoping**: Internal laboratory notes are completely stripped when requested by customer roles or public tracking endpoints.
3. **Audit Trails**: Every status transition, assignment change, and note creation records the acting user, role, and server timestamp.
4. **Relational Architecture**: Powered by SQLite with WAL mode (`PRAGMA journal_mode = WAL`), foreign keys enabled, and indexed search columns.
