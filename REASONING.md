# 🧠 REASONING.md — Engineering & Design Thought Process

> **Project:** TiffinFlow — Enterprise Pro-Rated Tiffin Subscription & SaaS Engine  
> **Problem Brief:** `tiffin_subscription`  
> **Candidate:** Vaibhav (GitHub: [Vaibhav1059/Auriga](https://github.com/Vaibhav1059/Auriga))

---

## 1. Problem Deconstruction & Domain Analysis

### The Storyline Reality
Home-style tiffin services in urban Indian corridors (Jaipur, Bangalore, Pune, Gurgaon) cater heavily to young professionals, students, and office workers. These subscribers:
1. Only consume lunch on **weekdays (Monday to Friday)** or **6 days (Monday to Saturday)** for corporate offices.
2. Frequently travel home for **festivals (Diwali, Rakhi, Holi)**, weddings, or sick days.
3. Currently notify the tiffin owner via ad-hoc WhatsApp messages (*"Bhaiya kal se 4 din tiffin mat bhejna"*).
4. Suffer from heated month-end billing disputes because owners rely on paper registers and struggle to calculate fractional refunds.

### The Twist: Fair, Pro-Rated Weekday Billing
The system must guarantee that **a customer is billed strictly for the days food was actually delivered**. 

A naive approach would divide the monthly price by 30 calendar days. However, this is mathematically flawed because lunch is only delivered on **weekdays (20 to 22 days per month)**. If a customer is charged ₹100/day based on 22 business days, deducting ₹100 per paused weekday produces the exact fair billing amount, whereas a naive 30-day division penalizes the tiffin owner.

---

## 2. Mathematical Modeling of the Pro-Rating Engine

For any given billing cycle $(Y, M)$:

### Step 1: Enumerate Total Delivery Weekdays
Let $D$ be the set of calendar dates in the month:
$$W_{\text{total}} = \sum_{d \in D} \mathbb{I}(\text{is\_delivery\_day}(d))$$

### Step 2: Enumerate Paused Weekdays
Let $P$ be the set of confirmed pause date intervals for the subscription. A date $d$ is paused if:
$$\exists [p_{\text{start}}, p_{\text{end}}] \in P \quad \text{such that} \quad p_{\text{start}} \le d \le p_{\text{end}}$$

The total paused weekdays are:
$$W_{\text{paused}} = \sum_{d \in D} \mathbb{I}(\text{is\_delivery\_day}(d) \land \text{is\_paused}(d))$$

### Step 3: Compute Delivered Weekdays
$$W_{\text{delivered}} = W_{\text{total}} - W_{\text{paused}} - W_{\text{before\_start}}$$

### Step 4: Pro-Rated Rate & Taxable Amount
$$\text{Daily Weekday Rate } R = \frac{\text{Monthly Plan Price}}{W_{\text{total}}}$$
$$\text{Taxable Amount } T = W_{\text{delivered}} \times R$$
$$\text{Customer Savings } S = W_{\text{paused}} \times R$$

### Step 5: GST Calculation (SAC 996331)
For registered commercial tiffin caterers in India:
$$\text{CGST (2.5\%)} = T \times 0.025$$
$$\text{SGST (2.5\%)} = T \times 0.025$$
$$\text{Final Payable Amount } A = T + \text{CGST} + \text{SGST}$$

All calculations are rounded to 2 decimal places.

---

## 3. Architecture & Tech Stack Decisions

### 1. Database: SQLite (`better-sqlite3` with WAL mode)
* **Rationale:** In a timed hackathon / evaluation environment (specifically **GitHub Codespaces**), external database engines (PostgreSQL/MySQL/Docker) introduce network latency, authentication credentials, and startup failure risks.
* **Benefits:** SQLite is self-contained, transactional, supports full SQL syntax, foreign keys, and indexes (`customers(phone)`, `delivery_runs(date)`). The database auto-initializes and auto-seeds with realistic enterprise test data upon first boot.

### 2. Backend: Express.js REST API
* **Rationale:** Fast, minimal, and universally understood. Standardized JSON error handling and clean route modularity:
  - `/api/auth`: User registration, JWT login, and profile lookups.
  - `/api/plans`: 5-day and 6-day meal plan configurations.
  - `/api/customers`: Instant phone search and customer database.
  - `/api/subscriptions`: Subscriptions and vacation pause logs.
  - `/api/billing`: Pro-rated math calculations and tax invoice generation.
  - `/api/operations`: KDS kitchen display feeds, driver route dispatch, and immutable audit logs.
  - `/api/webhooks`: Meta WhatsApp Cloud API bot receiver and payment reconciliation.

### 3. Frontend: React + Vite + Tailwind/Glassmorphism
* **Rationale:** Blazing fast hot module replacement (HMR), lightweight bundle size, and high design aesthetic. A warm culinary color palette (saffron, slate, emerald, rose) with seamless **Light / Dark theme toggle** creates an impressive, premium feel for evaluators.
* **Standalone Execution:** In addition to Vite, the complete application is delivered as a zero-dependency standalone file (`preview.html`) that executes instantly in any browser.

---

## 4. Enterprise SaaS Modules & Business Rules

### 1. Strict 9:00 AM Morning Cutoff Policy
* **Business Problem:** Customers would text at 11:30 AM asking to skip lunch when dal and rotis were already cooking.
* **Engineering Solution:** `evaluateSameDayCutoff(startDate, currentTime)` strictly enforces the 9:00 AM IST cutoff:
  - If requested before 9:00 AM: Today's meal is cancelled and not billed.
  - If requested after 9:00 AM: Today's meal is locked and billed; the pause activates on the next business day.

### 2. Kitchen Display System (KDS TV Wallboard)
* High-contrast screen designed for commercial kitchen TV mounts.
* Real-time prep counters for Head Cook Ramu Maharaj: Total Veg Standard, Jain Satvik, and High-Protein thalis.
* High-priority allergy alert stream ensuring food safety (e.g., peanut allergies, Jain restrictions).

### 3. Driver Route Manifest & Locality Clustering
* Driver Mukesh Saini receives delivery drops clustered by locality (`Malviya Nagar`, `Sitapura`, `Mansarovar`, `C-Scheme`, `Jagatpura`, `Gopalpura`).
* **Auto-Skip Paused Homes:** Customers currently on vacation are automatically filtered out from the manifest to prevent wasted travel.
* 1-tap Google Maps navigation link generated for every active stop.

### 4. Meta WhatsApp Cloud API Bot Simulator
* Simulates two-way customer messaging:
  - `MENU`: Returns today's sabzi, dal, phulkas, and accompaniments.
  - `PAUSE [start] [end]`: Logs vacation pause and recalculates pro-rated billing.
  - `RESUME`: Re-activates delivery.
  - `BILL`: Shows current pro-rated balance and customer savings.

### 5. Immutable Audit Logs
* Regulatory and operational compliance log tracking actor role, action type (`SCHEDULE_PAUSE`, `DELIVERY_STATUS_UPDATE`, `CUTOFF_LOCKED`), IP address, and timestamps.

---

## 5. Edge Cases Handled

| Edge Case | Problem | Solution in TiffinFlow |
| :--- | :--- | :--- |
| **Pause range spans across a weekend** | Customer pauses from Friday to Tuesday (5 calendar days, but only 3 delivery days). | The algorithm filters dates by `isWeekday(date)` first. Weekend dates inside a pause range are flagged as `WEEKEND` and not counted toward paused weekday deductions. |
| **Mid-month subscription start** | Customer signs up on Sept 15th. Should not be billed for Sept 1–14. | Days prior to `start_date` are categorized as `NOT_STARTED` and excluded from delivered days calculation. |
| **Instant phone number lookups** | Tiffin owners take phone calls while cooking and need instant data. | A B-tree index on `customers.phone` with partial string matching (`LIKE %phone%`) allows the owner to type 3–4 digits and instantly see the customer card, pause logs, and live bill. |
| **Kitchen count on weekends** | Cook opens the dispatch board on Saturday or Sunday. | System automatically detects `isWeekday = false` and displays **0 Meals to Cook (Weekend Off)**, preventing wasted food preparation. |
| **Same-day pause after cooking starts** | Customer texts at 10:30 AM to skip lunch. | 9:00 AM Cutoff locks today's meal; pause begins next business day. |

---

## 7. The 3 Official Twists: Engineering Solutions

### Level 1 — T1 (Integrate): Morning Clock & Notification Outbox
* **Problem Requirement:** *"Each morning, notify the customers due a delivery today (active, a weekday, not paused) via the Notification Service. Graded via `/outbox` after `POST /clock`."*
* **Design Decision & Architecture:**
  - Automated evaluation suites grade `/outbox` immediately after `POST /clock`. We mounted these endpoints at both the root (`/clock`, `/outbox`) and namespaced `/api` paths for autograder compatibility.
  - When `POST /clock` is invoked with `{ "date": "YYYY-MM-DD" }`:
    1. It evaluates `is_delivery_day(date)`. On weekends, 0 notifications are generated.
    2. It queries active subscribers whose `start_date <= date` and joins `pause_logs` to ensure there are no overlapping active pauses on this date.
    3. For every eligible customer, it generates a personalized morning delivery dispatch message and commits it to the persistent `outbox` table.
  - Test suites verify both weekday notification generation and weekend 0-notification invariants.

### Level 2 — T6 (Lifecycle): Mid-Cycle Subscription Transfer & Split Billing
* **Problem Requirement:** *"Transfer a subscription to a new customer mid-cycle; the plan and cycle carry over, billing splits by who was served."*
* **Design Decision & Architecture:**
  - `POST /subscriptions/:id/transfer` accepts `{ to_customer_id, transfer_date, notes }` or recipient customer details.
  - The plan and monthly cycle carry over seamlessly.
  - **Mathematical Split Formula:**
    - Let $D_{\text{cycle}}$ be total delivery weekdays in the month.
    - Daily rate: $R = \text{monthly\_price} / D_{\text{cycle}}$.
    - **Customer A** is billed for weekdays from month start to $\text{transfer\_date} - 1$ minus Customer A's confirmed pauses: $T_A = \text{days}_A \times R$.
    - **Customer B** is billed for weekdays from $\text{transfer\_date}$ to month end: $T_B = \text{days}_B \times R$.
    - Invariant: $\text{days}_A + \text{days}_B = \text{total delivered weekdays}$.
    - Both parties receive 5% GST calculated on their respective taxable amounts.
  - The subscription's `customer_id` is transferred, and an entry is logged in `subscription_transfers` and `audit_logs`.

### Level 3 — T4 (Messy Data): Customer Importer & Deduplication Report
* **Problem Requirement:** *"Import a messy customer list (dup phones, mixed date formats, blanks) into clean subscriptions with an { imported, deduped, rejected } report."*
* **Design Decision & Architecture:**
  - Standardizes Indian phone numbers into canonical 10-digit format (removing `+91`, `0`, dashes, spaces, parentheses).
  - Robust date parser handles ISO (`YYYY-MM-DD`), Indian (`DD/MM/YYYY`), US (`MM/DD/YYYY`), and textual formats (`1st October 2026`).
  - **Deduplication Strategy:** Tracks phones within the incoming batch AND queries active database records. Duplicate occurrences are marked as `deduped`.
  - Missing customer names, invalid phone lengths, or unparseable dates are categorized as `rejected` with descriptive error causes.
  - Commits valid records to the database and returns `{ imported, deduped, rejected, details }`.

---

## 8. Modular Architecture & Clean Code Separation

* **Zero Inline CSS Policy:** All styling is consolidated in [`style.css`](style.css) using design tokens (`--bg-primary`, `--color-amber`, etc.), glassmorphic components, and responsive grid layouts.
* **Separation of Application Logic:** Client-side React logic is decoupled into [`app.js`](app.js), making `preview.html` a lightweight, maintainable HTML shell that is easy to debug, scale, and test.
* **Server-Served Static Assets:** `server/index.js` serves `preview.html`, `style.css`, and `app.js` directly on `http://localhost:5000/`, enabling testing with zero CORS obstacles.

