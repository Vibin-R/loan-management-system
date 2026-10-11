# Loan Management System

A lending platform with two sides:

- **Borrower portal:** sign up, pass an eligibility check, upload a salary slip, choose an amount and tenure, apply, and track the loan.
- **Operations dashboard:** internal staff move each loan through its lifecycle, with every module locked to the roles allowed to use it.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Express 5 · MongoDB + Mongoose · JWT + bcrypt · Zod · Recharts

```
APPLIED ──(Sanction approves)──▶ SANCTIONED ──(Disbursement)──▶ DISBURSED ──(paid in full, automatic)──▶ CLOSED
   └──(Sanction rejects, with a reason)──▶ REJECTED
```

## Contents

1. [Quick start](#1-quick-start)
2. [Demo accounts](#2-demo-accounts)
3. [Review it in 5 minutes](#3-review-it-in-5-minutes)
4. [Requirements → where they are](#4-requirements--where-they-are)
5. [Business rules](#5-business-rules)
6. [Role-based access control](#6-role-based-access-control)
7. [API reference](#7-api-reference)
8. [Project structure](#8-project-structure)
9. [Testing](#9-testing)
10. [Design decisions: reliability and scale](#10-design-decisions-reliability-and-scale)
11. [Environment variables](#11-environment-variables)
12. [Known limitations and next steps](#12-known-limitations-and-next-steps)

---

## 1. Quick start

**You need:** Node.js 20+ and a MongoDB database. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works, as does a local `mongod`.

```bash
git clone https://github.com/Vibin-R/loan-management-system.git
cd loan-management-system

# 1. API (http://localhost:5000)
cd server
npm install
cp .env.example .env          # then set MONGO_URI and JWT_SECRET (see section 11)
npm run seed                  # creates roles, permissions and one account per role
npm run dev

# 2. Web app (http://localhost:3000), in a second terminal
cd client
npm install
cp .env.example .env.local    # the default already points at http://localhost:5000/api/v1
npm run dev
```

Open **http://localhost:3000** and sign in with any account below. The login page also has a **Try a demo account** panel that fills in the details for you.

> On Windows PowerShell, use `copy` instead of `cp`.
> To generate a `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## 2. Demo accounts

Created by `npm run seed`. Running it again is safe: it updates the accounts instead of duplicating them.

| Role | Email | Password | Lands on | Can use |
|---|---|---|---|---|
| Admin | `admin@lms.dev` | `Admin@123` | Dashboard overview | All four modules + overview |
| Sales | `sales@lms.dev` | `Sales@123` | Sales | Leads: users who registered but haven't applied |
| Sanction | `sanction@lms.dev` | `Sanction@123` | Sanction | Review applications, open salary slips, approve / reject |
| Disbursement | `disbursement@lms.dev` | `Disburse@123` | Disbursement | Release funds for sanctioned loans |
| Collection | `collection@lms.dev` | `Collect@123` | Collection | Record repayments; loans close automatically |
| Borrower | `borrower@lms.dev` | `Borrower@123` | Application | Borrower portal only |

New borrowers can also sign up from `/signup`. Public signup can only ever create a borrower; staff accounts come from the seed.

> These are demo credentials for local review. In a real deployment the seed passwords would come from environment variables, and the demo panel would be turned off.

---

## 3. Review it in 5 minutes

A path through every requirement. Use two browser windows, or log out between steps.

1. **Eligibility (BRE).** Sign up as a new borrower and enter a date of birth that makes you 22, a salary of ₹24,999 and PAN `ABCD1234E`. All three rule failures are listed together. Fix them (age 23–50, salary ≥ ₹25,000, PAN like `ABCDE1234F`, not Unemployed) and continue.
2. **Upload.** Try a `.docx` or a file over 5 MB: it's rejected under the drop zone. Then upload a PDF, JPG or PNG.
3. **Apply.** Move the sliders (₹50,000–₹5,00,000, 30–365 days). Interest and total repayment update live. Example: ₹1,00,000 for 180 days → interest **₹5,917.81**, total **₹1,05,917.81**. Apply, and the loan shows as **Applied** with a timeline.
4. **Sanction.** Log in as `sanction@lms.dev` → **Review** → open the salary slip → **Approve**. Rejecting another application requires a reason, which the borrower then sees.
5. **Disbursement.** Log in as `disbursement@lms.dev` → **Disburse** → confirm.
6. **Collection.** Log in as `collection@lms.dev` → **Record payment**:
   - Reusing a UTR is rejected (409), and so is an amount above the outstanding balance or a future date.
   - Record a partial payment, then the rest. The loan becomes **Closed** automatically and leaves the queue.
7. **RBAC.** As `sales@lms.dev`, open `/dashboard/sanction` and you get a "no access" page. As the borrower, open `/dashboard` and you get the same page. The API also answers **403**, so hiding menus isn't the only protection (see section 9).
8. **Overview.** Log in as `admin@lms.dev` to see queue counts and charts for activity, the loan pipeline and collections.

---

## 4. Requirements → where they are

| Requirement | Implementation |
|---|---|
| Signup / login, JWT, bcrypt | `server/src/services/auth.service.ts`, `utils/jwt.ts`, `utils/password.ts` |
| Personal details + server-side BRE | `server/src/services/bre.service.ts` (source of truth), client mirror in `client/lib/bre.ts` |
| Salary slip upload (PDF/JPG/PNG, ≤ 5 MB) | `server/src/middleware/upload.ts` (size limit) + `utils/fileType.ts` (checks the file's actual bytes, not just the extension) |
| Loan configuration + simple interest | `server/src/utils/loanMath.ts`, recomputed on the server at apply time; live preview in `client/lib/loanMath.ts` |
| Loan created as APPLIED | `server/src/services/borrower.service.ts` → `applyForLoan` |
| Sales, Sanction, Disbursement, Collection modules | `server/src/routes/operations.routes.ts`, `client/components/dashboard/modules/*` |
| Status transitions | `server/src/services/loanTransition.service.ts` (one table of allowed moves) |
| Payments: unique UTR, auto-close | `server/src/services/payment.service.ts`, unique index in `models/Payment.ts` |
| RBAC on backend and frontend | `middleware/requirePermission.ts`; `client/components/auth/RequirePermission.tsx` |
| Seed script, one account per role | `server/src/scripts/seed.ts`, `seedData.ts` |
| `.env.example` | `server/.env.example`, `client/.env.example` |

The full design (schemas, indexes, decisions and trade-offs) is in **[`docs/DESIGN.md`](docs/DESIGN.md)**.

---

## 5. Business rules

### Eligibility (BRE)

Runs on the server whenever the borrower saves their details. Every failed rule is returned, not just the first.

| Rule | Condition |
|---|---|
| Age | 23 to 50 years, computed exactly from the date of birth (IST) |
| Monthly salary | ≥ ₹25,000 |
| PAN | Matches `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| Employment | Not "Unemployed" |

The client runs the same checks for instant feedback, but those can be bypassed, so **the server's result is the only one that counts**. A borrower cannot upload or apply until the server has recorded a pass.

### Loan maths

```
Simple interest  SI = (P × R × T) / (365 × 100)     R = 12 (% p.a.),  T = tenure in days
Total repayment     = P + SI
```

- Amount: ₹50,000 – ₹5,00,000. Tenure: 30 – 365 days.
- The server ignores any amounts the client sends and recomputes them from the principal and tenure.
- **Money is stored as integer paise**, so ₹5,917.81 is stored as `591781`. This avoids floating-point drift when payments are added up. The API accepts and returns rupees, validated to at most 2 decimal places.

### Payments

| Check | Response |
|---|---|
| Loan must be DISBURSED | 409 `INVALID_LOAN_STATUS` |
| UTR already used (unique index) | 409 `DUPLICATE_UTR` |
| Amount > outstanding | 422 `AMOUNT_EXCEEDS_OUTSTANDING` |
| Date in the future, or before disbursal (IST calendar days) | 400 `VALIDATION_ERROR` |
| `amountPaid` reaches `totalRepayment` | Loan moves to **CLOSED** automatically |

---

## 6. Role-based access control

Roles and permissions are **stored in MongoDB** (`permissions`, `roles`, `users.roles[]`), not hard-coded `if role === …` checks. Routes ask for a **permission**, and roles are just named bundles of permissions. A new role is a database row, not a code change.

| Permission | Admin | Sales | Sanction | Disbursement | Collection | Borrower |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `lead:read` | ✓ | ✓ | | | | |
| `loan:read` | ✓ | ✓ | ✓ | ✓ | ✓ | |
| `loan:document:read` (salary slip) | ✓ | | ✓ | | | |
| `loan:sanction` | ✓ | | ✓ | | | |
| `loan:disburse` | ✓ | | | ✓ | | |
| `payment:record` | ✓ | | | | ✓ | |
| `role:manage` | ✓ | | | | | |
| `application:manage_own` | | | | | | ✓ |

**How it's enforced:**
- **Backend (authoritative):** the JWT carries only the user id. Each request loads the user's current permissions from the database, cached for up to 5 minutes, so a role change takes effect without the user logging in again. The route's `requirePermission(...)` returns **401** without a valid token and **403** without the permission.
- **Frontend:** the sidebar only lists modules the user holds. Pages are wrapped in `<RequirePermission>`, and logins redirect each user to the right home.
- **Ownership:** a borrower who asks for someone else's loan gets **404**, not 403, so loan ids can't be probed.
- **Admin:** Admin holds every staff permission, so there's no special bypass in the code.

---

## 7. API reference

Base URL: `http://localhost:5000/api/v1`. Every response is `{ "data": … }` or `{ "error": { "code", "message", "details?" } }`.

| Method & path | Permission | Purpose |
|---|---|---|
| `POST /auth/signup` | public (rate-limited) | Create a borrower account |
| `POST /auth/login` | public (rate-limited) | Get a JWT |
| `GET /auth/me` | logged in | Current user + permissions |
| `GET /borrower/application` | `application:manage_own` | Resume state: profile, slip, active loan |
| `PUT /borrower/profile` | `application:manage_own` | Save details and run the BRE (422 with every failure) |
| `POST /borrower/salary-slip` | `application:manage_own` | Upload slip (multipart field `file`) |
| `POST /borrower/loans` | `application:manage_own` | Apply (server recomputes interest) |
| `GET /borrower/loans` | `application:manage_own` | My loans with history |
| `GET /sales/leads?stage=&search=&page=&limit=` | `lead:read` | Registered users who haven't applied |
| `GET /sanction/loans` | `loan:sanction` | APPLIED queue |
| `POST /sanction/loans/:id/approve` | `loan:sanction` | APPLIED → SANCTIONED |
| `POST /sanction/loans/:id/reject` | `loan:sanction` | APPLIED → REJECTED (`{ reason }`) |
| `GET /disbursement/loans` | `loan:disburse` | SANCTIONED queue |
| `POST /disbursement/loans/:id/disburse` | `loan:disburse` | SANCTIONED → DISBURSED |
| `GET /collection/loans` | `payment:record` | DISBURSED queue with balances |
| `GET /collection/loans/:id/payments` | `payment:record` | Payment history |
| `POST /collection/loans/:id/payments` | `payment:record` | Record payment `{ utr, amount, paidOn }` |
| `GET /loans/:id` | `loan:read`, or the owning borrower | Loan detail + payments |
| `GET /loans/:id/salary-slip` | `loan:document:read`, or the owning borrower | Stream the slip |
| `GET /stats/overview` | `loan:read` | Counts, totals and 14-day trend for the overview |
| `GET /health` | public | `{ status, db }`; 503 when the database is down |

All list endpoints are paginated (`page`, `limit` ≤ 100, `search`) and return `{ items, total, page, limit }`.

---

## 8. Project structure

```
loan-management-system/
├── docs/DESIGN.md              # detailed design: schemas, indexes, decisions
├── server/                     # Express + TypeScript API
│   ├── src/
│   │   ├── config/             # env validation (zod), db connection, indexes
│   │   ├── constants/          # permissions, roles, loan statuses, rules
│   │   ├── models/             # Mongoose schemas
│   │   ├── middleware/         # authenticate, requirePermission, validate, upload, errors
│   │   ├── validators/         # zod request schemas
│   │   ├── routes/ → controllers/ → services/   # thin routes, logic lives in services
│   │   ├── mappers/            # DB document → API response (paise → rupees)
│   │   ├── utils/              # money, dates (IST), loan maths, file type, errors
│   │   └── scripts/seed.ts
│   └── tests/e2e.mjs           # end-to-end API test of the whole lifecycle
└── client/                     # Next.js App Router
    ├── app/                    # (auth)/login, (auth)/signup, apply, my-loans, dashboard/*
    ├── components/             # auth, application (wizard steps), dashboard, loans, ui
    └── lib/                    # API client, auth context, permissions, formatting, maths
```

---

## 9. Testing

```bash
# Type checks and lint (both apps)
cd server && npm run typecheck && npm run lint
cd client && npm run typecheck && npm run lint

# End-to-end API test: needs the API running (npm run dev) and the seed applied
cd server && npm run test:e2e
```

`test:e2e` signs up fresh borrowers on every run, so it can be repeated against the same database. It covers 96 checks:

- **Accounts and access:** seed logins, and the full role × endpoint matrix (401 / 403 / 200).
- **Eligibility:** every BRE edge case: one day short of 23, exactly 23, 50 and 51; salary ₹24,999 and ₹25,000; bad PAN; Unemployed.
- **Uploads:** the 5 MB limit and wrong file types.
- **Loan lifecycle:** the server recomputing interest, the happy path to CLOSED, and the reject path with the reason visible to the borrower.
- **Payments:** every payment rule, plus partial payments adding up.
- **Concurrency:** double-clicked Approve and Disburse, and the same UTR submitted twice at once.
- **Other:** pagination, and the Sales lead stages.

> Run the API on Atlas or a local MongoDB. The auth rate limit allows 20 attempts per 15 minutes, so restart the API if you run the suite several times in a row.

---

## 10. Design decisions: reliability and scale

- **Atomic status changes.** Every transition is a single `findOneAndUpdate({ _id, status: from })` that also appends to the loan's `history`. If two staff click Approve at once, one succeeds and the other gets 409, never a double move.
- **Payments can't overpay or double-count.**
  - **Balance:** the balance update only matches while `amountPaid ≤ totalRepayment − amount`.
  - **UTR:** UTRs have a unique index.
  - **Replica sets (Atlas):** the payment insert and balance update run in one transaction.
  - **Standalone `mongod`:** the payment row is inserted first, which claims the UTR, and removed again if the balance update is refused.
- **One active loan per borrower.** A partial unique index on `borrowerId` where `isActive: true` enforces it in the database, not only in code.
- **Money as integer paise; dates as IST calendar days.** Ages, payment dates and "today" are all computed in Asia/Kolkata, regardless of the server's time zone.
- **Indexes for every query.** These include `loans { status, createdAt }` for the queues, the unique `users.email` and `payments.utr`, and `payments { loanId, paidOn }`. Lists are paginated and searchable on the server. The overview uses one `$group` plus a 14-day window, so its cost doesn't grow with history.
- **Audit trail.** Each loan keeps a `history` of `{ from, to, by, at, note }`. It drives the borrower's timeline and records who did what.
- **Upload safety.** Files are checked by their actual bytes (PDF/JPEG/PNG signatures), not the browser's MIME type. They're stored under random names, and only the owner or holders of `loan:document:read` can download them.
- **Hardening:**
  - helmet, and CORS limited to the client URL
  - rate limiting on auth routes
  - zod validation on every input
  - bcrypt password hashing, with the same response time whether or not an email exists
  - one consistent error shape
  - structured logs (pino)
  - `/health`; a clean 503 while the database is down, with automatic recovery when it's back
  - graceful shutdown
- **Clear errors in the UI.** Errors about one input appear under that field. Everything else (server unreachable, conflicts) appears as a toast. Every page has loading, empty and retry states.

---

## 11. Environment variables

**`server/.env`**

| Variable | Example | Notes |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster/lms` | Atlas or `mongodb://127.0.0.1:27017/lms` |
| `JWT_SECRET` | 64+ random hex chars | Minimum 32 characters; startup fails without it |
| `JWT_EXPIRES_IN` | `1d` | |
| `PORT` | `5000` | |
| `CLIENT_URL` | `http://localhost:3000` | Only this origin is allowed by CORS |
| `UPLOAD_DIR` | `uploads` | Where salary slips are stored (git-ignored) |
| `MAX_UPLOAD_MB` | `5` | |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

**`client/.env.local`**

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` |

All server variables are validated with zod at startup, so a missing or malformed value stops the server with a clear message.

---

## 12. Known limitations and next steps

- **Storage:** salary slips are stored on local disk. In production, move them to object storage (S3) with signed URLs, so the API can run on several instances.
- **Permissions cache:** each API process keeps its own permission cache. With several instances, move it to Redis, or publish invalidations.
- **Role management:** roles are managed through the seed. An admin screen (`role:manage` already exists) would allow editing them in the app.
- **Next steps:**
  - notifications (email or SMS) on status changes
  - repayment schedules and overdue tracking
  - refresh tokens
  - CI running the e2e suite against a MongoDB service container
