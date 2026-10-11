# Loan Management System — Design

Phase 01 output. This is the reference for building the server and client, and it becomes the design section of the README.

**Stack:** Next.js (App Router) + TypeScript + Tailwind · Node.js + Express + TypeScript · MongoDB + Mongoose · JWT + bcrypt

---

## 1. Key decisions at a glance

| Topic | Decision | Why |
|---|---|---|
| BRE location | Server is the source of truth. Client repeats the same rules for instant feedback. | Client checks can be bypassed with a direct API call. The server must reject on its own. |
| PAN format | `^[A-Z]{5}[0-9]{4}[A-Z]$` (input is trimmed and uppercased first) | 5 letters, 4 digits, 1 letter, e.g. `ABCDE1234F` |
| Money | Stored as **integer paise** (`₹1 = 100`). API accepts and returns rupees as numbers; conversion happens in one util. | Avoids float errors like `0.1 + 0.2`. Totals compare exactly, which auto-close depends on. |
| Access control | Permission-based RBAC stored in MongoDB: `permissions` and `roles` collections, `users.roles[]`. Routes check permissions (`requirePermission('loan:sanction')`), never role names. | New roles or changed duties are data changes, not code changes. A user can hold several roles. |
| Permission checks | A user's permissions are resolved once and cached in memory per user (5-min TTL, keyed by `permVersion`). | Checks cost the same whether there are 6 roles or 600. At most one DB read per user per 5 minutes. |
| 401 vs 403 | 401 = not logged in / bad token. 403 = logged in but missing the permission. | Standard HTTP meaning. |
| Status moves | One `transition()` service, atomic `findOneAndUpdate({ _id, status: from })` | Double clicks or two executives acting at once can't apply a move twice. |
| One active loan | Partial unique index on `loans.borrowerId` where `isActive: true` | The database itself blocks a second open application, even under a race. |
| Payment + close | Mongo transaction: insert payment, `$inc` amountPaid, close if fully paid | Payment and balance never get out of sync. Needs a replica set (Atlas has one). |
| Audit | `history[]` on every loan: from, to, by, at, note | Traceability and a timeline for the borrower and staff. |
| Lists | Server-side pagination + search on every list endpoint | Queues stay fast as data grows. |

---

## 2. Roles and permissions

Access is granted by **permissions** (what a user can do). **Roles** are named bundles of permissions, and a user can hold one or more roles. All three are stored in MongoDB (see §4), and the seed script creates the defaults below.

### Permission catalogue

Format: `resource:action`.

| Permission | Allows |
|---|---|
| `application:manage_own` | Borrower: save own profile, upload own salary slip, apply, view own loans |
| `lead:read` | View the Sales lead list |
| `loan:read` | View any loan's details and history (all staff) |
| `loan:document:read` | Open any applicant's salary slip |
| `loan:sanction` | View the APPLIED queue; approve or reject |
| `loan:disburse` | View the SANCTIONED queue; mark disbursed |
| `payment:record` | View the DISBURSED queue and payments; record payments |
| `role:manage` | View and edit roles and their permissions (admin) |

### Default roles (seeded, `isSystem: true`)

| Role | Permissions | Dashboard modules shown |
|---|---|---|
| `BORROWER` | `application:manage_own` | none (portal only: `/apply`, `/my-loans`) |
| `SALES` | `lead:read`, `loan:read` | Sales |
| `SANCTION` | `loan:sanction`, `loan:read`, `loan:document:read` | Sanction |
| `DISBURSEMENT` | `loan:disburse`, `loan:read` | Disbursement |
| `COLLECTION` | `payment:record`, `loan:read` | Collection |
| `ADMIN` | every permission except `application:manage_own` | all four |

Admin has no special-case code. It simply holds every staff permission. Borrower actions stay separate from staff permissions, so staff can never act as a borrower.

**Module → permission** (used by the server routes and the client sidebar):
`sales → lead:read` · `sanction → loan:sanction` · `disbursement → loan:disburse` · `collection → payment:record`

Signup always assigns the `BORROWER` role, looked up by name. Any role or permission sent in the signup body is ignored. Staff accounts come only from the seed script, or from an admin assigning roles.

---

## 3. Loan status machine

```
                 approve (SANCTION)          disburse (DISBURSEMENT)       auto, when amountPaid == totalRepayment
   APPLIED ───────────────────────▶ SANCTIONED ───────────────────────▶ DISBURSED ─────────────────────────────────▶ CLOSED
      │
      │ reject + reason (SANCTION)
      ▼
   REJECTED
```

| From | To | Triggered by | Required input | Side effects |
|---|---|---|---|---|
| — | `APPLIED` | `application:manage_own` (the borrower) | principal, tenureDays; BRE passed; slip uploaded | `isActive = true`, history entry |
| `APPLIED` | `SANCTIONED` | `loan:sanction` | — | `sanctionedAt`, `sanctionedBy` |
| `APPLIED` | `REJECTED` | `loan:sanction` | `reason` (5–500 chars) | `rejectionReason`, `isActive = false` |
| `SANCTIONED` | `DISBURSED` | `loan:disburse` | — | `disbursedAt`, `disbursedBy` |
| `DISBURSED` | `CLOSED` | System (in the payment transaction) | — | `closedAt`, `isActive = false` |

Any other move → **409 `INVALID_TRANSITION`**. `REJECTED` and `CLOSED` are final. After either one, the borrower may apply again because `isActive` is false.

```ts
// services/loanTransition.service.ts (shape)
const TRANSITIONS = {
  APPROVE:  { from: 'APPLIED',    to: 'SANCTIONED', permission: 'loan:sanction' },
  REJECT:   { from: 'APPLIED',    to: 'REJECTED',   permission: 'loan:sanction' },
  DISBURSE: { from: 'SANCTIONED', to: 'DISBURSED',  permission: 'loan:disburse' },
} as const;
// The route already enforces the permission; the service checks it again (defence in depth)
if (!actor.permissions.has(t.permission)) throw new AppError(403, 'FORBIDDEN', '...');

// Atomic: only succeeds if the loan is still in `from`
const loan = await Loan.findOneAndUpdate(
  { _id: loanId, status: t.from },
  { $set: { status: t.to, ...extra }, $push: { history: { from: t.from, to: t.to, by: userId, at: new Date(), note } } },
  { new: true },
);
if (!loan) throw (await Loan.exists({ _id: loanId }))
  ? new AppError(409, 'INVALID_TRANSITION', `Loan is not in ${t.from} status`)
  : new AppError(404, 'NOT_FOUND', 'Loan not found');
```

---

## 4. Collections

### `permissions` (catalogue of everything the system can do)
| Field | Type | Notes |
|---|---|---|
| `key` | string | `resource:action`, e.g. `loan:sanction`, **unique index** |
| `resource` | string | `loan`, `payment`, `lead`, `application`, `role` |
| `action` | string | `read`, `sanction`, `disburse`, `record`, `manage_own`, `manage` |
| `description` | string | shown in the admin roles screen |
| timestamps | | |

Indexes: `{ key: 1 }` unique

> Permissions are seeded from a constant in code (`constants/permissions.ts`), because every permission must have code that enforces it. The seed upserts them, so the database catalogue and the code always match. Admins assign permissions to roles; they never invent new ones.

### `roles` (named bundles of permissions)
| Field | Type | Notes |
|---|---|---|
| `name` | string | uppercase, e.g. `SANCTION`, **unique index** |
| `description` | string | |
| `permissions` | string[] | permission keys; each must exist in `permissions` (validated on save) |
| `isSystem` | boolean | `true` for the 6 seeded roles: they can't be deleted or renamed, which prevents an admin lockout |
| `version` | number | incremented on every change to `permissions` |
| timestamps | | |

Indexes: `{ name: 1 }` unique

### `users`
| Field | Type | Notes |
|---|---|---|
| `name` | string | required, 2–80 chars |
| `email` | string | required, lowercase, trimmed, **unique index** |
| `passwordHash` | string | bcrypt (10 rounds), `select: false` |
| `roles` | ObjectId[] → roles | at least one; borrowers get `[BORROWER]` at signup |
| `permVersion` | number | incremented when this user's roles change or one of their roles is edited, so cached permissions are refreshed |
| `isActive` | boolean | `false` blocks login and every request (checked during permission resolution) |
| `createdAt`, `updatedAt` | Date | timestamps |

Indexes: `{ email: 1 }` unique · `{ roles: 1, createdAt: -1 }` (Sales lead list: users holding the BORROWER role; also finds every user of a role when it is edited)

### `borrowerprofiles` (1:1 with a borrower user)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → users | **unique** |
| `fullName` | string | |
| `pan` | string | uppercase, regex-validated |
| `dob` | Date | |
| `monthlySalary` | number (paise) | |
| `employmentMode` | enum | `SALARIED \| SELF_EMPLOYED \| UNEMPLOYED` |
| `bre` | `{ passed: boolean, failures: {rule, message}[], checkedAt: Date }` | latest BRE result, which also tells Sales how far the user got |
| `salarySlip` | `{ storageKey, originalName, mimeType, size, uploadedAt }` \| null | set in step 3, copied to the loan on apply |
| timestamps | | |

Indexes: `{ userId: 1 }` unique · `{ pan: 1 }`

> A separate collection keeps `users` small (auth reads it on every request). It also lets a borrower save details before applying, which is exactly what Sales tracks.

### `loans`
| Field | Type | Notes |
|---|---|---|
| `borrowerId` | ObjectId → users | |
| `applicant` | `{ fullName, pan, monthlySalary, employmentMode }` | **snapshot** at apply time, so later profile edits don't change a past application |
| `principal` | number (paise) | 5,000,000 – 50,000,000 (₹50K – ₹5L) |
| `tenureDays` | number | 30 – 365 |
| `annualRate` | number | 12 (fixed, stored so history stays correct if the rate ever changes) |
| `interest` | number (paise) | computed on the server |
| `totalRepayment` | number (paise) | principal + interest |
| `amountPaid` | number (paise) | starts at 0, `$inc` on each payment |
| `status` | enum | `APPLIED \| SANCTIONED \| REJECTED \| DISBURSED \| CLOSED` |
| `isActive` | boolean | true for APPLIED / SANCTIONED / DISBURSED |
| `salarySlip` | same shape as on the profile | |
| `rejectionReason` | string \| null | |
| `sanctionedAt/By`, `disbursedAt/By`, `closedAt` | Date / ObjectId | |
| `history` | `[{ from, to, by, at, note }]` | audit trail |
| timestamps | | |

Indexes:
- `{ status: 1, createdAt: -1 }` — every module queue
- `{ borrowerId: 1, createdAt: -1 }` — borrower's own loans
- `{ borrowerId: 1 }` **unique, partial** `{ isActive: true }` — one active loan per borrower
- `{ 'applicant.pan': 1 }` — search

### `payments`
| Field | Type | Notes |
|---|---|---|
| `loanId` | ObjectId → loans | |
| `utr` | string | trimmed, uppercased, 6–30 alphanumeric, **unique index** |
| `amount` | number (paise) | > 0 and ≤ outstanding |
| `paidOn` | Date | not in the future, not before `disbursedAt` |
| `recordedBy` | ObjectId → users | |
| timestamps | | |

Indexes: `{ utr: 1 }` unique · `{ loanId: 1, paidOn: -1 }`

**Outstanding** = `totalRepayment − amountPaid` (computed, never stored separately).

### Relationships
```
roles * ── * permissions        (roles.permissions holds permission keys)
users * ── * roles              (users.roles holds role ids)
users 1 ── 1 borrowerprofiles
users 1 ── * loans (at most 1 with isActive = true)
loans 1 ── * payments
users 1 ── * payments.recordedBy / loans.history.by (staff actions)
```

---

## 5. Business rules

### BRE (step 2) — `services/bre.service.ts`, shared rule list mirrored in `client/lib/bre.ts`

| Rule key | Check | Message on failure |
|---|---|---|
| `AGE` | 23 ≤ exact age ≤ 50 (birthday not reached this year → subtract 1) | "You must be between 23 and 50 years old." |
| `SALARY` | monthlySalary ≥ ₹25,000 | "Monthly salary must be at least ₹25,000." |
| `PAN` | `/^[A-Z]{5}[0-9]{4}[A-Z]$/` | "Enter a valid PAN, e.g. ABCDE1234F." |
| `EMPLOYMENT` | employmentMode ≠ `UNEMPLOYED` | "Applicants must be salaried or self-employed." |

All rules run every time and **all failures are returned**, so the user can fix everything at once. Response on failure: **422 `BRE_REJECTED`** with `details: [{ rule, message }]`. The result is saved on the profile (`bre`).

```ts
function ageOn(dob: Date, today = new Date()) {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
```

### Loan maths (step 4) — `utils/loanMath.ts`, same function used by the client panel

```
SI    = (P × R × T) / (365 × 100)      R = 12, T = tenure in days
Total = P + SI
```
In paise: `interest = Math.round(principalPaise * 12 * tenureDays / 36500)`.

Example: ₹1,00,000 for 180 days → SI = ₹5,917.81 → total ₹1,05,917.81.
Range checks: ₹50,000 ≤ P ≤ ₹5,00,000 · 30 ≤ T ≤ 365. Slider step: ₹5,000 and 1 day.
The server **recomputes** interest and total on apply and ignores any client-sent totals.

### Upload (step 3)
- Allowed: `application/pdf`, `image/jpeg`, `image/png`, and the extension must match (`.pdf .jpg .jpeg .png`).
- Max 5 MB → **413 `FILE_TOO_LARGE`**; wrong type → **415 `UNSUPPORTED_FILE_TYPE`**.
- Stored at `server/uploads/<userId>/<uuid>.<ext>`. Original filenames are never used on disk. Served only through an authorised route, never as a public static folder.

### Payments (collection)
Validation order:
1. Loan exists → else 404.
2. Loan status is `DISBURSED` → else 409 `INVALID_LOAN_STATUS`.
3. `utr` format valid; `amount > 0`; `paidOn` ≤ today and ≥ `disbursedAt` → else 400.
4. `amount ≤ outstanding` → else 422 `AMOUNT_EXCEEDS_OUTSTANDING` (message includes the outstanding amount).
5. Insert payment. A duplicate UTR hits the unique index (E11000) → 409 `DUPLICATE_UTR`.

```ts
// Inside session.withTransaction(...)
await Payment.create([{ loanId, utr, amount, paidOn, recordedBy }], { session });
const loan = await Loan.findOneAndUpdate(
  { _id: loanId, status: 'DISBURSED', $expr: { $lte: [{ $add: ['$amountPaid', amount] }, '$totalRepayment'] } },
  { $inc: { amountPaid: amount } },
  { new: true, session },
);
if (!loan) throw new AppError(422, 'AMOUNT_EXCEEDS_OUTSTANDING', '...');   // aborts the transaction, payment is rolled back
if (loan.amountPaid === loan.totalRepayment) {
  await Loan.updateOne(
    { _id: loanId, status: 'DISBURSED' },
    { $set: { status: 'CLOSED', closedAt: new Date(), isActive: false },
      $push: { history: { from: 'DISBURSED', to: 'CLOSED', by: recordedBy, at: new Date(), note: 'Auto-closed: fully repaid' } } },
    { session },
  );
}
```

---

## 6. REST API

Base path: `/api/v1`. JSON everywhere except the upload (multipart).

**Response shapes**
```jsonc
// success
{ "data": { ... } }
// list
{ "data": { "items": [...], "total": 42, "page": 1, "limit": 20 } }
// error
{ "error": { "code": "BRE_REJECTED", "message": "You are not eligible for a loan.", "details": [ { "rule": "SALARY", "message": "..." } ] } }
```
List query params everywhere: `page` (default 1), `limit` (default 20, max 100), `search` (name / email / PAN).

### Auth
| Method | Path | Permission | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/auth/signup` | public | `{ name, email, password }` (password ≥ 8, letter + digit) | 201 `{ user, token }` (user gets the BORROWER role) | 400, 409 `EMAIL_TAKEN` |
| POST | `/auth/login` | public (rate-limited) | `{ email, password }` | 200 `{ user, token }` | 400, 401 `INVALID_CREDENTIALS` / `ACCOUNT_DISABLED`, 429 |
| GET | `/auth/me` | any logged in | — | 200 `{ user: { id, name, email, roles: ['SANCTION'] }, permissions: ['loan:sanction', ...] }` | 401 |

`/auth/me` is how the client learns what to show. It always reflects the current permissions, even if roles were edited after login.

### Borrower
| Method | Path | Permission | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/borrower/application` | `application:manage_own` | — | 200 `{ profile, activeLoan, nextStep }` where nextStep ∈ `DETAILS \| UPLOAD \| CONFIGURE \| SUBMITTED` | 401, 403 |
| PUT | `/borrower/profile` | `application:manage_own` | `{ fullName, pan, dob, monthlySalary, employmentMode }` | 200 `{ profile }` (BRE passed) | 400, 422 `BRE_REJECTED`, 409 `ACTIVE_LOAN_EXISTS` |
| POST | `/borrower/salary-slip` | `application:manage_own` | multipart `file` | 201 `{ salarySlip }` | 409 `BRE_NOT_PASSED`, 413, 415 |
| POST | `/borrower/loans` | `application:manage_own` | `{ principal, tenureDays }` (rupees) | 201 `{ loan }` status `APPLIED` | 400, 409 `ACTIVE_LOAN_EXISTS` / `BRE_NOT_PASSED` / `SLIP_MISSING` |
| GET | `/borrower/loans` | `application:manage_own` | — | 200 list of own loans | |

All borrower routes act only on `req.user.id`, so a borrower can never reach another borrower's data.

### Shared loan detail
| Method | Path | Permission | Success | Errors |
|---|---|---|---|---|
| GET | `/loans/:id` | `loan:read`, **or** `application:manage_own` and the borrower owns the loan | 200 `{ loan, payments, outstanding }` | 403, 404 |
| GET | `/loans/:id/salary-slip` | `loan:document:read`, **or** `application:manage_own` and the borrower owns the loan | file stream | 403, 404 |

### Sales
| Method | Path | Permission | Success |
|---|---|---|---|
| GET | `/sales/leads?stage=` | `lead:read` | Borrowers with no active or past loan. `stage` ∈ `REGISTERED` (no profile) \| `BRE_FAILED` \| `ELIGIBLE` (passed BRE, not applied) |

### Sanction
| Method | Path | Permission | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/sanction/loans` | `loan:sanction` | — | list of `APPLIED` | |
| POST | `/sanction/loans/:id/approve` | `loan:sanction` | — | 200 `{ loan }` → SANCTIONED | 404, 409 |
| POST | `/sanction/loans/:id/reject` | `loan:sanction` | `{ reason }` | 200 `{ loan }` → REJECTED | 400, 404, 409 |

### Disbursement
| Method | Path | Permission | Success | Errors |
|---|---|---|---|---|
| GET | `/disbursement/loans` | `loan:disburse` | list of `SANCTIONED` | |
| POST | `/disbursement/loans/:id/disburse` | `loan:disburse` | 200 `{ loan }` → DISBURSED | 404, 409 |

### Collection
| Method | Path | Permission | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/collection/loans` | `payment:record` | — | list of `DISBURSED` with `amountPaid`, `outstanding` | |
| GET | `/collection/loans/:id/payments` | `payment:record` | — | payments, newest first | 404 |
| POST | `/collection/loans/:id/payments` | `payment:record` | `{ utr, amount, paidOn }` | 201 `{ payment, loan }` (loan may now be CLOSED) | 400, 404, 409 `DUPLICATE_UTR` / `INVALID_LOAN_STATUS`, 422 `AMOUNT_EXCEEDS_OUTSTANDING` |

### Roles admin (optional: build only if time allows; the data model already supports it)
| Method | Path | Permission | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/admin/permissions` | `role:manage` | — | the permission catalogue | |
| GET | `/admin/roles` | `role:manage` | — | roles with their permissions and user counts | |
| POST | `/admin/roles` | `role:manage` | `{ name, description, permissions[] }` | 201 `{ role }` | 400 unknown permission, 409 `ROLE_EXISTS` |
| PATCH | `/admin/roles/:id` | `role:manage` | `{ description?, permissions? }` | 200 `{ role }`; bumps `role.version` and every holder's `permVersion` | 400, 404 |
| PUT | `/admin/users/:id/roles` | `role:manage` | `{ roleIds[] }` | 200 `{ user }`; bumps that user's `permVersion` | 400, 404, 409 `LAST_ADMIN` (can't remove ADMIN from the last admin) |

### Ops
| Method | Path | Success |
|---|---|---|
| GET | `/health` | 200 `{ status: 'ok', db: 'up' }` or 503 if Mongo is down |

### Status codes
| Code | When |
|---|---|
| 200 / 201 | OK / created |
| 400 `VALIDATION_ERROR` | body or query fails zod validation (`details` = field errors) |
| 401 `UNAUTHENTICATED` / `INVALID_CREDENTIALS` | no token, bad or expired token, wrong login |
| 403 `FORBIDDEN` | logged in but missing the required permission |
| 404 `NOT_FOUND` | resource doesn't exist (or isn't the borrower's own) |
| 409 | state conflict: `EMAIL_TAKEN`, `DUPLICATE_UTR`, `INVALID_TRANSITION`, `ACTIVE_LOAN_EXISTS`, `BRE_NOT_PASSED`, `SLIP_MISSING`, `ROLE_EXISTS`, `LAST_ADMIN` |
| 413 / 415 | upload too large / wrong type |
| 422 | business rule failed: `BRE_REJECTED`, `AMOUNT_EXCEEDS_OUTSTANDING` |
| 429 | rate limit hit on auth |
| 500 / 503 | unexpected error (no stack in response) / database unavailable |

---

## 7. Auth & RBAC

### How a request is authorised

```
Request ──▶ authenticate ──────────────────▶ requirePermission('loan:sanction') ──▶ controller ──▶ service
            verify JWT → userId               permissions.has(key)?                                (record-level checks:
            resolve permissions (cached)      no → 403                                              ownership, status)
            no/invalid token → 401
```

**1. Login** (`POST /auth/login`): check the password, check `isActive`, and sign a JWT `{ sub: userId }` (HS256, 1 day). The token holds **no permissions**, so role edits never leave stale rights inside old tokens.

**2. `authenticate` middleware → 401**
```ts
const { sub } = jwt.verify(token, env.JWT_SECRET);
req.user = await permissionService.getUserAccess(sub);   // { id, roles: string[], permissions: Set<string> }
```

**3. `permissionService.getUserAccess(userId)`** — in-memory cache, so access checks almost never touch the database
```ts
const cache = new Map<string, { access: UserAccess; expiresAt: number }>();   // TTL 5 min

async function getUserAccess(userId: string): Promise<UserAccess> {
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.access;

  // One query: the user plus their roles' permission keys
  const user = await User.findById(userId).select('name email roles isActive permVersion')
    .populate<{ roles: RoleDoc[] }>('roles', 'name permissions').lean();
  if (!user || !user.isActive) throw new AppError(401, 'UNAUTHENTICATED', 'Session is no longer valid');

  const access = {
    id: userId,
    roles: user.roles.map(r => r.name),
    permissions: new Set(user.roles.flatMap(r => r.permissions)),   // union of all roles
    permVersion: user.permVersion,
  };
  cache.set(userId, { access, expiresAt: Date.now() + 5 * 60_000 });
  return access;
}

export const invalidateUsers = (userIds: string[]) => userIds.forEach(id => cache.delete(id));
```

**4. `requirePermission` middleware → 403**
```ts
export const requirePermission = (...required: Permission[]) => (req, _res, next) =>
  required.every(p => req.user.permissions.has(p))
    ? next()
    : next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do this'));

// routes/sanction.routes.ts
router.use(authenticate, requirePermission(PERMISSIONS.LOAN_SANCTION));
```
`requireAnyPermission(...)` is used where either of two rules is enough, e.g. loan detail for staff (`loan:read`) or the owning borrower.

**5. Record-level checks** live in services, not middleware: a borrower can only touch their own profile and loans, and a loan must be in the right status for the action.

### When roles change
1. An admin edits a role (or a user's roles) through `/admin/*`.
2. In one transaction, the server bumps `role.version`, and bumps `permVersion` on every user holding that role (`User.updateMany({ roles: roleId }, { $inc: { permVersion: 1 } })`, using the `roles` index).
3. `invalidateUsers(ids)` clears their cache entries, so the new permissions apply on their **next request**.
4. Deactivating a user (`isActive: false`) works the same way and takes effect immediately.

### Scaling further (documented, not built today)
| When | Change |
|---|---|
| Several server instances | Move the cache to Redis (`perm:<userId>` with TTL) and broadcast invalidations with Redis pub/sub. The 5-minute TTL already bounds staleness if a message is missed. |
| Hundreds of permissions | Store each user's permission set as a bitmask, so a check is one bitwise AND |
| Conditional rules ("sanction up to ₹2L", "own branch only") | Attach conditions to role permissions, e.g. `{ key: 'loan:sanction', conditions: { maxPrincipal: 200000 } }`, and evaluate them with a policy library (CASL / Casbin) in the service |
| Org-wide identity | Issue tokens from an SSO provider; keep the same permission resolution |

Routes never change in any of these steps, because they only ever ask for a permission.

### Frontend
- Token kept in `localStorage`. The `AuthProvider` calls `/auth/me` on start and stores `user` and `permissions`. The API client sends the bearer header and redirects to `/login` on 401.
- `usePermission()` hook → `can('loan:disburse')`. A `<RequirePermission perm="loan:sanction">` wrapper guards pages: `/apply` and `/my-loans` need `application:manage_own`, and `/dashboard/<module>` needs that module's permission. Without it the user sees a "No access" screen with a link to their home.
- The sidebar is built from the module → permission map, so each user sees only the modules they hold permissions for. Admin sees all four because it holds all four permissions.
- After login, the user goes to their home: `application:manage_own` → `/apply`; one module permission → that module; several → `/dashboard` (a module picker).
- Hiding UI is only for convenience. Every API route enforces the same permission on the server.

---

## 8. Seed (`npm run seed`, idempotent: safe to run again)

The seed runs in this order, upserting each item by its unique key:
1. **Permissions** from `constants/permissions.ts` (upsert by `key`)
2. **Roles** from `constants/defaultRoles.ts` with their permission keys (upsert by `name`, `isSystem: true`)
3. **Users**, one per role, linked to that role (upsert by `email`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@lms.dev | Admin@123 |
| Sales | sales@lms.dev | Sales@123 |
| Sanction | sanction@lms.dev | Sanction@123 |
| Disbursement | disbursement@lms.dev | Disburse@123 |
| Collection | collection@lms.dev | Collect@123 |
| Borrower | borrower@lms.dev | Borrower@123 |

Optional: the seed can also create a few demo borrowers in different stages, so every queue has data during the demo.

---

## 9. Folder structure

```
lms/
├── README.md
├── docs/DESIGN.md
├── server/
│   ├── .env.example
│   ├── package.json · tsconfig.json · .eslintrc
│   ├── uploads/                      (gitignored)
│   └── src/
│       ├── app.ts                    express app: helmet, cors, json, logger, routes, error handler
│       ├── server.ts                 connect DB, listen, graceful shutdown
│       ├── config/env.ts             zod-validated env
│       ├── config/db.ts
│       ├── constants/                permissions.ts, defaultRoles.ts, modules.ts (module → permission), loanStatus.ts
│       ├── models/                   Permission.ts, Role.ts, User.ts, BorrowerProfile.ts, Loan.ts, Payment.ts
│       ├── middleware/               authenticate.ts, requirePermission.ts, validate.ts, upload.ts, rateLimit.ts, errorHandler.ts
│       ├── validators/               auth.schema.ts, borrower.schema.ts, loan.schema.ts, payment.schema.ts, role.schema.ts
│       ├── services/                 auth, permission (resolve + cache + invalidate), role, bre, loan, loanTransition, payment, storage
│       ├── controllers/              auth, borrower, loan, sales, sanction, disbursement, collection, admin (optional)
│       ├── routes/                   index.ts + one file per area
│       ├── utils/                    AppError.ts, asyncHandler.ts, money.ts, loanMath.ts, pagination.ts
│       └── scripts/seed.ts
└── client/
    ├── .env.example
    ├── app/
    │   ├── (auth)/login/page.tsx · (auth)/signup/page.tsx
    │   ├── apply/page.tsx            multi-step: details → upload → configure → submitted
    │   ├── my-loans/page.tsx         status timeline
    │   └── dashboard/
    │       ├── layout.tsx            sidebar built from permissions + guard
    │       ├── page.tsx              admin overview / redirect
    │       ├── sales/page.tsx · sanction/page.tsx · disbursement/page.tsx · collection/page.tsx
    ├── components/                   ui/ (Button, Input, Modal, Toast, Table, Badge, Skeleton, Slider), forms/, dashboard/
    ├── lib/                          api.ts, auth-context.tsx, use-permission.ts, modules.ts, bre.ts, loanMath.ts, format.ts (₹, dates)
    └── types/                        shared API types
```

---

## 10. Environment variables

**server/.env.example**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/lms
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=5
```

**client/.env.example**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 11. Frontend screens

| Route | Who | Content |
|---|---|---|
| `/login`, `/signup` | public | Forms with inline errors. Login redirects to the user's home based on permissions. |
| `/apply` | `application:manage_own` | Stepper: 1 Account ✓ → 2 Details → 3 Salary slip → 4 Loan. Opens at `nextStep`. |
| `/my-loans` | `application:manage_own` | Current loan card: status badge, amounts, timeline from `history`, rejection reason |
| `/dashboard/sales` | `lead:read` | Leads table: name, email, signed up, stage chip; stage filter + search |
| `/dashboard/sanction` | `loan:sanction` | Applied queue → detail drawer (applicant snapshot, BRE, slip link) → Approve / Reject (reason modal) |
| `/dashboard/disbursement` | `loan:disburse` | Sanctioned queue → Disburse confirm modal |
| `/dashboard/collection` | `payment:record` | Disbursed queue with paid / outstanding bar → Record payment form + payment history |
| `/dashboard/roles` *(optional)* | `role:manage` | Roles list with permission checkboxes; assign roles to users |
