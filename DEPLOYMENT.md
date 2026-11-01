# FreshCart – Multi-Website Production Deployment Guide

This guide describes how to deploy the entire FreshCart grocery quick-commerce ecosystem:
1. **Customer Storefront Website** (`frontend` – Next.js 14) – Port 3000
2. **Admin Management Portal Website** (`admin` – Next.js 14) – Port 3001
3. **Delivery Partner Portal Website** (`delivery` – Next.js 14) – Port 3002
4. **Backend API & Real-time Server** (`backend` – Express + Socket.io + Prisma) – Port 5000
5. **Database** (PostgreSQL 16) – Port 5432

---

## Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   Customers (Web & Mobile)  │
                          └──────────────┬──────────────┘
                                         │ (HTTPS)
                                         ▼
                      ┌────────────────────────────────────┐
                      │    Customer Storefront (Next.js)   │
                      │       https://yourstore.com        │
                      └──────────────────┬─────────────────┘
                                         │
┌─────────────────────────────┐          │          ┌─────────────────────────────┐
│    Admin Portal (Next.js)   │          │          │   Delivery Portal (Next.js) │
│  https://admin.yourstore.com│          │          │https://delivery.yourstore.com
└──────────────┬──────────────┘          │          └──────────────┬──────────────┘
               │                         │                         │
               └───────────────────┐     │     ┌───────────────────┘
                                   │     │     │
                                   ▼     ▼     ▼
                          ┌─────────────────────────────┐
                          │   FreshCart Backend API     │
                          │   https://api.yourstore.com │
                          │   (Express + Socket.io)     │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │   PostgreSQL 16 Database    │
                          └─────────────────────────────┘
```

---

## Strategy A: Cloud Hosting (Recommended – Fast & Easy)

Deploy frontends to **Vercel** and backend/database to **Render** or **Railway**.

### Step 1: Deploy Backend & Database on Render / Railway
1. **Create PostgreSQL Database:**
   - In Render or Railway, create a new PostgreSQL database.
   - Copy the provided `DATABASE_URL` (e.g. `postgresql://user:pass@host:5432/freshcart`).

2. **Deploy Backend API Service:**
   - Create a new Web Service connected to your GitHub repository.
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma migrate deploy && npm run seed && npm run build`
   - **Start Command:** `npm run start`
   - **Environment Variables:**
     ```env
     NODE_ENV=production
     PORT=5000
     DATABASE_URL=<Your PostgreSQL Connection URL>
     JWT_SECRET=<Random 64-char string via openssl rand -base64 48>
     CORS_ORIGIN=https://yourstore.com,https://admin.yourstore.com,https://delivery.yourstore.com
     ```
   - Note down the generated Backend URL: e.g. `https://freshcart-api.onrender.com`

---

### Step 2: Deploy Customer Storefront on Vercel
1. In Vercel, click **Add New Project** and import your Git repository.
2. In the setup screen:
   - **Project Name:** `freshcart-store`
   - **Root Directory:** Edit and select `frontend`
   - **Framework Preset:** Next.js (auto-detected)
3. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://freshcart-api.onrender.com/api
   NEXT_PUBLIC_ADMIN_URL=https://freshcart-admin.vercel.app
   ```
4. Click **Deploy**. Your customer storefront is live!

---

### Step 3: Deploy Admin Portal on Vercel
1. In Vercel, click **Add New Project** and import the same Git repository.
2. In the setup screen:
   - **Project Name:** `freshcart-admin`
   - **Root Directory:** Edit and select `admin`
   - **Framework Preset:** Next.js (auto-detected)
3. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://freshcart-api.onrender.com/api
   ```
4. Click **Deploy**. Your Admin Portal is live!

---

### Step 4: Deploy Delivery Partner Portal on Vercel
1. In Vercel, click **Add New Project** and import the same Git repository.
2. In the setup screen:
   - **Project Name:** `freshcart-delivery`
   - **Root Directory:** Edit and select `delivery`
   - **Framework Preset:** Next.js (auto-detected)
3. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://freshcart-api.onrender.com/api
   ```
4. Click **Deploy**. Your Delivery Partner Portal is live!

---

## Strategy B: Single Linux VPS Deployment (Docker Compose & Nginx)

Run all 3 frontends, backend, database, and Nginx on a single VPS (Ubuntu 22.04 / 24.04 on AWS EC2, DigitalOcean, Hetzner, or Hostinger).

### 1. Server Setup & Docker Installation
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw curl wget git ca-certificates gnupg lsb-release nginx certbot python3-certbot-nginx

# Configure Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
```

---

### 2. Clone Repository & Run Docker Compose
```bash
cd /var/www
git clone <YOUR_GIT_REPO_URL> freshcart
cd freshcart

# Create and edit production .env
cp .env.example .env
nano .env
```

Ensure `.env` contains:
```env
POSTGRES_USER=freshcart_admin
POSTGRES_PASSWORD=YourSecurePassword123!
POSTGRES_DB=freshcart_prod

NODE_ENV=production
JWT_SECRET=YourGenerated64CharSecretKeyHere

CORS_ORIGIN=https://yourstore.com,https://admin.yourstore.com,https://delivery.yourstore.com

NEXT_PUBLIC_API_URL=https://api.yourstore.com/api
NEXT_PUBLIC_ADMIN_URL=https://admin.yourstore.com
```

Build and launch all services:
```bash
# Start PostgreSQL database first
docker compose up -d postgres

# Run Prisma schema migrations & seed database
docker compose run --rm backend npx prisma migrate deploy
docker compose run --rm backend npm run seed

# Build and start all 4 services (backend, storefront, admin, delivery)
docker compose up -d --build
```

Verify that all 5 containers are running:
```bash
docker compose ps
```
You should see:
- `freshcart_postgres` (5432)
- `freshcart_backend` (5000)
- `freshcart_frontend` (3000)
- `freshcart_admin` (3001)
- `freshcart_delivery` (3002)

---

### 3. Nginx Reverse Proxy Configuration (3 Subdomains)

Create `/etc/nginx/sites-available/freshcart.conf`:

```nginx
# Upstream definitions
upstream backend_api {
    server 127.0.0.1:5000;
}
upstream storefront_app {
    server 127.0.0.1:3000;
}
upstream admin_app {
    server 127.0.0.1:3001;
}
upstream delivery_app {
    server 127.0.0.1:3002;
}

# 1. Customer Storefront (yourstore.com & www.yourstore.com)
server {
    server_name yourstore.com www.yourstore.com;

    location / {
        proxy_pass http://storefront_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Admin Management Portal (admin.yourstore.com)
server {
    server_name admin.yourstore.com;

    location / {
        proxy_pass http://admin_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Delivery Partner Portal (delivery.yourstore.com)
server {
    server_name delivery.yourstore.com;

    location / {
        proxy_pass http://delivery_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 4. Backend API & WebSockets (api.yourstore.com)
server {
    server_name api.yourstore.com;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

Enable Nginx configuration and reload:
```bash
sudo ln -s /etc/nginx/sites-available/freshcart.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4. Enable Free SSL with Let's Encrypt Certbot
```bash
sudo certbot --nginx -d yourstore.com -d www.yourstore.com -d admin.yourstore.com -d delivery.yourstore.com -d api.yourstore.com --agree-tos --email admin@yourstore.com --no-eff-email
```
Certbot will automatically install HTTPS certificates and configure HTTP-to-HTTPS redirects.

---

## Pre-Flight Launch Verification Checklist

1. [ ] **Storefront Verification:** Open `https://yourstore.com` — verify product catalog, cart drawer, checkout, and mobile bottom navigation.
2. [ ] **Admin Portal Verification:** Open `https://admin.yourstore.com` — login with Owner credentials (`rajesh@freshcart.com` / `OwnerPass@2026`) and change the password immediately.
3. [ ] **Delivery Portal Verification:** Open `https://delivery.yourstore.com` — test delivery partner login (`amit.driver@freshcart.com` / `Deliver@2026`).
4. [ ] **GST Invoice Download:** Generate an invoice in Admin and confirm the PDF downloads cleanly.
5. [ ] **Real-time Synchronization:** Update order status in Admin and observe live status change in Storefront order history and Delivery portal without page refresh.
