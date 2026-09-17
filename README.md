# 🍱 TiffinFlow — Smart Pro-Rated Tiffin Subscription & Kitchen Dispatch System

> **Round 2 "Builder" Submission**  
> **Problem Assignment:** `tiffin_subscription`  
> **Repository:** [https://github.com/Vaibhav1059/Auriga](https://github.com/Vaibhav1059/Auriga)

---

## 🌟 Overview & Problem Brief

### The Storyline & The Twist
A home-style tiffin (lunch delivery) service operates on a monthly subscription model where meals are delivered every weekday (Monday through Friday). In real life:
- Customers frequently **pause** deliveries for travel, weddings, or festivals.
- Customers **must not be charged** for days they were paused.
- At month-end, the owner needs an itemized bill pro-rated strictly for the days actually delivered.
- The owner looks up customers quickly by **phone number** and needs to see who is **active versus paused** each morning.

**TiffinFlow** solves this end-to-end with an automated pro-rated billing math engine, real SQLite persistence, phone lookup, live morning kitchen dispatch, and a modern reactive UI.

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

Run the unit test suite verifying weekday calculations, pause exclusions, and mathematical pro-rating accuracy:
```bash
npm test
```

---

## 🛠️ Debugging & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 5000 or 5173 already in use** | A dangling process is occupying the port | Change `PORT=5001` in `server/config.js` or kill the process: `npx kill-port 5000 5173` |
| **Reset Database to Default State** | Want to restore initial mock data | Run `npm run seed` in the terminal to reset the SQLite database. |
| **CORS / API Network Error** | Frontend cannot reach backend | Vite dev server automatically proxies `/api` calls to `http://localhost:5000`. Ensure backend is running. |

---

## 📋 REST API Reference

All core operations are exposed via standard RESTful JSON APIs:

### 1. Authentication
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new owner/kitchen account | No |
| `POST` | `/api/auth/login` | Login with email & password (returns JWT) | No |
| `GET` | `/api/auth/me` | Fetch current user profile | Yes (Bearer) |

#### Example Login Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tiffinflow.com", "password": "admin123"}'
```

### 2. Plans & Subscriptions
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/plans` | List all available monthly meal plans | No |
| `POST` | `/api/plans` | Create a new monthly meal plan | Yes |
| `GET` | `/api/subscriptions/stats` | Get dashboard summary KPIs & counts | No |
| `GET` | `/api/subscriptions/dispatch` | Morning kitchen dispatch board (`?date=YYYY-MM-DD`) | No |
| `POST` | `/api/subscriptions` | Subscribe a customer to a plan | Yes |
| `POST` | `/api/subscriptions/:id/pause` | Pause subscription for date range | Yes |
| `POST` | `/api/subscriptions/:id/resume` | Resume subscription to Active | Yes |

#### Example Pause Subscription Request:
```bash
curl -X POST http://localhost:5000/api/subscriptions/1/pause \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2026-09-14",
    "end_date": "2026-09-18",
    "reason": "Diwali Festival Holiday"
  }'
```

### 3. Customers & Instant Phone Lookup
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers/lookup?phone=...` | **Instant Phone Search** (returns sub & pause status) | No |
| `GET` | `/api/customers` | List customers with `search`, `sortBy`, `order`, `page`, `limit` | No |
| `GET` | `/api/customers/:id` | Customer profile, active plan, pause logs | No |
| `POST` | `/api/customers` | Register a new customer | Yes |

#### Example Phone Lookup Request:
```bash
curl "http://localhost:5000/api/customers/lookup?phone=9829012345"
```

### 4. Pro-Rated Billing Engine
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/billing/calculate/:subId?month=YYYY-MM` | Compute exact pro-rated bill & itemized days | No |
| `POST` | `/api/billing/generate-invoice` | Persist month-end pro-rated invoice | Yes |
| `GET` | `/api/billing/invoices` | List historical month-end invoices | No |
| `POST` | `/api/billing/invoices/:id/pay` | Mark invoice as paid | Yes |

#### Example Bill Calculation Request:
```bash
curl "http://localhost:5000/api/billing/calculate/1?month=2026-09"
```

---

## 🗄️ Database Schema (SQLite)

- `users`: Owner credentials, password hash (bcrypt), role, timestamps.
- `plans`: Monthly price, meal type (Veg, Jain, High-Protein), description.
- `customers`: Name, indexed phone number, email, delivery address, dietary notes.
- `subscriptions`: Foreign keys to `customers` & `plans`, start date, status (`ACTIVE`, `PAUSED`).
- `pause_logs`: Date range (`start_date` to `end_date`), reason, status.
- `invoices`: Month-end invoice, total weekdays, delivered days, paused days, daily rate, final payable amount.

---

## 📊 Evaluation Criteria Compliance Matrix

- [x] **Database:** Real persistence with SQLite, relations, auto-seeding.
- [x] **REST APIs:** Fully implemented and documented above.
- [x] **Usable UI:** Modern dark glassmorphism, responsive, interactive modals.
- [x] **User Auth:** JWT authentication with bcrypt password hashing.
- [x] **Search:** Phone lookup endpoint + full-text search with debounce.
- [x] **Landing Page:** 5 mandatory sections (What it is, Key features, Target audience, How it helps, 3 future features).
- [x] **Pagination & Sorting:** Multi-column sorting and page limit controls.
- [x] **Root Files:** `README.md`, `REASONING.md`, `AI_LOGS.md` present in root.
