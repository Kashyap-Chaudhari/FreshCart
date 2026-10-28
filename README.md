# FreshCart Supermarket — Full-Stack Grocery Web Application

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-22%20Passed-brightgreen)](https://jestjs.io/)

A complete, production-grade grocery web application comprising a mobile-first customer storefront with online ordering, sequential PDF billing, and an enterprise admin panel for inventory management, stock ledger tracking, order fulfillment, and role-based access control.

---

## Table of Contents
1. [Architecture & Non-Negotiable Engineering Rules](#architecture--non-negotiable-engineering-rules)
2. [Folder Structure](#folder-structure)
3. [Database Schema (ERD in Text)](#database-schema-erd-in-text)
4. [API Endpoints Catalog](#api-endpoints-catalog)
5. [Prerequisites & Local Development Setup](#prerequisites--local-development-setup)
6. [Database Migration & Seeding](#database-migration--seeding)
7. [Running Unit & Concurrency Tests](#running-unit--concurrency-tests)
8. [Seeded User Credentials](#seeded-user-credentials)
9. [Pre-Go-Live Configuration Checklist](#pre-go-live-configuration-checklist)

---

## Architecture & Non-Negotiable Engineering Rules

1. **Transactional Row-Level Locking:** Order creation, stock deduction, immutable ledger entry creation, and sequential invoice numbering execute in **ONE atomic database transaction** (`prisma.$transaction`) with `SELECT ... FOR UPDATE` row locks. If two customers order the last remaining unit concurrently, exactly one succeeds and the other receives an HTTP 409 Conflict.
2. **Cancellation Stock Restoration:** Order cancellations restore stock and write an immutable `ORDER_CANCEL_RESTORE` ledger entry.
3. **Role-Based Access Control (RBAC):**
   - `OWNER`: Full privileges (Store settings, customer management, staff creation, audit logs, reports).
   - `STAFF`: Operational access (Order dispatch, item substitutions, inventory management). Staff cannot access settings, user management, or audit logs.
   - `CUSTOMER`: Shopping, order tracking, personal order history, and self-cancellation while status is `PLACED` or `CONFIRMED`.
4. **Security & Sanitization:** HTTPS-ready, bcrypt password hashing, Zod server-side validation on every endpoint, strict express-rate-limit on auth/checkout routes, parameterized SQL queries via Prisma, and sanitized production logging (passwords, OTPs, tokens, and payment secrets are automatically redacted).
5. **Historical Invariant Snapshots:** Product prices, tax percentages, MRP, units, and shipping addresses are snapshotted on orders at checkout time so later store changes never alter past tax bills.
6. **Automated PDF Billing:** PDFKit generates sequential tax invoices (`INV-001001`), warehouse packing slips, and delivery dispatch slips.

---

## Folder Structure

```
gloserystore/
├── docker-compose.yml           # PostgreSQL, Backend API, Frontend services
├── .env.example                 # Root environment variables
├── package.json                 # Monorepo task orchestration
├── README.md                    # Project documentation
├── DEPLOYMENT.md                # Production deployment & operations guide
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL schema with indexes and relations
│   │   └── seed.ts              # Seed script (30 products, delivery areas, store settings)
│   ├── src/
│   │   ├── app.ts               # Express configuration, Helmet, CORS, Rate Limiters
│   │   ├── server.ts            # Server bootstrap and graceful shutdown listeners
│   │   ├── config/              # Environment variables, Prisma client, Swagger UI
│   │   ├── controllers/         # REST Controllers (Auth, Product, Order, Admin, Reports)
│   │   ├── middlewares/         # JWT Auth, Role Guard, Zod Validator, Rate Limit, Error
│   │   ├── routes/              # Modular Express routing
│   │   ├── services/            # Order service, Stock ledger, PDFKit Invoices, Audit, Reports
│   │   ├── utils/               # GST Calculation, Sequential Invoice Formatter, Logger
│   │   └── validators/          # Zod schema definitions
│   └── tests/
│       ├── unit/
│       │   ├── calculation.test.ts      # Tax (0, 5, 12, 18%), base rates, discounts
│       │   ├── invoiceNumber.test.ts    # Sequential numbering & order formatting
│       │   └── stockDeduction.test.ts   # Inventory checks & ledger restoration
│       └── concurrency/
│           └── lastUnitOrder.test.ts    # Concurrency test for last-unit checkout
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx               # Root layout with Cart & Auth providers
        │   ├── page.tsx                 # Homepage with banners, category pills, pincode checker
        │   ├── about/page.tsx           # About store, farm sourcing, standards
        │   ├── contact/page.tsx         # Contact info, map, delivery areas list
        │   ├── login/page.tsx           # Tabbed Phone OTP, Email/Password, Customer Signup
        │   ├── cart/page.tsx            # Full cart page with free-delivery indicator
        │   ├── checkout/page.tsx        # Pincode check, delivery slots, coupon, COD
        │   ├── orders/
        │   │   ├── page.tsx             # Customer order history & guest tracker
        │   │   └── [id]/page.tsx        # Live progress tracker & 1-click invoice download
        │   ├── products/
        │   │   ├── page.tsx             # Catalogue with search, category & stock filters
        │   │   └── [slug]/page.tsx      # Product details with live stock availability
        │   └── admin/
        │       ├── layout.tsx           # Admin sidebar, role badge, sign-out
        │       ├── page.tsx             # Dashboard KPIs (Revenue, pending orders, low stock)
        │       ├── orders/              # Orders list, quick status, item substitution
        │       ├── inventory/           # Product CRUD, stock adjust modal, stock movement ledger
        │       ├── categories/          # Category CRUD
        │       ├── coupons/             # Discount codes and limits
        │       ├── delivery-areas/      # Pincode coverage & delivery fee rules
        │       ├── reports/             # Sales over time, product breakdown, COD audit
        │       ├── customers/           # Owner only: Customer accounts & block toggle
        │       ├── settings/            # Owner only: Store details, GSTIN, invoice prefix
        │       └── audit-logs/          # Owner only: Admin action audit log
        ├── components/                  # Customer Navbar, Footer, ProductCard, OrderTracker
        ├── context/                     # AuthContext, CartContext (with stock caps)
        └── lib/                         # API fetch wrapper
```

---

## Database Schema (ERD in Text)

```
[ User ]
  ├── id (UUID, PK)
  ├── name, email (unique), phone (unique), passwordHash
  ├── role (OWNER | STAFF | CUSTOMER)
  ├── isBlocked, isPhoneVerified
  └── Relations: Addresses[], Orders[], AuditLogs[], StockLedgers[]

[ Address ]
  ├── id (UUID, PK), userId (FK -> User)
  ├── street, landmark, city, state, pincode
  └── isDefault

[ Category ]
  ├── id (UUID, PK), name, slug (unique), imageUrl, displayOrder, isActive
  └── Relations: Products[]

[ Product ]
  ├── id (UUID, PK), name, slug (unique), sku (unique)
  ├── unit, price, mrp, costPrice, taxPercent
  ├── stockQty, lowStockThreshold, isAvailable, images[]
  ├── categoryId (FK -> Category)
  └── Relations: OrderItems[], StockLedgers[]

[ StockMovementLedger ]
  ├── id (UUID, PK), productId (FK -> Product)
  ├── type (PURCHASE | SALE_DEDUCTION | ORDER_CANCEL_RESTORE | DAMAGE | MANUAL_ADJUSTMENT | RETURN)
  ├── quantityChange, balanceAfter
  ├── referenceType, referenceId, reason
  └── createdByUserId (FK -> User)

[ Coupon ]
  ├── id (UUID, PK), code (unique), description
  ├── discountType (PERCENTAGE | FLAT), discountValue
  ├── minOrderValue, maxDiscount, validFrom, validTo, usageLimit, timesUsed, isActive
  └── Relations: Orders[]

[ DeliveryArea ]
  ├── id (UUID, PK), pincode (unique), areaName, city, state
  ├── minOrderValue, deliveryCharge, freeDeliveryAbove, isDeliverable, estimatedDeliveryHours

[ StoreSetting ]
  ├── id ("default", PK)
  ├── storeName, tagLine, logoUrl, phone, email, address, openingHours
  ├── gstin, fssai, invoicePrefix, invoiceNextNumber, invoiceFooterText
  ├── minOrderValue, defaultDeliveryCharge, banners (JSON)

[ Order ]
  ├── id (UUID, PK), orderNumber (unique), invoiceNumber (unique)
  ├── userId (FK -> User, optional for guest checkout), customerName, customerPhone, customerEmail
  ├── shippingAddressSnapshot (JSON)
  ├── status (PLACED | CONFIRMED | PACKED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED | REJECTED)
  ├── paymentMethod ("COD"), paymentStatus (PENDING | COLLECTED | FAILED | REFUNDED)
  ├── deliveryType ("DELIVERY" | "PICKUP"), deliverySlot, pincode
  ├── subtotal, taxTotal, discountTotal, deliveryCharge, grandTotal
  ├── couponId (FK -> Coupon), couponCodeSnapshot
  ├── cancellationReason, cancelledAt, cancelledByUserId
  └── Relations: OrderItems[], OrderStatusHistory[]

[ OrderItem ]
  ├── id (UUID, PK), orderId (FK -> Order), productId (FK -> Product)
  ├── productName, productSku, unit, unitPrice, mrp, taxPercent, taxAmount, quantity, lineTotal
  └── isSubstituted, substitutionNote

[ OrderStatusHistory ]
  ├── id (UUID, PK), orderId (FK -> Order)
  ├── fromStatus, toStatus, note, changedByUserId, createdAt

[ AuditLog ]
  ├── id (UUID, PK), userId (FK -> User), action, entity, entityId, details (JSON), ipAddress, createdAt

[ OtpVerification ]
  ├── id (UUID, PK), phone, otpHash, expiresAt, isUsed, createdAt
```

---

## API Endpoints Catalog

### Authentication
- `POST /api/auth/register` — Register customer account with email/password.
- `POST /api/auth/login` — Login with email and password.
- `POST /api/auth/otp/request` — Request 6-digit OTP code for phone login (Rate-limited).
- `POST /api/auth/otp/verify` — Verify OTP code and authenticate/auto-create customer.
- `GET /api/auth/me` — Current user profile and saved delivery addresses.

### Storefront Products & Categories
- `GET /api/products` — Product catalogue with search, category filtering, in-stock only, sorting, and pagination.
- `GET /api/products/:identifier` — Single product details by slug or ID.
- `GET /api/categories` — Active product categories.

### Delivery & Checkout
- `GET /api/delivery/check/:pincode` — Validate pincode serviceability, min order value, and delivery fees.
- `GET /api/delivery/areas` — List all active delivery hubs and pincodes.
- `POST /api/coupons/validate` — Validate coupon code against cart subtotal.
- `POST /api/orders/checkout` — Atomic checkout (row-level lock, stock deduction, sequential invoice generation). Rate-limited.

### Orders & Tracking
- `GET /api/orders/my-orders` — Customer order history.
- `GET /api/orders/track/:identifier` — Public / Customer order tracking by ID or Order Number.
- `POST /api/orders/:id/cancel` — Customer self-cancel (if PLACED or CONFIRMED; restores inventory).
- `GET /api/orders/:id/invoice` — Download auto-generated PDF Tax Bill with unique sequential invoice number.

### Admin Operations (`/api/admin`, `/api/orders/admin`, `/api/products/admin`)
- `GET /api/admin/dashboard-summary` — Real-time KPIs (Today's revenue, order count, pending dispatches, low stock items).
- `GET /api/orders/admin/list` — Filter orders by status, search, and date range.
- `PATCH /api/orders/admin/:id/status` — Advance status (`CONFIRMED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
- `POST /api/orders/admin/:id/cancel` — Cancel order with admin reason (automatically restores stock to inventory).
- `POST /api/orders/admin/:id/items/:itemId/substitute` — Replace out-of-stock item with alternative, recalculate bill, notify customer.
- `POST /api/orders/admin/:id/mark-cod-collected` — Mark Cash On Delivery as collected.
- `GET /api/orders/admin/:id/packing-slip` — Download warehouse pick list / packing slip PDF.
- `GET /api/orders/admin/:id/delivery-slip` — Download courier delivery run-sheet PDF.
- `POST /api/orders/admin/walk-in` — Create manual walk-in / counter order.
- `POST /api/products` — Create new grocery product listing.
- `PATCH /api/products/:id` — Update product details or toggle availability.
- `POST /api/products/:id/adjust-stock` — Adjust stock (+ / -) with mandatory audit reason.
- `GET /api/products/admin/stock-ledger` — Paginated stock movement ledger.
- `GET /api/admin/customers` — **(Owner Only)** List customer accounts.
- `POST /api/admin/customers/:id/toggle-block` — **(Owner Only)** Block/unblock customer.
- `GET /api/admin/audit-logs` — **(Owner Only)** Searchable audit trail.
- `PUT /api/settings` — **(Owner Only)** Store settings, GSTIN, invoice prefix, banners.

### Financial Reports (`/api/reports`)
- `GET /api/reports/sales` — Sales aggregated by day, week, or month.
- `GET /api/reports/sales-by-product` — Sales breakdown by product and category.
- `GET /api/reports/cod-collection` — COD collection audit and pending balance.
- `GET /api/reports/cancelled-orders` — Cancelled orders and lost revenue analysis.
- `GET /api/reports/stock-valuation` — Cost and retail inventory valuation.
- `GET /api/reports/export/sales-csv` — Download sales report as CSV.
- `GET /api/reports/export/stock-csv` — Download stock valuation as CSV.

### Interactive API Documentation
- `GET /api-docs` — Interactive OpenAPI / Swagger UI.

---

## Prerequisites & Local Development Setup

### Prerequisites
- Node.js v18+ or v20+
- PostgreSQL 14+ (or Docker)
- npm v9+

### 1. Clone & Configure Environment
```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Configure `DATABASE_URL` in `backend/.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/freshcart?schema=public"
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

---

## Database Migration & Seeding

Run Prisma migrations and the seed script:
```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

The seed script creates:
- **Owner Account:** `owner@freshcart.com` / `OwnerPass@2026`
- **Staff Account:** `staff@freshcart.com` / `StaffPass@2026`
- **Customer Account:** `customer@example.com` / `CustomerPass@2026`
- **7 Categories:** Fruits & Vegetables, Dairy, Staples, Oils & Masalas, Snacks, Juices, Cleaning.
- **30 Realistic Products:** With SKU, prices, MRP, GST tax %, stock counts, and images.
- **5 Serviceable Delivery Areas:** Bangalore pincodes with min-order & delivery charge rules.
- **Store Settings & Promo Coupons:** `FRESH15` (15% off), `FLAT50` (₹50 off).

### Starting Local Development Servers
In two separate terminal windows:
```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd backend && npm run dev

# Terminal 2: Customer & Admin Frontend (runs on http://localhost:3000)
cd frontend && npm run dev
```

Visit:
- Customer Store: `http://localhost:3000`
- Admin Operations Portal: `http://localhost:3000/admin`
- Swagger API Documentation: `http://localhost:5000/api-docs`

---

## Running Unit & Concurrency Tests

The test suite validates pricing calculations, tax inclusiveness, sequential invoice generation, stock deductions, and the concurrency race condition for the last remaining unit.

Run all tests:
```bash
cd backend
npm test
```

### Test Results
```
PASS tests/unit/calculation.test.ts
  Price and Tax Calculation Unit Tests
    calculateItemTaxInclusive
      √ calculates 0% GST (e.g. fresh farm produce) (8 ms)
      √ calculates 5% GST (e.g. packaged atta, dal, rice) (1 ms)
      √ calculates 12% GST (e.g. butter, ghee) (1 ms)
      √ calculates 18% GST (e.g. biscuits, detergents) (1 ms)
      √ handles decimal prices and fractions of paise cleanly without float errors (1 ms)
    calculateOrderTotals
      √ computes subtotal, taxes, delivery charge, and grand total (1 ms)
      √ applies coupon discount and verifies minimum order validation (1 ms)
      √ flags isMinOrderMet as false when subtotal is below minimum order value (1 ms)
    calculateCouponDiscount
      √ calculates valid percentage discount with cap (1 ms)
      √ calculates percentage discount below cap
      √ calculates flat discount (1 ms)
      √ rejects coupon when subtotal is below minOrderValue (1 ms)
      √ caps flat discount to subtotal so total payable is never negative (1 ms)

PASS tests/concurrency/lastUnitOrder.test.ts
  Concurrency: Last-Unit Order Checkout Race Condition
    √ simultaneous orders for the last unit results in EXACTLY 1 success and 1 failure (42 ms)
    √ simultaneous burst of 5 customers racing for 2 remaining items (30 ms)

PASS tests/unit/stockDeduction.test.ts
  Stock Deduction and Inventory Rules Tests
    √ successfully deducts stock when sufficient inventory exists (1 ms)
    √ throws 409 Insufficient Stock error when requested quantity exceeds available stock (10 ms)
    √ throws 400 error when product availability is toggled off (2 ms)
    √ successfully restores stock and creates ledger entry upon order cancellation (1 ms)

PASS tests/unit/invoiceNumber.test.ts
  Sequential Invoice and Order Number Generator Tests
    √ formats sequential invoice number with default 6-digit padding and prefix (1 ms)
    √ respects custom prefix and padLength (1 ms)
    √ formats order number with exact date pattern (2 ms)

Test Suites: 4 passed, 4 total
Tests:       22 passed, 22 total
Snapshots:   0 total
```

---

## Seeded User Credentials

| Role | Email | Password | Phone | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | `owner@freshcart.com` | `OwnerPass@2026` | `9999999999` | Full administrative control, store settings, customer management, audit logs, reports. |
| **Staff** | `staff@freshcart.com` | `StaffPass@2026` | `8888888888` | Order fulfillment, pack & dispatch, item substitutions, stock adjustments. (Settings & customer blocking disabled). |
| **Customer** | `customer@example.com` | `CustomerPass@2026` | `9876543210` | Online shopping, cart management, checkout, order tracking, invoice download. |

*(For Phone OTP login in development mode, entering any phone number generates an OTP that is printed in the server log and returned in the API response payload).*

---

## Pre-Go-Live Configuration Checklist

Before deploying this application to production, configure the following:

- [ ] **SMS Gateway Integration:** In `backend/src/services/notification.service.ts` and `auth.service.ts`, connect your production SMS API provider (e.g. MSG91, Fast2SMS, Twilio) for production OTP delivery and dispatch SMS notifications.
- [ ] **Email Delivery Service:** In `notification.service.ts`, integrate an SMTP / transactional email service (AWS SES, SendGrid, Resend) to email PDF bills.
- [ ] **Store Statutory Details:** Go to `/admin/settings` (logged in as Owner) and configure your legal entity Name, GSTIN number, and FSSAI registration number.
- [ ] **Secret Keys & Environment Variables:** Change `JWT_SECRET` in `backend/.env` to a cryptographically secure random string (minimum 64 characters) and configure production `DATABASE_URL`.
- [ ] **Domain & SSL:** Configure Nginx and generate Let's Encrypt certificates using Certbot as detailed in `DEPLOYMENT.md`.
