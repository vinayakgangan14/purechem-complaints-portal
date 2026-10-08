# Deploying Purechem Complaint Portal to Render (render.com)

Render is a robust cloud application platform with native Node.js support and a generous free tier.

---

## ⚡ Method 1: Instant Blueprint Deployment (Recommended)

Because we have added a `render.yaml` configuration to your repository, Render can set up everything in one click:

1. Log in to your Render account at **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **Blueprints** in the top navigation bar (or visit [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)).
3. Click **New Blueprint Instance**.
4. Select your connected GitHub repository: **`vinayakgangan14/purechem-complaints-portal`**.
5. Render will automatically read `render.yaml` and set:
   - **Environment**: Node.js
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check**: `/`
6. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_BASE_URL`: `https://purechem-complaints-portal.onrender.com`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
7. Click **Apply**. Render will build and deploy your portal live!

---

## 🛠️ Method 2: Standard Web Service Setup

If you prefer configuring it manually:

1. On your **Render Dashboard**, click the blue **New +** button in the top right $\rightarrow$ Select **Web Service**.
2. Select **Build and deploy from a Git repository** $\rightarrow$ Click **Next**.
3. Choose your GitHub repository: **`vinayakgangan14/purechem-complaints-portal`** $\rightarrow$ Click **Connect**.
4. Configure the service settings:
   - **Name**: `purechem-complaints-portal`
   - **Region**: `Frankfurt (EU Central)` *(Recommended for low latency to Nigeria)*
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free` ($0/month)
5. Under **Environment Variables**, click **Add Environment Variable** and enter:

| Key | Value |
|---|---|
| `NODE_VERSION` | `20.18.0` |
| `NEXT_PUBLIC_BASE_URL` | `https://purechem-complaints-portal.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Your Supabase anon public key)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your Supabase service role secret key)* |
| `DATABASE_URL` | *(Your Supabase PostgreSQL URI)* |

6. Click **Create Web Service** at the bottom.
7. Render will show the live build terminal, install dependencies, compile Next.js, and launch:
   👉 **`https://purechem-complaints-portal.onrender.com`**

---

## 🏷️ Setting Custom Domain (`complaints.purechemmanufacturing.com`) on Render

1. In your Render Web Service dashboard, go to **Settings** $\rightarrow$ Scroll to **Custom Domains**.
2. Click **Add Custom Domain** and enter:
   `complaints.purechemmanufacturing.com`
3. Render will provide the DNS target:
   - **Type**: `CNAME`
   - **Name**: `complaints`
   - **Target**: `purechem-complaints-portal.onrender.com`
4. Add this CNAME record in your domain DNS manager (cPanel, GoDaddy, Cloudflare, etc.).
5. Render will automatically issue a free Let's Encrypt SSL certificate within a few minutes!
