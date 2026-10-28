# Production Deployment & Server Operations Guide

This guide describes how to deploy the FreshCart application to a live Linux server (Ubuntu 22.04 / 24.04 LTS VPS, AWS EC2, or DigitalOcean Droplet) using Docker Compose, Nginx reverse proxy, Let's Encrypt SSL, and automated PostgreSQL backups.

---

## 1. Initial Server Provisioning & Hardening

### 1.1 Update and Upgrade OS Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw curl wget git ca-certificates gnupg lsb-release htop
```

### 1.2 Configure Firewall (UFW)
Only open SSH (port 22), HTTP (port 80), and HTTPS (port 443). Never expose database port 5432 or internal port 5000 to the public internet.
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.3 Install Docker Engine & Docker Compose
```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker on boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 2. Deploying Application via Docker Compose

### 2.1 Clone Repository and Prepare Environment
```bash
cd /var/www
sudo git clone <YOUR_GIT_REPO_URL> freshcart
cd /var/www/freshcart

# Create production .env
sudo cp .env.example .env
```

### 2.2 Configure Production Variables
Edit `.env` using `nano`:
```env
# Generate a strong password for DB
POSTGRES_USER=freshcart_admin
POSTGRES_PASSWORD=Use_A_Very_Strong_Password_Here_32Chars!
POSTGRES_DB=freshcart_prod

DATABASE_URL=postgresql://freshcart_admin:Use_A_Very_Strong_Password_Here_32Chars!@postgres:5432/freshcart_prod?schema=public

NODE_ENV=production
PORT=5000

# Generate via: openssl rand -base64 64
JWT_SECRET=c1c4f4a38d7890e785b991ab4e...REPLACE_WITH_OPENSSL_RANDOM_SECRET

# Domain configuration
CORS_ORIGIN=https://yourgrocerydomain.com
NEXT_PUBLIC_API_URL=https://yourgrocerydomain.com/api
```

### 2.3 Run Database Migrations and Seed
```bash
# Start PostgreSQL service first
docker compose up -d postgres

# Run Prisma migration to apply schema to PostgreSQL
docker compose run --rm backend npx prisma migrate deploy

# Seed Owner account, categories, and delivery areas
docker compose run --rm backend npm run seed

# Build and start all services in daemon mode
docker compose up -d --build
```

Verify that all containers are healthy:
```bash
docker compose ps
```

---

## 3. Nginx Reverse Proxy & HTTP/2 Configuration

Install Nginx:
```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/freshcart.conf`:
```nginx
# Upstream servers
upstream backend_upstream {
    server 127.0.0.1:5000;
    keepalive 32;
}

upstream frontend_upstream {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourgrocerydomain.com www.yourgrocerydomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourgrocerydomain.com www.yourgrocerydomain.com;

    # SSL Certificates managed by Certbot
    ssl_certificate /etc/letsencrypt/live/yourgrocerydomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourgrocerydomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Backend API & PDF streaming
    location /api/ {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 60s;
    }

    # Swagger API Documentation
    location /api-docs {
        proxy_pass http://backend_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend Next.js Application
    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/freshcart.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Let's Encrypt SSL/TLS Certificate Setup

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and auto-configure certificates:
```bash
sudo certbot --nginx -d yourgrocerydomain.com -d www.yourgrocerydomain.com --agree-tos --email admin@yourgrocerydomain.com --no-eff-email
```

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```
Certbot installs a systemd timer that automatically checks and renews certificates twice daily.

---

## 5. Automated Daily PostgreSQL Backups

Set up an automated backup script with 14-day retention and gzip compression.

Create `/usr/local/bin/backup-freshcart-db.sh`:
```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/freshcart"
DATE=$(date +'%Y%m%d_%H%M%S')
CONTAINER_NAME="freshcart_postgres"
DB_USER="freshcart_admin"
DB_NAME="freshcart_prod"
RETENTION_DAYS=14

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting FreshCart PostgreSQL database backup..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_backup_${DATE}.sql.gz"

# Set permissions
chmod 600 "$BACKUP_DIR/db_backup_${DATE}.sql.gz"

# Delete backups older than RETENTION_DAYS
find $BACKUP_DIR -type f -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Database backup completed successfully: $BACKUP_DIR/db_backup_${DATE}.sql.gz"
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/backup-freshcart-db.sh
```

Add to cron (runs nightly at 2:30 AM):
```bash
sudo crontab -e
```
Add line:
```cron
30 2 * * * /usr/local/bin/backup-freshcart-db.sh >> /var/log/freshcart_backup.log 2>&1
```

### To Restore from a Backup:
```bash
gunzip -c /var/backups/freshcart/db_backup_20261028_023000.sql.gz | docker exec -i freshcart_postgres psql -U freshcart_admin freshcart_prod
```

---

## 6. Pre-Flight Production Launch Checklist

Before opening the store to customers, verify the following steps:

1. [ ] **Change Default Passwords:**
   - Log into `/admin` as Owner and change `OwnerPass@2026` immediately.
   - Update staff password from `StaffPass@2026`.
2. [ ] **Store Identity & Tax Setup:**
   - Go to `/admin/settings`.
   - Verify official Legal Store Name, Address, Phone, and Email.
   - Enter your company's official 15-character **GSTIN** and 14-digit **FSSAI** license number.
   - Set the starting sequential invoice prefix (e.g. `INV-2026-`).
3. [ ] **Verify Delivery Areas & PIN Codes:**
   - Go to `/admin/delivery-areas`.
   - Set accurate minimum order values (e.g. ₹199), standard delivery charges (e.g. ₹40), and free delivery thresholds (e.g. ₹499) for each serviced pincode.
4. [ ] **SMS Gateway Activation:**
   - In `backend/src/services/notification.service.ts` and `auth.service.ts`, plug in your production SMS provider credentials (e.g. MSG91 DLT template ID or Twilio Account SID/Token).
5. [ ] **Logging & Monitoring:**
   - Ensure `NODE_ENV=production` is set so query debug logs are disabled.
   - Set up server resource monitoring (e.g. UptimeKuma, Grafana, or Datadog) on port 5000 `/api/health`.
6. [ ] **Daily Backups Verified:**
   - Run `/usr/local/bin/backup-freshcart-db.sh` manually once and verify the generated `.sql.gz` file.
