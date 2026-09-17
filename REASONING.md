# 🧠 REASONING.md — Engineering & Design Thought Process

> **Project:** TiffinFlow — Smart Pro-Rated Tiffin Subscription & Billing Engine  
> **Problem Brief:** `tiffin_subscription`  
> **Candidate:** Vaibhav (GitHub: [Vaibhav1059/Auriga](https://github.com/Vaibhav1059/Auriga))

---

## 1. Problem Deconstruction & Domain Analysis

### The Storyline Reality
Home-style tiffin services in urban Indian corridors (Jaipur, Bangalore, Pune, Gurgaon) cater heavily to young professionals, students, and office workers. These subscribers:
1. Only consume lunch on **weekdays (Monday to Friday)**.
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
$$W_{\text{total}} = \sum_{d \in D} \mathbb{I}(\text{day\_of\_week}(d) \in \{\text{Mon, Tue, Wed, Thu, Fri}\})$$

### Step 2: Enumerate Paused Weekdays
Let $P$ be the set of confirmed pause date intervals for the subscription. A date $d$ is paused if:
$$\exists [p_{\text{start}}, p_{\text{end}}] \in P \quad \text{such that} \quad p_{\text{start}} \le d \le p_{\text{end}}$$

The total paused weekdays are:
$$W_{\text{paused}} = \sum_{d \in D} \mathbb{I}(\text{is\_weekday}(d) \land \text{is\_paused}(d))$$

### Step 3: Compute Delivered Weekdays
$$W_{\text{delivered}} = W_{\text{total}} - W_{\text{paused}} - W_{\text{before\_start}}$$

### Step 4: Pro-Rated Rate & Amount
$$\text{Daily Weekday Rate } R = \frac{\text{Monthly Plan Price}}{W_{\text{total}}}$$
$$\text{Final Payable Amount } A = W_{\text{delivered}} \times R$$
$$\text{Customer Savings } S = W_{\text{paused}} \times R$$

All calculations are rounded to 2 decimal places.

---

## 3. Architecture & Tech Stack Decisions

### 1. Database: SQLite (`better-sqlite3`)
* **Rationale:** In a timed hackathon / evaluation environment (specifically **GitHub Codespaces**), external database engines (PostgreSQL/MySQL/Docker) introduce network latency, authentication credentials, and startup failure risks.
* **Benefits:** SQLite is self-contained, transactional, supports full SQL syntax, foreign keys, and indexes (`customers(phone)`). The database auto-initializes and auto-seeds with realistic test data upon first boot.

### 2. Backend: Express.js REST API
* **Rationale:** Fast, minimal, and universally understood. Standardized JSON error handling and clean route modularity (`/api/auth`, `/api/plans`, `/api/customers`, `/api/subscriptions`, `/api/billing`).

### 3. Frontend: React + Vite + Tailwind/Glassmorphism
* **Rationale:** Blazing fast hot module replacement (HMR), lightweight bundle size, and high design aesthetic. A warm culinary color palette (saffron, slate, emerald, rose) creates an impressive, premium feel for evaluators.

---

## 4. Edge Cases Handled

| Edge Case | Problem | Solution in TiffinFlow |
| :--- | :--- | :--- |
| **Pause range spans across a weekend** | Customer pauses from Friday to Tuesday (5 calendar days, but only 3 delivery days). | The algorithm filters dates by `isWeekday(date)` first. Weekend dates inside a pause range are flagged as `WEEKEND` and not counted toward paused weekday deductions. |
| **Mid-month subscription start** | Customer signs up on Sept 15th. Should not be billed for Sept 1–14. | Days prior to `start_date` are categorized as `NOT_STARTED` and excluded from delivered days calculation. |
| **Instant phone number lookups** | Tiffin owners take phone calls while cooking and need instant data. | A B-tree index on `customers.phone` with partial string matching (`LIKE %phone%`) allows the owner to type 3–4 digits and instantly see the customer card, pause logs, and live bill. |
| **Kitchen count on weekends** | Cook opens the dispatch board on Saturday or Sunday. | System automatically detects `isWeekday = false` and displays **0 Meals to Cook (Weekend Off)**, preventing wasted food preparation. |

---

## 5. Testing & Issue Resolution Log

### Automated Unit Test Suite (`tests/billing.test.js`)
We wrote an automated test suite with 5 test suites:
1. **Weekday vs Weekend Check:** Confirmed correct day-of-week parsing.
2. **Zero-Pause Month:** Verified 22 weekdays in Sept 2026 produce an exact ₹2,200 bill with ₹0 savings.
3. **5-Day Vacation Pause:** Verified that a 5-day pause (Sept 14–18) at ₹100/day produces a ₹1,700 bill and ₹500 customer savings.
4. **Pause Overlapping Weekend:** Verified that Friday-to-Tuesday pause deducts exactly 3 weekdays, not 5.
5. **Mid-Month Start:** Verified that starting on Sept 15 accurately excludes the prior 10 weekdays.

### Key Issues Found & Fixed During Development:
1. **Timezone Date Shifting Bug:**
   * *Issue:* `new Date('2026-09-01')` in UTC can shift to `2026-08-31 18:30:00` in IST, causing incorrect weekday categorization.
   * *Fix:* Replaced UTC ISO parsing with integer-based year, month, and day components `new Date(year, month - 1, day)`, guaranteeing 100% calendar accuracy regardless of server timezone.
2. **Double Invoicing Prevention:**
   * *Issue:* Generating an invoice twice could duplicate billing records.
   * *Fix:* Added an existing invoice check in `server/routes/billing.js` to ensure only one official invoice is saved per subscription per month.
3. **Codespaces Port Binding:**
   * *Issue:* Vite default settings can bind to `localhost` rather than `0.0.0.0`, causing port forwarding issues in Codespaces.
   * *Fix:* Configured `server: { host: true, port: 5173 }` in `client/vite.config.js` and set up automatic proxying of `/api` to port 5000.
