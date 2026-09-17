# 🍱 TiffinFlow — Enterprise Pro-Rated Tiffin SaaS & Kitchen Dispatch System

> **Round 2 "Builder" Submission**  
> **Problem Assignment:** `tiffin_subscription`  
> **Enterprise Tenant:** Rajeshwar Annapurna Tiffin Kitchens (GSTIN: `08AABCR1234F1Z5`)  
> **Repository:** [https://github.com/Vaibhav1059/Auriga](https://github.com/Vaibhav1059/Auriga)

---

## 🌟 Overview & Problem Brief

### The Storyline & The Twist
A home-style tiffin (lunch delivery) service operates on a monthly subscription model where meals are delivered every weekday (Monday through Friday). In real life:
- Customers frequently **pause** deliveries for travel, weddings, or festivals.
- Customers **must strictly not be charged** for days they were paused.
- At month-end, the kitchen needs an itemized tax invoice pro-rated strictly for the days actually delivered with **5% GST (SAC 996331)**.
- The owner looks up customers instantaneously by **phone number** and verifies morning active vs paused meal prep counts.
- **Strict 9:00 AM Morning Cutoff:** Same-day pause requests received after 9:00 AM IST cannot cancel today's meal (kitchen is already cooking); the pause activates starting the next business day.

**TiffinFlow** elevates this from a simple prototype to an enterprise production SaaS platform featuring **Multi-Tenancy**, **KDS (Kitchen Display System) TV Mode**, **Driver Route Optimization**, **WhatsApp Cloud API Bot Simulator**, and **Immutable Audit Logs**.

---

## 🚀 Quick Start in GitHub Codespaces

This repository is configured for zero-friction execution in **GitHub Codespaces**:

1. Open this repository in Codespaces:
   - Click the green **`Code`** button $\rightarrow$ **`Codespaces`** tab $\rightarrow$ **`Create codespace on main`**.
2. Open the built-in terminal and run:
   ```bash
   npm run setup
   ```
   *(This installs dependencies for root, server, and client concurrently).*
3. Start the full application:
   ```bash
   npm run dev
   ```
4. Codespaces will prompt: **"Open in Browser"** on port **`5173`** (Frontend) or port **`5000`** (Backend).
5. **Default Pre-Seeded Owner Credentials:**
   - **Email:** `admin@tiffinflow.com`
   - **Password:** `admin123`
6. **Instant Standalone Browser Demo:**
   - Open [`preview.html`](preview.html) in any web browser for a zero-dependency, full-featured interactive experience.

---

## 💻 Local Setup Instructions

If running locally on your computer:

### Prerequisites
- Node.js (v18 or higher) & npm

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Vaibhav1059/Auriga.git
cd Auriga

# 2. Install all dependencies
npm run setup

# 3. Start development server (both server & client)
npm run dev
```

### Build and Production Run
```bash
# Build the React client into static assets
npm run build:client

# Start the unified production server on port 5000
npm start
```
The server will now serve both the REST API and the frontend at `http://localhost:5000`.

---

## 🧪 Running Automated Tests

Run the complete 12-test automated verification suite covering both baseline billing math and all 3 official Level 1, 2, and 3 Twists:
```bash
npm test
```

### Test Suite Coverage:
- **Baseline Pro-Rated Billing Suite (`tests/billing.test.js`)**:
  - `Test 1`: Weekday / Weekend identification and 6-day (Mon-Sat) delivery check.
  - `Test 2`: Full month zero-pause baseline with 5% GST (2.5% CGST + 2.5% SGST).
  - `Test 3`: 5-weekday pause pro-rated discount calculation.
  - `Test 4`: Pause period spanning across a weekend (ensures weekends are not double-deducted).
  - `Test 5`: Mid-month subscription start pro-rating.
  - `Test 6`: 6-day corporate plan delivery day verification.
  - `Test 7`: Strict 9:00 AM IST cutoff policy evaluation.
  - `Test 8`: GST HSN/SAC 996331 invoice and tax split validation.
- **Official Twists Suite (`tests/twists.test.js`)**:
  - `Level 1 — T1 (Integrate)`: Morning delivery notification dispatch evaluated on weekdays and Sundays; verified via `GET /outbox` after `POST /clock`.
  - `Level 2 — T6 (Lifecycle)`: Mid-cycle subscription transfer with carried-over plan and exact pro-rated mathematical split billing between Customer A and Customer B.
  - `Level 3 — T4 (Messy Data)`: Cleansing noisy customer spreadsheets with mixed date formats (DD/MM/YYYY, ISO, textual dates), duplicate phones, and blanks; generates `{ imported, deduped, rejected }` report.

---

## ⚡ The 3 Official Twists Implementation Details

### 1. Level 1 — T1 (Integrate): Morning Clock & Notification Outbox
- **`POST /clock` & `POST /api/clock`**:
  - Accepts `{ "date": "YYYY-MM-DD" }` (defaults to current date).
  - Checks if date is a delivery day (Monday-Friday).
  - Selects all active subscribers who are NOT paused on this date.
  - Formats personalized morning meal dispatch notifications and inserts into the `outbox` table.
- **`GET /outbox` & `GET /api/outbox`**:
  - Returns queued morning delivery notifications `{ count, outbox: [...], notifications: [...] }`.
- **`DELETE /outbox` & `DELETE /api/outbox`**:
  - Clears outbox records for test isolation.

### 2. Level 2 — T6 (Lifecycle): Mid-Cycle Subscription Transfer & Split Billing
- **`POST /subscriptions/:id/transfer` & `POST /api/subscriptions/:id/transfer`**:
  - Accepts `{ "to_customer_id" }` OR `{ "new_name", "new_phone", "new_address" }` along with `transfer_date`.
  - Reassigns subscription to the recipient while preserving plan and cycle continuity.
  - Computes exact mathematical pro-rated bill:
    - **Customer A**: Billed for weekdays served before `transfer_date` minus any vacation pauses.
    - **Customer B**: Billed for weekdays served from `transfer_date` to month-end.
    - Sum of days served strictly equals total active cycle days.
  - Records transaction in `subscription_transfers` table and immutable audit logs.

### 3. Level 3 — T4 (Messy Data): Customer Importer & Deduplicator
- **`POST /customers/import` & `POST /api/customers/import`**:
  - Accepts raw JSON array or CSV format.
  - Cleans 10-digit phone numbers (stripping `+91`, `0`, spaces, dashes).
  - Normalizes multiple date formats (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, `1st October 2026`) to canonical `YYYY-MM-DD`.
  - Deduplicates against the incoming batch and existing database records.
  - Rejects records missing names, phone digits, or with corrupt unparseable dates.
  - Returns required report format:
    ```json
    {
      "imported": 3,
      "deduped": 2,
      "rejected": 3,
      "details": { "imported": [...], "deduped": [...], "rejected": [...] }
    }
    ```

---

## 🎨 Modular Architecture (Zero Inline CSS)
- **`style.css`**: Dedicated external design system stylesheet managing all CSS variables (`--bg-primary`, `--color-amber`, etc.), glass cards, buttons, badges, KDS high contrast styles, and modal components.
- **`app.js`**: Modular React application containing state, business logic, and UI views.
- **`preview.html`**: Clean HTML shell linking `style.css` and loading `app.js`.

---

## 📋 REST API Reference

All operations are exposed via standard RESTful JSON APIs:

### 1. Authentication & Multi-Tenancy
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new owner/kitchen enterprise | No |
| `POST` | `/api/auth/login` | Login with email & password (returns JWT) | No |
| `GET` | `/api/auth/me` | Fetch current user profile & tenant info | Yes (Bearer) |

### 2. Plans & Subscriptions
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/plans` | List all available monthly meal plans (5-day & 6-day) | No |
| `POST` | `/api/plans` | Create a new monthly meal plan | Yes |
| `GET` | `/api/subscriptions/stats` | Get dashboard summary KPIs & counts | No |
| `GET` | `/api/subscriptions/dispatch` | Morning kitchen dispatch board (`?date=YYYY-MM-DD`) | No |
| `POST` | `/api/subscriptions` | Subscribe a customer to a plan | Yes |
| `POST` | `/api/subscriptions/:id/pause` | Pause subscription for date range (evaluates 9 AM cutoff) | Yes |
| `POST` | `/api/subscriptions/:id/resume` | Resume subscription to Active | Yes |

### 3. Customers & Instant Phone Lookup
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers/lookup?phone=...` | **Instant Phone Search** (returns sub & pause status) | No |
| `GET` | `/api/customers` | List customers with `search`, `locality`, `status`, `page` | No |
| `GET` | `/api/customers/:id` | Customer profile, active plan, pause logs | No |
| `POST` | `/api/customers` | Register a new customer | Yes |

### 4. Pro-Rated Billing Engine (GST & SAC 996331)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/billing/calculate/:subId?month=YYYY-MM` | Compute exact pro-rated bill & tax breakdown | No |
| `POST` | `/api/billing/generate-invoice` | Persist month-end official tax invoice | Yes |
| `GET` | `/api/billing/invoices` | List historical month-end invoices | No |
| `POST` | `/api/billing/invoices/:id/pay` | Mark invoice as paid / reconciled | Yes |

### 5. Enterprise Operations (KDS, Driver Routes, Audit Logs)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/operations/kds` | Live KDS feed: meal counters, tiers, dietary alerts, cutoff lock | No |
| `GET` | `/api/operations/driver-route` | Clustered active delivery stops (skips paused homes) | No |
| `POST` | `/api/operations/driver-route/:id/status` | Update delivery drop status (`DELIVERED`, `DOORBELL_RUNG`) | No |
| `GET` | `/api/operations/audit-logs` | Retrieve paginated immutable audit log events | No |

### 6. Meta WhatsApp Cloud API & Webhooks
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/webhooks/whatsapp` | Webhook receiver for customer commands: `PAUSE`, `RESUME`, `MENU`, `BILL` | No |
| `POST` | `/api/webhooks/payment` | AutoPay / UPI payment reconciliation webhook | No |

---

## 🗄️ Database Schema (SQLite with WAL Mode)

- `tenants`: Enterprise isolation (`name`, `slug`, `gstin`, `phone`, `address`).
- `users`: Credentials, password hash (bcrypt), role (`super_admin`, `owner`, `cook`, `driver`).
- `plans`: Monthly price, meal type (`Veg`, `Jain`, `Diet/High-Protein`), tier (`STANDARD`, `DELUXE`, `MINI`), `delivery_days_per_week` (5 or 6).
- `customers`: Name, indexed phone number, email, locality (`Malviya Nagar`, `Sitapura`, etc.), address, dietary notes.
- `subscriptions`: Foreign keys to `customers` & `plans`, start date, status (`ACTIVE`, `PAUSED`, `CANCELLED`).
- `pause_logs`: Date range (`start_date` to `end_date`), reason, `requested_via` (`DASHBOARD`, `WHATSAPP_BOT`), status.
- `invoices`: Month-end tax invoice, `taxable_amount`, `cgst` (2.5%), `sgst` (2.5%), `total_amount`, HSN/SAC `996331`.
- `delivery_runs`: Driver stops, delivery date, status (`PENDING`, `DELIVERED`, `DOORBELL_RUNG`, `FAILED`), timestamps.
- `audit_logs`: Immutable security log (`actor_name`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `timestamp`).
- `idempotency_keys`: Prevents accidental duplicate pause or billing requests.

---

## 📊 Evaluation Criteria Compliance Matrix

- [x] **Database:** Real relational persistence with SQLite (WAL mode, foreign keys, indexes, auto-seed).
- [x] **REST APIs:** Fully implemented across auth, subscriptions, billing, operations, and webhooks.
- [x] **Usable UI:** Modern dark glassmorphism + Light Mode toggle, responsive, interactive modals.
- [x] **User Auth:** Role-based JWT authentication with bcrypt password hashing.
- [x] **Search:** Instant phone lookup endpoint + full-text search with debounce & locality filters.
- [x] **Landing Page:** 5 mandatory sections (What it is, Key features, Target audience, How it helps, 3 future features).
- [x] **Pagination & Sorting:** Multi-column sorting and page limit controls.
- [x] **KDS TV Screen:** Live prep counters, 9 AM cutoff lock, and critical allergy alert stream.
- [x] **Driver Routes:** Locality clustering, auto-skip paused homes, 1-tap Google Maps navigation.
- [x] **WhatsApp Cloud Bot:** Interactive simulator supporting `MENU`, `PAUSE`, `RESUME`, `BILL`.
- [x] **Audit Trail:** Immutable enterprise event logs.
- [x] **Root Files:** `README.md`, `REASONING.md`, `AI_LOGS.md` present in root.
