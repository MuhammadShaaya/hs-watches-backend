# H&S Watches — Backend API

Express + Prisma + PostgreSQL backend for the H&S Watches luxury ecommerce platform.

## Stack

- Node.js + Express.js
- PostgreSQL via Prisma ORM
- JWT authentication (httpOnly cookies) + Google OAuth (Passport.js)
- Cloudinary for image storage/optimization
- Nodemailer for transactional email
- PDFKit for invoice generation
- Zod for request validation

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in real values:

   ```bash
   cp .env.example .env
   ```

   At minimum you need a real PostgreSQL `DATABASE_URL` and a `JWT_SECRET`. Cloudinary, SMTP, and Google OAuth credentials are optional — the server boots and degrades gracefully without them (uploads/emails/Google login will be disabled until configured).

3. **Generate the Prisma client and run migrations**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed the database** (creates admin/manager/customer demo accounts, categories, brand, a sample product, and a coupon)

   ```bash
   npm run prisma:seed
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:4000/api`.

## Demo accounts (after seeding)

| Role     | Email                       | Password    |
|----------|------------------------------|-------------|
| Admin    | admin@hswatches.com          | admin123    |
| Manager  | manager@hswatches.com        | manager123  |
| Customer | james.whitfield@example.com  | password123 |

## API Overview

All routes are mounted under `/api`.

- `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
- `POST /auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/change-password`
- `GET /auth/google`, `/auth/google/callback` (requires Google OAuth env vars)
- `GET/POST/PUT/DELETE /products`, `/products/bulk-delete`, `/products/export/csv`
- `GET/POST/PUT/DELETE /categories`, `/brands`
- `POST /orders` (checkout, supports guest), `GET /orders`, `PATCH /orders/:id/status`
- `GET /orders/track/:orderNumber` (public order tracking)
- `GET/POST /reviews`, `PATCH /reviews/:id/status` (moderation)
- `GET/POST/PUT/DELETE /coupons`, `POST /coupons/validate`
- `GET/POST /wishlist`, `POST /wishlist/toggle`
- `GET/PATCH/DELETE /customers` (admin)
- `GET/POST/PATCH/DELETE /addresses`
- `GET/POST/PUT/DELETE /blog`, `POST /blog/:slug/comments`
- `GET/PATCH /notifications`
- `GET/PUT /settings`
- `GET /reports/dashboard`, `/reports/revenue`, `/reports/top-products`
- `GET /invoices/:id` (PDF download)
- `POST /media/upload`, `/media/upload-url`, `DELETE /media/:publicId` (admin, Cloudinary)

## Payment Model

This store is **Cash on Delivery (COD) only** by design. No Stripe, PayPal, Razorpay, Apple Pay, or Google Pay integration exists or is planned — `POST /orders` always sets `paymentMethod: "COD"` and orders are created with status `PENDING`, to be progressed by admins through `CONFIRMED → PACKED → SHIPPED → DELIVERED` (or `CANCELLED`/`RETURNED`).

## Notes on this build

- Password-reset and email-verification tokens are currently stored in-memory (`Map`) inside `auth-controller.js` for simplicity. For a production deployment, persist these as database rows with expiry timestamps instead, since an in-memory store will not survive server restarts or work across multiple server instances.
- Image uploads stream directly to Cloudinary via `multer`'s in-memory storage — no files are ever written to local disk.
- Stock is decremented and logged to `InventoryLog` automatically on order creation.
