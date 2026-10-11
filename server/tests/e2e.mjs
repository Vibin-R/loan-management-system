// End-to-end API test: walks the whole loan lifecycle against a running API + database.
// Prereqs: `npm run seed`, then `npm run dev`. Run: `npm run test:e2e` (API_URL overrides the base).
// Each run signs up fresh borrowers, so it can be repeated without resetting the database.

const B = process.env.API_URL ?? 'http://localhost:5000/api/v1';
let pass = 0,
  fail = 0;
const results = [];
function check(name, ok, detail = '') {
  if (ok) pass++;
  else fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const r = await fetch(B + path, { method, headers, body: payload });
  const ct = r.headers.get('content-type') || '';
  const json = ct.includes('json') ? await r.json() : null;
  return { status: r.status, json, ct };
}
const login = async (email, password) =>
  (await call('POST', '/auth/login', { body: { email, password } })).json?.data?.token;
const yearsAgo = (y, shiftDays = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setDate(d.getDate() + shiftDays);
  return d.toISOString().slice(0, 10);
};
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
  new Date(Date.now() - 864e5),
);
const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
  new Date(Date.now() + 864e5),
);
const pdf = (name = 'slip.pdf', size = 2048) => {
  const f = new FormData();
  const buf = Buffer.alloc(size, 0x20);
  buf.write('%PDF-1.7\n');
  f.append('file', new Blob([buf], { type: 'application/pdf' }), name);
  return f;
};
const file = (name, bytes, type) => {
  const f = new FormData();
  f.append('file', new Blob([bytes], { type }), name);
  return f;
};
const run = Date.now();

// ── Auth & seeded logins ───────────────────────────────────────────────
const T = {};
for (const [role, email, pw] of [
  ['admin', 'admin@lms.dev', 'Admin@123'],
  ['sales', 'sales@lms.dev', 'Sales@123'],
  ['sanction', 'sanction@lms.dev', 'Sanction@123'],
  ['disb', 'disbursement@lms.dev', 'Disburse@123'],
  ['coll', 'collection@lms.dev', 'Collect@123'],
  ['borrower', 'borrower@lms.dev', 'Borrower@123'],
]) {
  T[role] = await login(email, pw);
  check(`seed login: ${email}`, Boolean(T[role]));
}
check(
  'wrong password → 401',
  (await call('POST', '/auth/login', { body: { email: 'admin@lms.dev', password: 'nope' } }))
    .status === 401,
);
const me = await call('GET', '/auth/me', { token: T.admin });
check(
  'admin /auth/me lists 7 staff permissions',
  me.json?.data?.permissions?.length === 7,
  me.json?.data?.permissions?.join(','),
);

// Fresh borrowers for this run
const signup = async (n) =>
  await call('POST', '/auth/signup', {
    body: { name: 'Test User ' + n, email: `t${run}${n}@test.dev`, password: 'Passw0rd1' },
  });
const s1 = await signup('a');
const B1 = s1.json?.data?.token;
check(
  'signup → 201 with BORROWER role',
  s1.status === 201 && s1.json?.data?.user?.roles?.[0] === 'BORROWER',
);
check('duplicate email → 409 EMAIL_TAKEN', (await signup('a')).json?.error?.code === 'EMAIL_TAKEN');
const B2 = (await signup('b')).json?.data?.token;
await signup('c'); // stays untouched → REGISTERED lead

// ── t1: BRE fail cases ────────────────────────────────────────────────
const good = {
  fullName: 'Priya Sharma',
  pan: 'ABCPS1234K',
  dob: '1994-06-15',
  monthlySalary: 60000,
  employmentMode: 'SALARIED',
};
const bre = async (over) => {
  const r = await call('PUT', '/borrower/profile', { token: B1, body: { ...good, ...over } });
  return r.status === 422 ? r.json.error.details.map((d) => d.rule).join(',') : String(r.status);
};
check(
  'BRE: age 22 (23rd birthday tomorrow) → AGE',
  (await bre({ dob: yearsAgo(23, 1) })) === 'AGE',
);
check('BRE: age exactly 23 today → pass', (await bre({ dob: yearsAgo(23) })) === '200');
check('BRE: age 51 → AGE', (await bre({ dob: yearsAgo(51) })) === 'AGE');
check(
  'BRE: age 50 (51st birthday tomorrow) → pass',
  (await bre({ dob: yearsAgo(51, 1) })) === '200',
);
check('BRE: salary 24999 → SALARY', (await bre({ monthlySalary: 24999 })) === 'SALARY');
check('BRE: salary 25000 → pass', (await bre({ monthlySalary: 25000 })) === '200');
check(
  'BRE: PAN ABCD1234E → PAN',
  (await bre({ pan: 'ABCD1234E' })) === 'PAN',
  'shape check catches 9 chars first?',
);
check('BRE: PAN 1BCDE1234F → PAN', (await bre({ pan: '1BCDE1234F' })) === 'PAN');
check(
  'BRE: unemployed → EMPLOYMENT',
  (await bre({ employmentMode: 'UNEMPLOYED' })) === 'EMPLOYMENT',
);
check(
  'BRE: all four fail together',
  (await bre({
    dob: yearsAgo(20),
    monthlySalary: 1000,
    pan: '1234567890',
    employmentMode: 'UNEMPLOYED',
  })) === 'AGE,SALARY,PAN,EMPLOYMENT',
);
const leadsAfterFail = await call('GET', `/sales/leads?stage=BRE_FAILED&search=t${run}a`, {
  token: T.sales,
});
check(
  'Sales sees BRE_FAILED lead with reason',
  leadsAfterFail.json?.data?.items?.[0]?.profile?.breFailures?.length === 4,
);
check(
  'upload blocked before BRE pass → 409',
  (await call('POST', '/borrower/salary-slip', { token: B1, form: pdf() })).json?.error?.code ===
    'BRE_NOT_PASSED',
);
check('BRE pass with lowercase PAN', (await bre({ pan: 'abcps1234k' })) === '200');

// ── t2: upload limits ──────────────────────────────────────────────────
check(
  '6 MB PDF → 413',
  (
    await call('POST', '/borrower/salary-slip', {
      token: B1,
      form: pdf('big.pdf', 6 * 1024 * 1024),
    })
  ).status === 413,
);
check(
  '.docx → 415',
  (
    await call('POST', '/borrower/salary-slip', {
      token: B1,
      form: file('slip.docx', Buffer.from('PK\x03\x04docx'), 'application/vnd.openxmlformats'),
    })
  ).status === 415,
);
check(
  'exe renamed .pdf → 415',
  (
    await call('POST', '/borrower/salary-slip', {
      token: B1,
      form: file('slip.pdf', Buffer.from('MZ\x90\x00binary'), 'application/pdf'),
    })
  ).status === 415,
);
check(
  'apply without slip → 409 SLIP_MISSING',
  (
    await call('POST', '/borrower/loans', {
      token: B1,
      body: { principal: 100000, tenureDays: 180 },
    })
  ).json?.error?.code === 'SLIP_MISSING',
);
check(
  'valid PDF → 201',
  (await call('POST', '/borrower/salary-slip', { token: B1, form: pdf() })).status === 201,
);
const app1 = await call('GET', '/borrower/application', { token: B1 });
check('application resumes at CONFIGURE', app1.json?.data?.nextStep === 'CONFIGURE');

// ── Apply ──────────────────────────────────────────────────────────────
check(
  'principal 49999 → 400',
  (
    await call('POST', '/borrower/loans', {
      token: B1,
      body: { principal: 49999, tenureDays: 180 },
    })
  ).status === 400,
);
check(
  'tenure 366 → 400',
  (
    await call('POST', '/borrower/loans', {
      token: B1,
      body: { principal: 100000, tenureDays: 366 },
    })
  ).status === 400,
);
const applied = await call('POST', '/borrower/loans', {
  token: B1,
  body: { principal: 100000, tenureDays: 180, interest: 1, totalRepayment: 1 },
});
const L1 = applied.json?.data?.loan;
const activeLeads =
  (await call('GET', `/sales/leads?search=t${run}a`, { token: T.sales })).json?.data?.items ?? [];
check(
  'Sales: borrower with an active loan is not a lead',
  !activeLeads.some((l) => l.email === `t${run}a@test.dev`),
);
check('apply → 201 APPLIED', applied.status === 201 && L1?.status === 'APPLIED');
check(
  'server computed SI ₹5,917.81 / total ₹1,05,917.81 (ignores client numbers)',
  L1?.interest === 5917.81 && L1?.totalRepayment === 105917.81,
  `${L1?.interest} / ${L1?.totalRepayment}`,
);
check(
  'second application while active → 409',
  (
    await call('POST', '/borrower/loans', {
      token: B1,
      body: { principal: 100000, tenureDays: 180 },
    })
  ).json?.error?.code === 'ACTIVE_LOAN_EXISTS',
);
check(
  'profile change while active → 409',
  (await call('PUT', '/borrower/profile', { token: B1, body: good })).status === 409,
);

// Second borrower for the reject path
await call('PUT', '/borrower/profile', { token: B2, body: { ...good, pan: 'BQRPV5678L' } });
await call('POST', '/borrower/salary-slip', { token: B2, form: pdf() });
const L2 = (
  await call('POST', '/borrower/loans', { token: B2, body: { principal: 250000, tenureDays: 90 } })
).json?.data?.loan;
check('second borrower applied', L2?.status === 'APPLIED');

// ── t6: RBAC from the API ─────────────────────────────────────────────
const matrix = [
  ['/sales/leads', 'sales'],
  ['/sanction/loans', 'sanction'],
  ['/disbursement/loans', 'disb'],
  ['/collection/loans', 'coll'],
];
for (const [path, owner] of matrix) {
  check(`${path}: no token → 401`, (await call('GET', path)).status === 401);
  for (const role of ['sales', 'sanction', 'disb', 'coll', 'borrower', 'admin']) {
    const expected = role === owner || role === 'admin' ? 200 : 403;
    const got = (await call('GET', path, { token: T[role] })).status;
    check(`${path} as ${role} → ${expected}`, got === expected, `got ${got}`);
  }
}
check(
  'staff cannot use borrower routes (admin → 403)',
  (await call('GET', '/borrower/application', { token: T.admin })).status === 403,
);
check(
  "borrower reading another borrower's loan → 404",
  (await call('GET', `/loans/${L1.id}`, { token: B2 })).status === 404,
);
check(
  'owner reads own loan → 200',
  (await call('GET', `/loans/${L1.id}`, { token: B1 })).status === 200,
);
const slip = await call('GET', `/loans/${L1.id}/salary-slip`, { token: T.sanction });
check(
  'sanction opens salary slip → 200 application/pdf',
  slip.status === 200 && slip.ct.includes('application/pdf'),
);
check(
  'collection cannot open salary slip → 403',
  (await call('GET', `/loans/${L1.id}/salary-slip`, { token: T.coll })).status === 403,
);
check(
  'search by PAN in sanction queue',
  (
    await call('GET', '/sanction/loans?search=ABCPS1234K', { token: T.sanction })
  ).json?.data?.items?.some((l) => l.id === L1.id),
);

// ── Sanction (approve with double-click race, reject path) ────────────
check(
  'disburse before sanction → 409',
  (await call('POST', `/disbursement/loans/${L1.id}/disburse`, { token: T.disb })).json?.error
    ?.code === 'INVALID_TRANSITION',
);
const [ap1, ap2] = await Promise.all([
  call('POST', `/sanction/loans/${L1.id}/approve`, { token: T.sanction }),
  call('POST', `/sanction/loans/${L1.id}/approve`, { token: T.sanction }),
]);
check(
  'double-click Approve: exactly one 200, one 409',
  [ap1.status, ap2.status].sort().join() === '200,409',
  `${ap1.status},${ap2.status}`,
);
check(
  'reject with 3-char reason → 400',
  (
    await call('POST', `/sanction/loans/${L2.id}/reject`, {
      token: T.sanction,
      body: { reason: 'bad' },
    })
  ).status === 400,
);
check(
  'reject with reason → 200 REJECTED',
  (
    await call('POST', `/sanction/loans/${L2.id}/reject`, {
      token: T.sanction,
      body: { reason: 'Salary slip does not match declared income' },
    })
  ).json?.data?.loan?.status === 'REJECTED',
);
const b2loans = await call('GET', '/borrower/loans', { token: B2 });
check(
  't4: borrower sees rejection reason',
  b2loans.json?.data?.items?.[0]?.rejectionReason === 'Salary slip does not match declared income',
);
check(
  'rejected borrower can start again (profile editable)',
  (await call('PUT', '/borrower/profile', { token: B2, body: { ...good, pan: 'BQRPV5678L' } }))
    .status === 200,
);

// ── Disburse (race) ───────────────────────────────────────────────────
const [d1, d2] = await Promise.all([
  call('POST', `/disbursement/loans/${L1.id}/disburse`, { token: T.disb }),
  call('POST', `/disbursement/loans/${L1.id}/disburse`, { token: T.disb }),
]);
check(
  'double-click Disburse: exactly one 200, one 409',
  [d1.status, d2.status].sort().join() === '200,409',
  `${d1.status},${d2.status}`,
);

// ── t5: payments ──────────────────────────────────────────────────────
const pay = (body, token = T.coll) =>
  call('POST', `/collection/loans/${L1.id}/payments`, { token, body });
check(
  'payment dated tomorrow → 400',
  (await pay({ utr: `F${run}`, amount: 100, paidOn: tomorrow })).status === 400,
);
check(
  'payment dated before disbursal → 400',
  (await pay({ utr: `Y${run}`, amount: 100, paidOn: yesterday })).status === 400,
);
check(
  'payment dated today (same day as disbursal) → allowed',
  (await pay({ utr: `A${run}`, amount: 5000, paidOn: today })).status === 201,
);
check(
  'amount with 3 decimals → 400',
  (await pay({ utr: `D${run}`, amount: 10.555, paidOn: today })).status === 400,
);
check(
  'overpayment → 422',
  (await pay({ utr: `O${run}`, amount: 200000, paidOn: today })).json?.error?.code ===
    'AMOUNT_EXCEEDS_OUTSTANDING',
);
check(
  'duplicate UTR → 409',
  (await pay({ utr: `A${run}`, amount: 100, paidOn: today })).json?.error?.code === 'DUPLICATE_UTR',
);
const [r1, r2] = await Promise.all([
  pay({ utr: `R${run}`, amount: 1000, paidOn: today }),
  pay({ utr: `R${run}`, amount: 1000, paidOn: today }),
]);
check(
  'same UTR submitted twice at once: one 201, one 409',
  [r1.status, r2.status].sort().join() === '201,409',
  `${r1.status},${r2.status}`,
);
const mid = (await call('GET', `/loans/${L1.id}`, { token: T.admin })).json?.data;
check(
  'partial payments add up (5,000 + 1,000)',
  mid?.loan?.amountPaid === 6000 && mid?.payments?.length === 2,
  `paid ${mid?.loan?.amountPaid}, payments ${mid?.payments?.length}`,
);
check(
  'outstanding = total − paid',
  mid?.loan?.outstanding === 99917.81,
  String(mid?.loan?.outstanding),
);
const final = await pay({ utr: `Z${run}`, amount: 99917.81, paidOn: today });
check(
  'final payment → loan CLOSED automatically',
  final.json?.data?.loan?.status === 'CLOSED' && final.json?.data?.loan?.outstanding === 0,
);
check(
  'history ends DISBURSED → CLOSED "Fully repaid"',
  final.json?.data?.loan?.history?.at(-1)?.note === 'Fully repaid',
);
check(
  'payment after close → 409',
  (await pay({ utr: `X${run}`, amount: 1, paidOn: today })).json?.error?.code ===
    'INVALID_LOAN_STATUS',
);
check(
  'closed loan left the collection queue',
  !(await call('GET', '/collection/loans', { token: T.coll })).json?.data?.items?.some(
    (l) => l.id === L1.id,
  ),
);

// ── After close: new application needs a fresh slip ───────────────────
check(
  'after close: can update profile again',
  (await call('PUT', '/borrower/profile', { token: B1, body: good })).status === 200,
);
check(
  'after close: old slip not reused → SLIP_MISSING',
  (await call('POST', '/borrower/loans', { token: B1, body: { principal: 50000, tenureDays: 30 } }))
    .json?.error?.code === 'SLIP_MISSING',
);

// ── Sales lead stages ─────────────────────────────────────────────────
const leads =
  (await call('GET', `/sales/leads?search=t${run}`, { token: T.sales })).json?.data?.items ?? [];
check(
  'Sales: untouched signup shows as REGISTERED',
  leads.some((l) => l.email === `t${run}c@test.dev` && l.stage === 'REGISTERED'),
);
check(
  'Sales: borrower re-applying after close is a lead again',
  leads.some((l) => l.email === `t${run}a@test.dev`),
);
check(
  'pagination limit enforced (limit=1)',
  (await call('GET', '/sales/leads?limit=1', { token: T.sales })).json?.data?.items?.length === 1,
);

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
